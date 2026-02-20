#!/usr/bin/env bash

cd $HOME

# Install deps
yes | sudo apt-get update
yes | sudo apt-get upgrade
yes | sudo apt-get install \
    python3-flask python3-gphoto2 python3-pil python3-numpy python3-scipy python3-waitress \
    git gphoto2 imagemagick

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

