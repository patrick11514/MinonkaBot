#!/bin/bash
PATH=/home/admin/.nvm/versions/node/v16.17.1/bin:/home/admin/.local/bin:/home/admin/.local/share/pnpm:$PATH
while true; do
    echo "🔃 Starting..."
    pnpm start
    echo "🔃 Waiting..."
    sleep 1
done
