#!/usr/bin/env bash
# -x prints the executed command to stdout
set -euo pipefail

if [ $# -ne 1 ]; then
exit 1
fi
URL=$(node main.js "$1")
/home/weedz/Documents/workspace/thirdparty/fcast-master-clients-terminal/clients/terminal/target/release/fcast -h 192.168.1.39 play --mime_type application/vnd.apple.mpegurl --url "$URL"
