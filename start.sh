#!/bin/bash

PATH="/home/admin/.nvm/versions/node/v18.14.2/bin:/home/admin/.local/bin::/usr/local/bin:/usr/bin:/bin:/usr/games"

while true; do
    echo "🔃 Starting..."
    pnpm start
    echo "🔃 Waiting..."
    sleep 1
done
