#!/usr/bin/env bash

DEVICE="/dev/v4l/by-id/usb-MACROSILICON_USB3.0_Capture_[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-video-index0"

while true; do
    if ls $DEVICE> /dev/null 2>&1; then
       mediamtx ./mediamtx.yml
    fi
    sleep 5s
done
