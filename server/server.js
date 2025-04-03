import * as http from "node:http";
import * as fs from "node:fs";

import { fcastTwitchLive } from "../lib/fcast.js";
import { parseBody, readBody } from "../lib/http.js";
import { getChannelsStatus } from "../lib/twitch.js";
import { ChannelCache } from "../lib/cache.js";

const staticFiles = {
  "/index.html": {
    content: fs.readFileSync("./server/index.html"),
    headers: { "content-type": "text/html" },
  },
  "/style.css": {
    content: fs.readFileSync("./server/style.css"),
    headers: { "content-type": "text/css" },
  },
  "/client.js": {
    content: fs.readFileSync("./server/client.js"),
    headers: { "content-type": "application/javascript" },
  },
  "/lib/time.js": {
    content: fs.readFileSync("./lib/time.js"),
    headers: { "content-type": "application/javascript" },

  },
};
staticFiles["/"] = staticFiles["/index.html"];
/**
 * @param {http.ServerResponse} reply
 * @param {keyof typeof staticFiles} filePath
 */
function sendStaticFile(reply, fileName) {
  reply.writeHead(200, undefined, staticFiles[fileName].headers);
  reply.write(staticFiles[fileName].content);
  return reply.end();
}

const channelCache = new ChannelCache();

let lastRequest = 0;

/**
 * 
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} reply 
 */
async function handler(req, reply) {
  if (!req.url) {
    reply.statusCode = 404;
    return reply.end();
  }

  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET") {
    if (url.pathname in staticFiles) {
      return sendStaticFile(reply, url.pathname);
    } else if (url.pathname === "/channels") {
      const logins = url.searchParams.get("logins")?.split(",");
      if (!logins) {
        return reply.writeHead(400).end();
      }
      /** @type {string[]} */
      const channelsToFetch = [];

      /** @type {import ("../lib/cache.js").Channel[]} */
      const cachedChannels = [];
      for (const login of logins) {
        const cachedChannel = channelCache.getChannel(login);
        if (cachedChannel) {
          cachedChannels.push(cachedChannel);
        } else {
          channelsToFetch.push(login);
        }
      }

      const cachedChannelsString = cachedChannels.map(channel => channel.login).join(",");

      if (channelsToFetch.length !== 0) {
        const channels = await getChannelsStatus(channelsToFetch);
        cachedChannels.push(...channels);
        for (const channel of channels) {
          if (!channel) {
            // Channel was probably not found
            continue;
          }
          channelCache.setChannel(channel.login, channel);
        }
      }

      reply.writeHead(200, undefined, {
        "content-type": "application/json",
        "x-cached": cachedChannelsString,
      });
      reply.write(JSON.stringify(cachedChannels));
      return reply.end();
    }
  } else if (req.method === "POST") {
    if (url.pathname === "/twitch") {
      if (lastRequest + 5000 > Date.now()) {
        reply.statusCode = 429;
        return reply.end();
      }

      const body = await readBody(req).catch(_ => null);
      if (!body) {
        req.destroy();
        reply.statusCode = 400;
        return reply.end();
      }

      lastRequest = Date.now();

      const formData = parseBody(req, body);

      const channel = formData?.channel;
      if (!channel) {
        reply.statusCode = 400;
        return reply.end();
      }

      reply.writeHead(200, undefined, {
        "content-type": "application/json",
      });


      if (process.env.ENABLE_CAST) {
        const port = process.env.FCAST_RECIEVER_PORT;
        const host = process.env.FCAST_RECIEVER_IP;
        fcastTwitchLive(host, port, channel);
        reply.write(JSON.stringify({ success: true, msg: "Casting..." }));
      } else {
        reply.write(JSON.stringify({ success: false, msg: "Casting is not enabled." }));
      }

      return reply.end();
    }
  }

  return reply.writeHead(404).end();
}

const ALLOWED_IPS = process.env.ALLOWED_IPS ? new Set(process.env.ALLOWED_IPS.split(",")) : null;
function checkIp(ip) {
  if (!ALLOWED_IPS || !ip) {
    return true;
  }
  return ALLOWED_IPS.has(ip);
}

const server = http.createServer(async (req, reply) => {
  if (!checkIp(req.socket.remoteAddress)) {
    console.log("Unauthorized access from ip:", req.socket.remoteAddress);
    reply.statusCode = 403;
    return reply.end();
  }
  handler(req, reply).catch(err => {
    console.log("Error:", err);
    reply.statusCode = 500;
    return reply.end();
  });
});

const port = process.env.PORT || 8080;
const host = process.env.HOST || undefined;

server.listen(port, host, () => {
  console.log(`Listening on ${host || ""}:${port}`);
});
