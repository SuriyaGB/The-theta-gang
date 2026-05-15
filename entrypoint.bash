#!/bin/bash
set -x

# Clean up old locks
rm -f /tmp/.X*-lock

# Start Display Server in background
Xvfb :99 -ac -screen 0 1024x768x24 &
XVFB_PID=$!

# Wait for it to wake up
sleep 5

# Set Paths
export DISPLAY=:99
export LD_LIBRARY_PATH="/usr/lib/$(arch)-linux-gnu/jni"

# RUN THE BOT (Single Shot)
thetagang --config /src/thetagang.toml

# CLEAN UP: Kill the Display server so it doesn't waste RAM
kill $XVFB_PID
rm -f /tmp/.X99-lock

exit 0
