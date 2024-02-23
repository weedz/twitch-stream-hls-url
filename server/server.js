import * as http from "node:http";
import * as fs from "node:fs";
import { finished } from "node:stream/promises";

import { fcastTwitchLive } from "../lib/fcast.js";
import { parseBody, readBody } from "../lib/http.js";
import { getChannelsStatus } from "../lib/twitch.js";
import { ChannelCache } from "../lib/cache.js";

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
        if (url.pathname === "/") {
            const index = fs.createReadStream("./server/index.html");
            await finished(index.pipe(reply));
            return reply.end();
        }
        if (url.pathname === "/client.js") {
            const index = fs.createReadStream("./server/client.js");
            reply.writeHead(200, undefined, { "content-type": "application/javascript" });
            await finished(index.pipe(reply));
            return reply.end();
        }
        else if (url.pathname === "/channels") {
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

            if (process.env.ENABLE_CAST) {
                const port = process.env.FCAST_RECIEVER_PORT;
                const host = process.env.FCAST_RECIEVER_IP;
                fcastTwitchLive(host, port, channel);
            }

            return reply.end();
        }
    }

    return reply.writeHead(404).end();
}

const server = http.createServer(async (req, reply) => {
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
