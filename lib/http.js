import * as querystring from "node:querystring";
import * as http from "node:http";


/**
 * 
 * @param {http.IncomingMessage} req 
 * @return {Promise<Buffer>}
 */
export async function readBody(req) {
    return new Promise((resolve, reject) => {
        const data = [];
        let readSize = 0;
        req.on("data", chunk => {
            readSize += chunk.length;
            if (readSize > 1024) {
                reject();
                req.destroy();
            }
            data.push(chunk);
        });
        req.on("end", () => {
            const body = Buffer.concat(data);
            resolve(body);
        });
    });
}

/**
 * @typedef {{ [key: string]: JSONValue }} JSONType
 * @typedef {JSONType | number | string | null} JSONValue
 */

/**
 * 
 * @param {http.IncomingMessage} req 
 * @param {Buffer} body 
 * @returns {null | Record<string, string> | JSONType}
 */
export function parseBody(req, body) {
    const contentType = req.headers["content-type"];
    if (!contentType) {
        return null;
    }

    if (contentType === "application/x-www-form-urlencoded") {
        return querystring.decode(body.toString("utf8"));
    }

    if (contentType === "application/json") {
        return JSON.parse(body.toString("utf8"));
    }
}
