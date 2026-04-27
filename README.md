# NenuScanner

## Quick install

Sur une raspberry pi 5 fraîchement installée :
```
curl -sSf https://raw.githubusercontent.com/polymny/nenuscanner/refs/heads/main/installer.sh | bash
```

## Build front (TypeScript)

Ce dépôt inclut un build front minimal (TypeScript / Three.js) dont la sortie est servie par Flask.
La commande suivante génère `server/static/calibration-visualiser.js` :

```bash
npm install
npm run build
```

## Setup Python avec Poetry (recommandé)

### Pré-requis système

- **Poetry**: requis pour installer et exécuter le backend Python. Documentation : https://python-poetry.org/docs/#installation
- **gphoto2**: requis pour piloter l'appareil photo (binaire `gphoto2`).
- **SQLite (pyenv)**: si vous compilez Python avec `pyenv`, installez `libsqlite3-dev` *avant* `pyenv install`, sinon le module `sqlite3` peut être absent.

### Configuration locale

Créer `server/config.py` en le basant sur l'exemple local :

```bash
cp server/config.local.py server/config.py
```

### Installation backend

```bash
poetry install
```

## Lancer l'application

### En mode debug

Depuis le dossier `server/` du projet

```bash
poetry run flask --app . run --debug
```

### En mode production

```bash
poetry run nenuscanner
```
