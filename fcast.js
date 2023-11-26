// https://gitlab.futo.org/videostreaming/fcast/-/wikis/Protocol-version-1

import * as net from "node:net"
import { getPlaybackUrl } from "./lib/twitch.js";

const LENGTH_BYTES = 4;
const MAXIMUM_PACKET_LENGTH = 32000;

const OPCODES = {
    None: 0,
    Play: 1,
    Pause: 2,
    Resume: 3,
    Stop: 4,
    Seek: 5,
    PlaybackUpdate: 6,
    VolumeUpdate: 7,
    SetVolume: 8,
};


const port = 46899;
const host = "192.168.1.39";

if (process.argv.length !== 3) {
    console.error(`Usage: ${process.argv0} fcast.js [channel name]`);
    process.exit(1);
}
const channelName = process.argv[2];



console.log(`Connecting to host=${host} port=${port}...`);
const socket = net.connect({
    port,
    host,
});

socket.on("ready", async () => {
    console.log("Connection established!");

    const twitchUrl = await getPlaybackUrl(channelName).catch(_ => {});
    if (!twitchUrl) {
        console.log("Failed to get twitch url..");
        stream.end();
        return;
    }

    const json = {
        container: "application/vnd.apple.mpegurl",
        url: twitchUrl,
    };
    const body = Buffer.from(JSON.stringify(json));
    const bodySize = 1 + body.length;


    const opcode = OPCODES.Play;

    const header_size = LENGTH_BYTES + 1;

    const header = Buffer.alloc(header_size);
    header.writeUInt32LE(bodySize);
    header[LENGTH_BYTES] = opcode;

    console.log("Body:", json);
    console.log(`Sent ${header.length + body.length} bytes with (header size: ${header.length}, body size: ${body.length}).`);

    socket.write(header);
    socket.write(body);
    socket.end();
});
socket.on("error", (err) => {
    console.log("Connection encountered an error:", err);
});
socket.on("end", () => {
    console.log("Connection ended.");
});
socket.on("close", () => {
    console.log("Connection closed.");
});

socket.on("data", (data) => {
    console.log("Recieved data from server:", data);
    console.log("    ", data.toString("utf8"));
});
