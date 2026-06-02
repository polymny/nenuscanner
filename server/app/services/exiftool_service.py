import subprocess
from pathlib import Path


def write_jpeg_preview_from_raw(raw_path: str, preview_path: str) -> None:
    """Extrait le JPEG embarqué basse résolution du RAW (exiftool)."""
    Path(preview_path).parent.mkdir(parents=True, exist_ok=True)
    for tag in ('PreviewImage', 'ThumbnailImage', 'JpgFromRaw'):
        result = subprocess.run(
            ['exiftool', '-b', f'-{tag}', raw_path],
            capture_output=True,
            check=False,
        )
        if result.returncode == 0 and result.stdout:
            Path(preview_path).write_bytes(result.stdout)
            return
    raise RuntimeError('raw-to-jpeg-failed')
