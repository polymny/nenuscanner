import json
import math
import subprocess
import threading
import time
from collections.abc import Callable
from pathlib import Path

# Nikon Z : le buffer liveview renvoie parfois d'anciennes trames après un réglage ou un mouvement.
# Voir camera.py, gphoto2 #60 (--capture-movie) et libgphoto2 #846 (file d'événements PTP).
PREVIEW_FLUSH_AFTER_SETTING = 2
PREVIEW_FLUSH_FRAMES = 1
PREVIEW_FLUSH_SLEEP_SEC = 0.05

_gphoto2_lock = threading.Lock()


def _parse_iso_label(label: str) -> float:
    return float(label.replace(',', '.').strip())


def _parse_aperture_label(label: str) -> float:
    value = label.strip().lower()
    if value.startswith('f/'):
        value = value[2:]
    return float(value.replace(',', '.'))


def _parse_shutter_label(label: str) -> float:
    value = label.strip().rstrip('sS').replace(',', '.')
    return float(value)


_SETTING_CONFIGS: dict[str, tuple[str, Callable[[str], float]]] = {
    'shutterspeed': ('shutterspeed', _parse_shutter_label),
    'iso': ('iso', _parse_iso_label),
    'aperture': ('f-number', _parse_aperture_label),
}

CAMERA_SETTING_NAMES = tuple(_SETTING_CONFIGS.keys())


def parse_gphoto2_config_output(output: str) -> dict:
    text = output.strip()
    if not text:
        return {}

    if text.startswith('{'):
        data = json.loads(text)
        if len(data) == 1:
            return next(iter(data.values()))
        return data

    config: dict = {}
    choices: list[dict] = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line == 'END':
            continue
        if ':' not in line:
            continue
        key, value = line.split(':', 1)
        key = key.strip()
        value = value.strip()
        if key == 'Choice':
            idx_label = value.split(' ', 1)
            if len(idx_label) == 2:
                choices.append({'id': int(idx_label[0]), 'label': idx_label[1]})
        else:
            config[key] = value

    if choices:
        config['Choices'] = choices
    return config


def _values_match(left: float, right: float) -> bool:
    return math.isclose(left, right, rel_tol=0.0, abs_tol=1e-9)


def _parse_choices(config: dict, parse_label: Callable[[str], float]) -> list[tuple[int, float]]:
    parsed: list[tuple[int, float]] = []
    for choice in config.get('Choices', []):
        if not isinstance(choice, dict):
            continue
        label = choice.get('label', '')
        try:
            parsed.append((int(choice['id']), parse_label(str(label))))
        except (TypeError, ValueError, KeyError):
            continue
    return parsed


def _choices_to_numbers(config: dict, parse_label: Callable[[str], float]) -> list[float]:
    return [numeric_value for _, numeric_value in _parse_choices(config, parse_label)]


def _current_to_number(config: dict, parse_label: Callable[[str], float]) -> float:
    return parse_label(str(config.get('Current', '')))


def _find_choice_index(config: dict, value: float, parse_label: Callable[[str], float]) -> int | None:
    for choice_id, numeric_value in _parse_choices(config, parse_label):
        if _values_match(numeric_value, value):
            return choice_id
    return None


def _run_gphoto2_get_config(config_name: str) -> str:
    with _gphoto2_lock:
        result = subprocess.run(
            ['gphoto2', '--get-config', config_name],
            capture_output=True,
            encoding='utf-8',
            check=False,
        )
    return result.stdout or ''


def _run_gphoto2_set_config(config_name: str, value: str) -> None:
    with _gphoto2_lock:
        subprocess.run(
            ['gphoto2', '--set-config', f'{config_name}={value}'],
            capture_output=True,
            encoding='utf-8',
            check=False,
        )


def _get_config(config_name: str) -> dict:
    return parse_gphoto2_config_output(_run_gphoto2_get_config(config_name))


def _fetch_setting(config_name: str, parse_label: Callable[[str], float]) -> tuple[list[float], float]:
    config = _get_config(config_name)
    values = _choices_to_numbers(config, parse_label)
    try:
        current = _current_to_number(config, parse_label)
    except (TypeError, ValueError):
        current = values[0] if values else 0.0
    return values, current


def get_camera_settings() -> dict:
    settings: dict = {}
    SETTING_RESPONSE_KEYS: dict[str, tuple[str, str]] = {
        'shutterspeed': ('shutterSpeedValues', 'currentShutterSpeedValue'),
        'iso': ('isoValues', 'currentIsoValue'),
        'aperture': ('apertureValues', 'currentApertureValue'),
    }
    for setting, (config_name, parse_label) in _SETTING_CONFIGS.items():
        values_key, current_key = SETTING_RESPONSE_KEYS[setting]
        values, current = _fetch_setting(config_name, parse_label)
        settings[values_key] = values
        settings[current_key] = current
    return settings


def set_camera_setting(setting: str, value: float) -> None:
    if setting not in _SETTING_CONFIGS:
        raise ValueError('unknown-camera-setting')

    config_name, parse_label = _SETTING_CONFIGS[setting]
    config = _get_config(config_name)

    choice_index = _find_choice_index(config, value, parse_label)
    if choice_index is None:
        raise ValueError('invalid-camera-setting-value')

    _run_gphoto2_set_config(config_name, str(choice_index))
    _flush_preview_buffer()


def trigger_autofocus() -> None:
    _run_gphoto2_set_config('autofocusdrive', '1')
    _flush_preview_buffer()


def _capture_preview_bytes() -> bytes:
    """Lit une frame liveview ; --capture-movie=0 est plus fiable que --capture-preview sur Nikon Z."""
    commands = (
        ['gphoto2', '--capture-movie=1', '--stdout', '--force-overwrite'],
        ['gphoto2', '--capture-preview', '--stdout', '--force-overwrite'],
    )
    last_error = ''
    for command in commands:
        result = subprocess.run(command, capture_output=True, check=False)
        if result.returncode == 0 and result.stdout:
            return result.stdout
        last_error = (result.stderr or b'').decode('utf-8', errors='replace').strip()

    raise RuntimeError(last_error or 'capture-preview-failed')


def _flush_preview_buffer() -> None:
    """Jette les trames liveview en cache (après changement de réglage, autofocus, etc.)."""
    with _gphoto2_lock:
        for index in range(PREVIEW_FLUSH_AFTER_SETTING):
            _capture_preview_bytes()
            if index + 1 < PREVIEW_FLUSH_AFTER_SETTING:
                time.sleep(PREVIEW_FLUSH_SLEEP_SEC)


def capture_preview() -> str:
    with _gphoto2_lock:
        data = b''
        for index in range(PREVIEW_FLUSH_FRAMES):
            data = _capture_preview_bytes()
            if index + 1 < PREVIEW_FLUSH_FRAMES:
                time.sleep(PREVIEW_FLUSH_SLEEP_SEC)

    if not data:
        raise RuntimeError('capture-preview-empty')

    PREVIEW_PATH = '/tmp/camera-preview.jpg'
    preview_path = Path(PREVIEW_PATH)
    preview_path.write_bytes(data)
    return PREVIEW_PATH
