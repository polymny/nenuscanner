# NenuScanner

## Quick install

Sur une Raspberry Pi 5 fraîchement installée :
```
curl -sSf https://raw.githubusercontent.com/polymny/nenuscanner/refs/heads/main/installer.sh | bash
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

### Initialisation de la BDD

```bash
poetry run db_init
```

## Lancer l'application

### Backend

Depuis le dossier `server/` du projet

```bash
poetry run flask --app . run --debug
```

### Consulter la documentation de l'API

Se rendre à l'URL suivante une fois le serveur lancé :

```bash
http://localhost:5000/swagger-ui
```

### Frontend

Pré-requis : le **backend doit tourner sur le port 5000** (ex: `http://localhost:5000`).  
Ensuite, depuis le dossier `frontend/` :

```bash
npm install
```

```bash
npm run dev
```
Se rendre à l'URL suivante pour consulter l'application :
```bash
http://localhost:3000
```

## Déploiement sur la Raspberry Pi
Une fois sur le même réseau que la Pi, se connecter en SSH :
```bash
ssh pi@192.168.0.2
```
> **Notes :**
> - Une clé SSH publique doit être enregistrée sur la Pi.
> - L'adresse IP de la Pi peut être instable ; vérifier l'IP actuelle si la connexion échoue.

Mettre à jour le code :
```bash
cd ~/nenuscanner
git pull
```
Rebuilder et déployer le frontend :
```bash
cd frontend
npm run build
sudo rm -r /var/www/nenuscanner/**
sudo cp -r ./dist/** /var/www/nenuscanner/
```
Redémarrer le serveur :
```bash
systemctl --user restart nenuscanner
```

## Exporter les données d'une acquisition
Brancher un disque externe sur la Raspberry Pi.

Ouvrir une session SSH et identifier le port du disque :

```bash
lsblk
```

Une fois le port identifié (ex. `/dev/sda1`), monter le disque :

```bash
sudo mount -t exfat /dev/sda1 ~/mnt/T9_B -o uid=pi,gid=pi,umask=022
```

Exporter ensuite les données depuis l'application.

Quand l'export est terminé, démonter le disque :

```bash
sudo umount ~/mnt/T9_B
```