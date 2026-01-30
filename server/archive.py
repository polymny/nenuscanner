import builtins
from datetime import datetime
from flask import Response
import functools
import os
import zlib
from typing import Optional
import time

# Chunks for crc 32 computation
CRC32_CHUNK_SIZE = 65_536

# 4MiB chunks
CHUNK_SIZE = 4_194_304

# ASCII value for space
SPACE = ord(' ')

# ASCII value for zero
ZERO = ord('0')


def tar_header_chunk(filename: str, filepath: str) -> bytes:
    """
    Returns the 512 bytes header for a tar file in a tar archive.

    Args:
        filename (str): path of where the file will be in the archive.
        filepath (str): path of where the file is currently on the disk.
    """

    # Returns the octal representation without the initial
    def oct(i: int) -> str:
        return builtins.oct(i)[2:]

    stat = os.stat(filepath)
    buffer = bytearray(512)

    # Field 1: filename on 100 bytes
    buffer[0:len(filename)] = filename.encode('ascii')

    # Field 2: mode, on 8 bytes, octal, last byte must be \x00, so we set only the first 7 bytes
    buffer[100:107] = oct(stat.st_mode).rjust(7, '0').encode('ascii')

    # Field 3: owner, on 8 bytes, octal, last byte must be \x00, so we set only the first 7 bytes
    buffer[108:115] = oct(stat.st_uid).rjust(7, '0').encode('ascii')

    # Field 4: group, on 8 bytes, octal, last byte must be \x00, so we set only the first 7 bytes
    buffer[116:123] = oct(stat.st_gid).rjust(7, '0').encode('ascii')

    # Field 5: file size in bytes, on 12 bytes, octal, last byte must be \x00, so we set only the first 11 bytes
    buffer[124:135] = oct(stat.st_size).rjust(11, '0').encode('ascii')

    # Field 6: last modified, on 12 bytes, octal, last byte must be \x00, so we set only the first 11 bytes
    buffer[136:147] = oct(int(stat.st_mtime)).rjust(11, '0').encode('ascii')

    # Field 7: checksum, we fill it at the end

    # Field 8: type flag, 0 because we only have regular files
    buffer[156] = ZERO

    # Field 9: linkname, \x00s because we only have regular files

    # POSIX 1003.1-1990: 255 empty bytes

    # Compute the checksum: we start at 256 which are the 8 fields of checksum filled with spaces (32 * 8)
    checksum = oct(functools.reduce(lambda x, y: x + y, buffer, 256)).rjust(6, '0').encode('ascii')
    buffer[148:154] = checksum

    # Don't ask me why, but the checksum must end with b'\x00 ', so we skip the \x00 and write the space
    buffer[155] = SPACE

    return bytes(buffer)


class ArchiveSender:
    """
    Helper class to send archives over the network.

    This class is abstract, and needs to be derived by specific archive sender classes.
    """

    def __init__(self):
        """
        Creates a new archive sender.
        """
        self.files: dict[str, str] = {}

    def add_file(self, filename: str, filepath: str):
        """
        Adds a file to the archive.

        Args:
            filename (str): path of where the file will be in the archive.
            filepath (str): path of where the file is currently on the disk.
        """
        self.files[filename] = filepath

    def content_length(self) -> Optional[int]:
        """
        Returns the size of the archive if it is computable beforehand, none otherwise.
        """
        return None

    def generator(self):
        """
        Returns a generator that yields the bytes of the archive.
        """
        raise NotImplementedError("Abstract method")

    def mime_type(self) -> str:
        """
        Returns the mime type of the archive.
        """
        raise NotImplementedError("Abstract method")

    def archive_name(self) -> str:
        """
        Returns the name of the archive.

        This method is useful for web applications where the archive will be downloaded.
        """
        raise NotImplementedError("Abstract method")

    def response(self) -> Response:
        """
        Returns a flask reponse for the archive.
        """
        headers = {'Content-Disposition': f'attachment; filename="{self.archive_name()}"'}

        length = self.content_length()
        if length is not None:
            headers['Content-Length'] = str(length)

        return Response(
            self.generator(),
            mimetype=self.mime_type(),
            headers=headers,
        )


class TarSender(ArchiveSender):
    """
    A sender for tar archives computed on the fly.
    """

    def generator(self):
        def generate():
            for name, file in self.files.items():
                yield tar_header_chunk(name, file)

                bytes_sent = 0

                with open(file, 'rb') as f:
                    while True:
                        bytes = f.read(CHUNK_SIZE)

                        if len(bytes) == 0:
                            break

                        bytes_sent += len(bytes)
                        yield bytes

                    # Because tar use records of 512 bytes, we need to pad the
                    # file with zeroes to fill the last chunk
                    yield b'\x00' * (512 - bytes_sent % 512)
        return generate()

    def mime_type(self) -> str:
        return 'application/x-tar'

    def archive_name(self) -> str:
        return 'archive.tar'

    def content_length(self) -> int:
        length = 0

        for file in self.files.values():
            stat = os.stat(file)

            # Add size of header, and size of content ceiled to 512 bytes
            length += 512 + stat.st_size + (512 - stat.st_size % 512)

        return length


def crc32(filename) -> int:
    """
    Computes the CRC32 checksum for the file.

    Args:
        filename (str): path to the file of which the CRC32 needs to be computed.
    """
    with open(filename, 'rb') as fh:
        hash = 0
        while True:
            s = fh.read(CRC32_CHUNK_SIZE)
            if not s:
                break
            hash = zlib.crc32(s, hash)
        return hash


def zip_local_file_header(filename: str, filepath: str, crc: int) -> bytes:
    """
    Generates the bytes for the local file header of the file.

    Args:
        filename (str): path of where the file will be in the archive.
        filepath (str): path of where the file is currently on the disk.
        crc (int):
            the CRC 32 checksum of the file. It is not computed by this function because it is also required in the
            central directory file header, so the user of this function should compute it beforehand, and reuse it later
            to avoid computing it twice.
    """
    buffer_size = 30 + len(filename)
    buffer = bytearray(buffer_size)
    stat = os.stat(filepath)

    # Field 1: local file header signature (buffer[0:4])
    buffer[0:4] = b'\x50\x4b\x03\x04'

    # Field 2: version needed to extract (minimum) (buffer[4:6])
    buffer[4:6] = b'\x0a'

    # Field 3: general purpose bit flag (buffer[6:8]), leave at 0

    # Field 4: compression mode (buffer[8:10]), leave at 0 (uncompressed)

    # Field 5: file last modification time (buffer[10:14])
    mtime = datetime.fromtimestamp(stat.st_mtime)
    buffer[10:12] = ((mtime.second // 2) | (mtime.minute << 5) | (mtime.hour << 11)).to_bytes(2, byteorder='little')
    buffer[12:14] = (mtime.day | (mtime.month << 5) | ((mtime.year - 1980) << 9)).to_bytes(2, byteorder='little')

    # Field 6: crc-32 of uncompressed data (buffer[14:18])
    buffer[14:18] = crc.to_bytes(4, byteorder='little')

    # Field 7: compressed size (buffer[18:22])
    buffer[18:22] = stat.st_size.to_bytes(4, byteorder='little')

    # Field 8: uncompressed size (buffer[22:26])
    buffer[22:26] = stat.st_size.to_bytes(4, byteorder='little')

    # Field 9: filename length (buffer[26:28])
    buffer[26:28] = len(filename).to_bytes(2, byteorder='little')

    # Field 10: extra field length (buffer[28:30])

    # Field 11: filename (buffer[30:30+len(filename)])
    buffer[30:30+len(filename)] = filename.encode('ascii')

    return bytes(buffer)


def zip_central_directory_file_header(filename: str, filepath: str, crc: int, offset: int) -> bytes:
    """
    Generates the bytes for the central directory file header of the file.

    Args:
        filename (str): path of where the file will be in the archive.
        filepath (str): path of where the file is currently on the disk.
        crc (int):
            the CRC 32 checksum of the file. It is not computed by this function because it is also required in the
            local file header, so the user of this function should compute it beforehand, and reuse it later to avoid
            computing it twice.
        offset (int): number of bytes where the file starts.
    """
    buffer_size = 46 + len(filename)
    buffer = bytearray(buffer_size)
    stat = os.stat(filepath)

    # Field 1: central directory file header signature (buffer[0:4])
    buffer[0:4] = b'\x50\x4b\x01\x02'

    # Field 2: version made by (buffer[4:6])
    buffer[4:6] = b'\x0a'

    # Field 3: version needed to extract (minimum) (buffer[6:8])
    buffer[6:8] = b'\x0a'

    # Field 3: general purpose bit flag (buffer[8:10]), leave at 0

    # Field 4: compression mode (buffer[10:12]), leave at 0 (uncompressed)

    # Field 5: file last modification time (buffer[12:16])
    mtime = datetime.fromtimestamp(stat.st_mtime)
    buffer[12:14] = ((mtime.second // 2) | (mtime.minute << 5) | (mtime.hour << 11)).to_bytes(2, byteorder='little')
    buffer[14:16] = (mtime.day | (mtime.month << 5) | ((mtime.year - 1980) << 9)).to_bytes(2, byteorder='little')

    # Field 6: crc-32 of uncompressed data (buffer[16:20])
    buffer[16:20] = crc.to_bytes(4, byteorder='little')

    # Field 7: compressed size (buffer[20:24])
    buffer[20:24] = stat.st_size.to_bytes(4, byteorder='little')

    # Field 8: uncompressed size (buffer[24:28])
    buffer[24:28] = stat.st_size.to_bytes(4, byteorder='little')

    # Field 9: filename length (buffer[28:30])
    buffer[28:30] = len(filename).to_bytes(2, byteorder='little')

    # Field 10: extra field length (buffer[30:32])

    # Field 11: file comment length (buffer[32:34])

    # Field 12: disk number where file starts (buffer[34:36])

    # Field 13: internal file attributes (buffer[36:38])

    # Field 14: external file attributes (buffer[38:42])

    # Field 15: relative offset of the local file header (buffer[42:46])
    buffer[42:46] = offset.to_bytes(4, byteorder='little')

    # Field 16: filename (buffer[46:46+len(filename)])
    buffer[46:46+len(filename)] = filename.encode('ascii')

    return bytes(buffer)


def zip_end_of_central_directory(items_number: int, central_directory_size: int, central_directory_offset: int):
    """
    Generates the bytes for the end of central directory of the archive.

    Args:
        items_number (int): number of files in the archive.
        central_directory_size (int): size in bytes of the central directory.
        central_directory_offset (int): number of the byte where the central directory starts.
    """
    buffer = bytearray(22)
    # Field 1: End of central directory signature = 0x06054b50 (buffer[0:4])
    buffer[0:4] = b'\x50\x4b\x05\x06'

    # Field 2: Number of this disk (buffer[4:6])

    # Field 3: Disk where central directory starts (buffer[6:8])

    # Field 4: Number of central directory records on this disk (buffer[8:10])
    buffer[8:10] = items_number.to_bytes(2, byteorder='little')

    # Field 5: Total number of central directory records (buffer[10:12])
    buffer[10:12] = items_number.to_bytes(2, byteorder='little')

    # Field 6: Size of central directory in bytes (buffer[12:16])
    buffer[12:16] = central_directory_size.to_bytes(4, byteorder='little')

    # Field 7: Offset of start of central directory (buffer[16:20])
    buffer[16:20] = central_directory_offset.to_bytes(4, byteorder='little')

    # Field 8: Comment length (buffer[20:22])

    # Field 9: Comment (buffer[22:])
    return bytes(buffer)


class ZipSender(ArchiveSender):
    """
    A sender for zip archives computed on the fly.
    """

    def generator(self):
        def generate():
            local_offsets = dict()
            crcs = dict()
            current_byte = 0

            for name, file in self.files.items():
                crcs[name] = crc32(file)

                local_offsets[name] = current_byte
                chunk = zip_local_file_header(name, file, crcs[name])
                current_byte += len(chunk)

                yield chunk

                with open(file, 'rb') as f:
                    while True:
                        bytes = f.read(CHUNK_SIZE)

                        if len(bytes) == 0:
                            break

                        current_byte += len(bytes)
                        yield bytes

            central_directory_size = 0
            centra_directory_offset = current_byte

            for name, file, in self.files.items():
                chunk = zip_central_directory_file_header(name, file, crcs[name], local_offsets[name])
                central_directory_size += len(chunk)
                current_byte += len(chunk)
                yield chunk

            yield zip_end_of_central_directory(len(self.files.items()), central_directory_size, centra_directory_offset)

        return generate()

    def content_length(self) -> int:
        length = 0

        for name, file in self.files.items():
            stat = os.stat(file)

            # Add size of local file header, central directory file header and file size
            length += 76 + 2 * len(name) + stat.st_size

        # Add size of end of central directory
        return length + 22

    def mime_type(self) -> str:
        return 'application/zip'

    def archive_name(self) -> str:
        return 'archive.zip'
