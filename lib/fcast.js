// https://gitlab.futo.org/videostreaming/fcast/-/wikis/Protocol-version-1

import * as net from "node:net";
import { getPlaybackUrl } from "./twitch.js";

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

const log = {
    debug(msg) {
        if (process.env.DEBUG) {
            process.stdout.write(`${msg}\n`);
        }
    }
}


export async function fcastTwitchLive(host, port, channelName) {
    log.debug(`Connecting to host=${host} port=${port}...`);
    const socket = net.connect({
        port,
        host,
    });

    socket.on("ready", async () => {
        log.debug("Connection established!");

        const twitchUrl = await getPlaybackUrl(channelName).catch(_ => null);
        if (!twitchUrl) {
            log.debug("Failed to get twitch url..");
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

        log.debug(`Body: ${JSON.stringify(json)}`);
        log.debug(`Sent ${header.length + body.length} bytes with (header size: ${header.length}, body size: ${body.length}).`);

        socket.write(header);
        socket.write(body);
        socket.destroy();
    });
    socket.on("error", (err) => {
        console.log("Connection encountered an error:", err);
        socket.destroy();
    });
    socket.on("end", () => {
        log.debug("Connection ended.");
    });
    socket.on("close", () => {
        log.debug("Connection closed.");
    });

    socket.on("data", (data) => {
        log.debug(`Recieved data from server: ${data}`);
        log.debug(`    ${data.toString("utf8")}`);
    });
}
