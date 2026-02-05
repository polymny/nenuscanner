#!/usr/bin/env bash

cd $HOME

# Install deps
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y \
    python3-flask \
    python3-gphoto2 \
    python3-pil \
    python3-numpy \
    python-scipy \
    git

# Setup code
git clone https://github.com/polymny/nenuscanner
cd $HOME/nenuscanner/server
cp config.darkroom.py config.py

# Initialize database
./db.py

# Setup systemd service
cd $HOME/nenuscanner
mkdir -p $HOME/.config/systemd/user
cp nenuscanner.service $HOME/.config/systemd/user
systemctl daemon-reload --user
systemctl enable nenuscanner --user

