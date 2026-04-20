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

## Lancer en mode debug

Depuis `/home/pi/nenuscanner/server`

```
flask -app . run --debug
```

## Setup Python avec Poetry (recommandé)

Depuis la racine du repo :

```bash
poetry install
poetry run nenuscanner
```
