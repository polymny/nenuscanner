#!/usr/bin/env bash

# Run this script if you run into problems with rpi network
# To check if its running:
#   - run `screen -ls` to see if screen is running,
#   - `screen -r prevent-saving` to attach to prevent saving thread, and Ctrl+A and then Ctrl+D to detach again.
screen -XS prevent-saving quit > /dev/null
screen -S prevent-saving -d -m sh -c "while true; do echo "curl" && curl localhost:5000 > /dev/null 2>&1 && sleep 5s; done"
