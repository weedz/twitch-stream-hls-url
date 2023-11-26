import { fcastTwitchLive } from "./lib/fcast.js";

const port = 46899;
const host = "192.168.1.39";

if (process.argv.length !== 3) {
    console.error(`Usage: ${process.argv0} fcast.js [channel name]`);
    process.exit(1);
}
const channelName = process.argv[2];

fcastTwitchLive(host, port, channelName);
