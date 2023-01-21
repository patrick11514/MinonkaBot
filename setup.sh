#!/bin/bash
pnpm i
#if folder .fonts in ~ doesn't exist, create it
if [ ! -d ~/.fonts ]; then
    mkdir ~/.fonts
fi

#copy all fonts to ~/.fonts
cp -r ./fonts/* ~/.fonts