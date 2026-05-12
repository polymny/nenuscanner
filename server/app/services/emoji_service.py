from __future__ import annotations

import math
import secrets
from typing import Iterable

import emoji

_ZWJ = '\u200d'
_VS16 = '\ufe0f'

_MAX_EMOJI_VERSION = 12.0

_EXCLUDED_NAME_SUBSTRINGS = (
    'flag',
    'keycap',
    'skin_tone',
    'tone',
)

def _emoji_version(meta: dict) -> float:
    value = meta.get('E', 0)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _is_simple_emoji(e: str, *, short_name: str, meta: dict) -> bool:
    """
    Filtre sur la base des emojis:
    - un seul point de code (len == 1)
    - pas de ZWJ (séquences composées)
    - pas de variation selector (présentation emoji/texte)
    - pas de variantes
    - exclusion via shortname (flags / keycaps / skin tones)
    """
    if not e or len(e) != 1:
        return False

    if _ZWJ in e or _VS16 in e:
        return False

    if meta.get('variant') is True:
        return False

    version = _emoji_version(meta)
    if math.isfinite(version) and 0 < version and version > _MAX_EMOJI_VERSION:
        return False

    name = (short_name or '').lower()
    return not any(bad in name for bad in _EXCLUDED_NAME_SUBSTRINGS)


def iter_simple_emojis() -> Iterable[str]:
    for e, meta in emoji.EMOJI_DATA.items():
        short_name = meta.get('en', '')
        if _is_simple_emoji(e, short_name=short_name, meta=meta):
            yield e


_SIMPLE_EMOJI_POOL = tuple(iter_simple_emojis())


def random_two_simple_emojis(*, allow_same: bool = False) -> tuple[str, str]:
    """
    Retourne 2 emojis "simples" choisis aléatoirement.
    """
    if not _SIMPLE_EMOJI_POOL:
        raise RuntimeError('no-emoji-pool')

    rng = secrets.SystemRandom()
    if allow_same:
        return (rng.choice(_SIMPLE_EMOJI_POOL), rng.choice(_SIMPLE_EMOJI_POOL))
    return tuple(rng.sample(_SIMPLE_EMOJI_POOL, 2))
