import builtins
import functools
import os
import zipfile
import zlib
from datetime import datetime
from typing import Optional

from flask import Response

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
    buffer[0 : len(filename)] = filename.encode('ascii')

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
        raise NotImplementedError('Abstract method')

    def mime_type(self) -> str:
        """
        Returns the mime type of the archive.
        """
        raise NotImplementedError('Abstract method')

    def archive_name(self) -> str:
        """
        Returns the name of the archive.

        This method is useful for web applications where the archive will be downloaded.
        """
        raise NotImplementedError('Abstract method')

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
                    yield b'\x00' * ((512 - bytes_sent % 512) % 512)

            # We need to generate two empty records at the end
            yield b'\x00' * 1024

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
            length += 512 + stat.st_size + ((512 - stat.st_size % 512) % 512)

        return length + 1024


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


def zip_local_file_header(filename: str, filepath: str, crc: int, zip64: bool = True) -> bytes:
    """
    Generates the bytes for the local file header of the file.

    Args:
        filename (str): path of where the file will be in the archive.
        filepath (str): path of where the file is currently on the disk.
        crc (int):
            the CRC 32 checksum of the file. It is not computed by this function because it is also required in the
            central directory file header, so the user of this function should compute it beforehand, and reuse it later
            to avoid computing it twice.
        zip64 (bool): whether we want to use zip64 format for this file.
    """
    n = len(filename)  # matches the wikipedia description
    buffer_size = 30 + n + 20
    buffer = bytearray(buffer_size)
    stat = os.stat(filepath)

    # Field 1: local file header signature (buffer[0:4])
    buffer[0:4] = b'\x50\x4b\x03\x04'

    # Field 2: version needed to extract (minimum) (buffer[4:6])
    version = 45 if zip64 else 0
    buffer[4:6] = version.to_bytes(2, byteorder='little')

    # Field 3: general purpose bit flag (buffer[6:8]), leave at 0

    # Field 4: compression mode (buffer[8:10]), leave at 0 (uncompressed)

    # Field 5: file last modification time (buffer[10:14])
    mtime = datetime.fromtimestamp(stat.st_mtime)
    buffer[10:12] = ((mtime.second // 2) | (mtime.minute << 5) | (mtime.hour << 11)).to_bytes(2, byteorder='little')
    buffer[12:14] = (mtime.day | (mtime.month << 5) | ((mtime.year - 1980) << 9)).to_bytes(2, byteorder='little')

    # Field 6: crc-32 of uncompressed data (buffer[14:18])
    buffer[14:18] = crc.to_bytes(4, byteorder='little')

    # Field 7: compressed size (or FF FF FF FF for Zip64) (buffer[18:22])
    buffer[18:22] = (0xFFFFFFFF if zip64 else stat.st_size).to_bytes(4, byteorder='little')

    # Field 8: uncompressed size (or FF FF FF FF for Zip64) (buffer[22:26])
    buffer[22:26] = (0xFFFFFFFF if zip64 else stat.st_size).to_bytes(4, byteorder='little')

    # Field 9: filename length (buffer[26:28])
    buffer[26:28] = n.to_bytes(2, byteorder='little')

    # Field 10: extra field length (buffer[28:30])
    if zip64:
        # extra_field_length = 2 + 2 + 8 + 8 == 20
        buffer[28:30] = (20).to_bytes(2, byteorder='little')

    # Field 11: filename (buffer[30:30+len(filename)])
    buffer[30 : 30 + n] = filename.encode('ascii')

    # Field 12: extra field (buffer[30+len(filename):30+len(filename)+len(extra_field)])
    if zip64:
        # Field 12.1: header 0x0001 (buffer[30+n:32+n])
        buffer[30 + n : 32 + n] = (0x0001).to_bytes(2, byteorder='little')

        # Field 12.2: size of the extra field chunk (8, 16, 24 or 28) (buffer[32+n:34+n])
        # Here, it is 16: uncompressed size + compressed size
        buffer[32 + n : 34 + n] = (16).to_bytes(2, byteorder='little')

        # Field 12.3: original uncompressed file size (buffer[34+n:42+n])
        buffer[34 + n : 42 + n] = stat.st_size.to_bytes(8, byteorder='little')

        # Field 12.4: size of compressed data (buffer[42+n:50+n])
        buffer[42 + n : 50 + n] = stat.st_size.to_bytes(8, byteorder='little')

        # Field 12.5: offset of local header record (buffer[50+n:58+n])
        # Unused in local file header

        # Field 12.6: number of the disk on which this file starts (buffer[58+n:62+n]), leave at 0
        # Unused in local file header

    return bytes(buffer)


def zip_central_directory_file_header(filename: str, filepath: str, crc: int, offset: int, zip64: bool = True) -> bytes:
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
        zip64 (bool): whether we want to use zip64 format for this file.
    """
    buffer_size = 46 + len(filename) + (28 if zip64 else 0)
    buffer = bytearray(buffer_size)
    stat = os.stat(filepath)

    # Field 1: central directory file header signature (buffer[0:4])
    buffer[0:4] = b'\x50\x4b\x01\x02'

    # Field 2: version made by (buffer[4:6])
    version = 45 if zip64 else 10
    buffer[4:6] = version.to_bytes(2, byteorder='little')

    # Field 3: version needed to extract (minimum) (buffer[6:8])
    buffer[6:8] = version.to_bytes(2, byteorder='little')

    # Field 3: general purpose bit flag (buffer[8:10]), leave at 0

    # Field 4: compression mode (buffer[10:12]), leave at 0 (uncompressed)

    # Field 5: file last modification time (buffer[12:16])
    mtime = datetime.fromtimestamp(stat.st_mtime)
    buffer[12:14] = ((mtime.second // 2) | (mtime.minute << 5) | (mtime.hour << 11)).to_bytes(2, byteorder='little')
    buffer[14:16] = (mtime.day | (mtime.month << 5) | ((mtime.year - 1980) << 9)).to_bytes(2, byteorder='little')

    # Field 6: crc-32 of uncompressed data (buffer[16:20])
    buffer[16:20] = crc.to_bytes(4, byteorder='little')

    # Field 7: compressed size (or FF FF FF FF for Zip64) (buffer[20:24])
    buffer[20:24] = (0xFFFFFFFF if zip64 else stat.st_size).to_bytes(4, byteorder='little')

    # Field 8: uncompressed size (or FF FF FF FF for Zip64) (buffer[24:28])
    buffer[24:28] = (0xFFFFFFFF if zip64 else stat.st_size).to_bytes(4, byteorder='little')

    # Field 9: filename length (buffer[28:30])
    buffer[28:30] = len(filename).to_bytes(2, byteorder='little')

    # Field 10: extra field length (buffer[30:32])
    if zip64:
        # tag (2) + size (2) + uncompressed (8) + compressed (8) + offset (8) = 28
        buffer[30:32] = (28).to_bytes(2, byteorder='little')

    # Field 11: file comment length (buffer[32:34])

    # Field 12: disk number where file starts, leave at 0 (buffer[34:36])

    # Field 13: internal file attributes (buffer[36:38])

    # Field 14: external file attributes (buffer[38:42])

    # Field 15: relative offset of the local file header (or FF FF FF FF for Zip64) (buffer[42:46])
    buffer[42:46] = (0xFFFFFFFF if zip64 else offset).to_bytes(4, byteorder='little')

    # Field 16: filename (buffer[46:46+len(filename)])
    buffer[46 : 46 + len(filename)] = filename.encode('ascii')

    # Field 17: extra field zip64 (buffer[46+n:46+n+28])
    if zip64:
        p = 46 + len(filename)

        # Field 17.1: header 0x0001 (buffer[p:p+2])
        buffer[p : p + 2] = (0x0001).to_bytes(2, byteorder='little')

        # Field 17.2: size of the extra field payload (buffer[p+2:p+4])
        buffer[p + 2 : p + 4] = (24).to_bytes(2, byteorder='little')

        # Field 17.3: original uncompressed file size (buffer[p+4:p+12])
        buffer[p + 4 : p + 12] = stat.st_size.to_bytes(8, byteorder='little')

        # Field 17.4: size of compressed data (buffer[p+12:p+20])
        buffer[p + 12 : p + 20] = stat.st_size.to_bytes(8, byteorder='little')

        # Field 17.5: offset of local header record (buffer[p+20:p+28])
        buffer[p + 20 : p + 28] = offset.to_bytes(8, byteorder='little')

    return bytes(buffer)


def zip_end_of_central_directory(
    items_number: int, central_directory_size: int, central_directory_offset: int, zip64: bool = True
):
    """
    Generates the bytes for the end of central directory of the archive.

    Args:
        items_number (int): number of files in the archive.
        central_directory_size (int): size in bytes of the central directory.
        central_directory_offset (int): number of the byte where the central directory starts.
        zip64 (bool): whether we want to use zip64 format for this file.
    """
    # For Zip64, we have the EOCD64 and the EOCDL (End of Central Directory Locator) before the classic EOCD record.
    # EOCD64 is 56 bytes, et EOCDL is 20 bytes, so the total size is 20 + 56 + 22 = 98
    buffer = bytearray(98) if zip64 else bytearray(22)
    zip64offset = 76 if zip64 else 0

    if zip64:
        # EOCD64 record
        # Field 1: EOCD64 signature = 0x06064b50 (buffer[0:4])
        buffer[0:4] = b'\x50\x4b\x06\x06'

        # Field 2: Size of EOCD64 minus 16 (buffer[4:12])
        buffer[4:12] = (56 - 12).to_bytes(8, byteorder='little')

        # Field 3: Version made by (buffer[12:14])
        buffer[12:14] = (45).to_bytes(2, byteorder='little')

        # Field 4: Version needed to extract (minimum) (buffer[14:16])
        buffer[14:16] = (45).to_bytes(2, byteorder='little')

        # Field 5: Number of this disk (buffer[16:20]), leave at 0

        # Field 6: Disk where the central directory starts (buffer[20:24]), leave at 0

        # Field 7: Number of central directory records on this disk (buffer[24:32])
        buffer[24:32] = items_number.to_bytes(8, byteorder='little')

        # Field 8: Total number of central directory records (buffer[32:40])
        buffer[32:40] = items_number.to_bytes(8, byteorder='little')

        # Field 9: Size of central directory in bytse (buffer[40:48])
        buffer[40:48] = central_directory_size.to_bytes(8, byteorder='little')

        # Field 10: Offset of start of central directory, relative to start of archive (buffer[48:56])
        buffer[48:56] = central_directory_offset.to_bytes(8, byteorder='little')

        # Field 11: Comment (buffer[56:])

        # EOCDL
        # Field 1: ECODL signature = 0x07064b50 (buffer[56:60])
        buffer[56:60] = b'\x50\x4b\x06\x07'

        # Field 2: Disk where EOCD64 starts (buffer[60:64]), leave at 0

        # Field 3: Offset to start of EOCD64, relative to start of archive (buffer[64:72])
        buffer[64:72] = (central_directory_offset + central_directory_size).to_bytes(8, byteorder='little')

        # Field 4: Total number of disks (buffer[72:76])
        buffer[72:76] = (1).to_bytes(4, byteorder='little')

    # Classic EOCD record
    # Field 1: End of central directory signature = 0x06054b50 (buffer[0:4])
    buffer[zip64offset + 0 : zip64offset + 4] = b'\x50\x4b\x05\x06'

    # Field 2: Number of this disk (or FF FF for Zip64) (buffer[zip64offset + 4:6])
    if zip64:
        buffer[zip64offset + 4 : zip64offset + 6] = (0xFFFF).to_bytes(2, byteorder='little')

    # Field 3: Disk where central directory starts (or FF FF for Zip64) (buffer[zip64offset + 6:8])
    if zip64:
        buffer[zip64offset + 6 : zip64offset + 8] = (0xFFFF).to_bytes(2, byteorder='little')

    # Field 4: Number of central directory records on this disk (or FF FF for Zip64) (buffer[zip64offset + 8:10])
    buffer[zip64offset + 8 : zip64offset + 10] = (0xFFFF if zip64 else items_number).to_bytes(2, byteorder='little')

    # Field 5: Total number of central directory records (or FF FF for Zip64) (buffer[zip64offset + 10:12])
    buffer[zip64offset + 10 : zip64offset + 12] = (0xFFFF if zip64 else items_number).to_bytes(2, byteorder='little')

    # Field 6: Size of central directory in bytes (or FF FF FF FF for Zip64) (buffer[zip64offset + 12:16])
    buffer[zip64offset + 12 : zip64offset + 16] = (0xFFFFFFFF if zip64 else central_directory_size).to_bytes(
        4, byteorder='little'
    )

    # Field 7: Offset of start of central directory (or FF FF FF FF for Zip64) (buffer[zip64offset + 16:20])
    buffer[zip64offset + 16 : zip64offset + 20] = (0xFFFFFFFF if zip64 else central_directory_offset).to_bytes(
        4, byteorder='little'
    )

    # Field 8: Comment length (buffer[20:22])

    # Field 9: Comment (buffer[22:])
    return bytes(buffer)


class ZipSender(ArchiveSender):
    """
    A sender for zip archives computed on the fly.

    The streaming generator only supports archives smaller than 4 GiB (32-bit zip offsets).
    Use write_to_path() for larger archives.
    """

    def __init__(self, zip64: bool = True):
        super().__init__()
        self.zip64 = zip64

    def write_to_path(self, path: os.PathLike | str) -> None:
        """Write the archive to disk. Supports ZIP64 for archives larger than 4 GiB."""
        with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_STORED) as archive:
            for name, file in self.files.items():
                archive.write(file, name)

    def generator(self):
        def generate():
            local_offsets = {}
            crcs = {}
            current_byte = 0

            for name, file in self.files.items():
                print('Processing ' + file)
                crcs[name] = crc32(file)

                local_offsets[name] = current_byte
                chunk = zip_local_file_header(name, file, crcs[name], self.zip64)
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
            central_directory_offset = current_byte

            for (
                name,
                file,
            ) in self.files.items():
                chunk = zip_central_directory_file_header(name, file, crcs[name], local_offsets[name], self.zip64)
                central_directory_size += len(chunk)
                current_byte += len(chunk)
                yield chunk

            yield zip_end_of_central_directory(
                len(self.files.items()), central_directory_size, central_directory_offset, self.zip64
            )

        return generate()

    def content_length(self) -> int:
        length = 0

        # Local file header extra field (20 bytes) + central directory extra field (28 bytes)
        extra = 48 if self.zip64 else 0

        for name, file in self.files.items():
            stat = os.stat(file)

            # Add size of local file header (30), central directory file header (46),
            # zip64 extra fields and file size
            length += 76 + 2 * len(name) + extra + stat.st_size

        # Add size of end of central directory (EOCD64 56 + EOCDL 20 + EOCD 22 for zip64)
        return length + (98 if self.zip64 else 22)

    def mime_type(self) -> str:
        return 'application/zip'

    def archive_name(self) -> str:
        return 'archive.zip'


def test():
    archive = ZipSender()
    for i in range(1, 21):
        archive.add_file(str(i) + '.bin', 'tmp/' + str(i) + '.bin')

    with open('archive.zip', 'wb') as f:
        for bytez in archive.generator():
            f.write(bytez)


if __name__ == '__main__':
    test()
