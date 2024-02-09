/*
SOURCE:
- https://gitlab.futo.org/videostreaming/plugins/twitch/-/blob/master/TwitchScript.js
- https://github.com/streamlink/streamlink/blob/master/src/streamlink/plugins/twitch.py

*/

import { getPlaybackUrl } from "./lib/twitch.js";

if (process.argv.length !== 3) {
    console.error(`Usage: ${process.argv0} main.js [channel name]`);
    process.exit(1);
}

const channelName = process.argv[2];

const playbackUrl = await getPlaybackUrl(channelName);
console.log(playbackUrl);
