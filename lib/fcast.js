// https://gitlab.futo.org/videostreaming/fcast/-/wikis/Protocol-version-1

import * as net from "node:net";
import { getPlaybackUrl } from "./twitch.js";

const HEADER_SIZE_BYTES = 5;
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
  PlaybakError: 9,
  SetSpeed: 10,
  Version: 11,
  Ping: 12,
  Pong: 13,
  Initial: 14,
  PlayUpdate: 15,
  SetPlaylistItem: 16,
  SubscribeEvent: 17,
  UnsubscribeEvent: 18,
  Event: 19,
};

const log = {
  debug(msg) {
    if (process.env.DEBUG) {
      process.stdout.write(`${msg}\n`);
    }
  }
}

/**
 * @param socket {net.Socket}
 * @param opcode {number}
 * @param body {any}
 */
async function sendPacket(socket, opcode, bodyObj = undefined) {
  const body = bodyObj ? Buffer.from(JSON.stringify(bodyObj)) : "";
  const bodySize = body ? 1 + body.length : 1;

  const header = Buffer.alloc(HEADER_SIZE_BYTES);
  header.writeUInt32LE(bodySize);
  header.writeUint8(opcode, HEADER_SIZE_BYTES - 1);

  if (body) {
    log.debug(`Body: ${body}`);
  }
  log.debug(`Sent ${header.length + body.length} bytes with (header size: ${header.length}, body size: ${body?.length}).`);

  if (!socket.write(header + body)) {
    return new Promise((resolve) => {
      socket.once("drain", resolve);
    });
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
    await sendPacket(socket, OPCODES.Version, { version: 3 });

    const castUrl = await getPlaybackUrl(channelName).catch(_ => null);
    if (!castUrl) {
      log.debug("Failed to get twitch url..");
      socket.destroy();
      return;
    }

    await sendPacket(socket, OPCODES.Initial);

    const json = {
      container: "application/vnd.apple.mpegurl",
      url: castUrl,
    };
    await sendPacket(socket, OPCODES.Play, json);
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
