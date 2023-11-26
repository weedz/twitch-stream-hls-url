import * as http from "node:http";
import * as fs from "node:fs";
import { finished } from "node:stream/promises";

import { fcastTwitchLive } from "../lib/fcast.js";
import { parseBody, readBody } from "../lib/http.js";

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
    } else if (req.method === "POST") {
        if (url.pathname === "/twitch") {
            const body = await readBody(req).catch(_ => null);
            if (!body) {
                req.destroy();
                reply.statusCode = 400;
                return reply.end();
            }

            const formData = parseBody(req, body);

            const channel = formData?.channel;
            if (!channel) {
                reply.statusCode = 400;
                return reply.end();
            }

            const port = 46899;
            const host = "192.168.1.39";
            fcastTwitchLive(host, port, channel);

            return reply.end();
        }
    }
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
