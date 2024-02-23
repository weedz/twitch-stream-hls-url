/**
 * @typedef {Object} Game
 * @property {string} displayName
 */

/**
 * @typedef {Object} ChannelStream
 * @property {number} id
 * @property {"live" | null} type
 * @property {number} viewersCount
 * @property {Game} game
 */

/**
 * @typedef {Object} ChannelBroadcastSettings
 * @property {string} title
 */

/**
 * @typedef {Object} Channel
 * @property {string} login
 * @property {ChannelStream} stream
 * @property {ChannelBroadcastSettings} broadcastSettings
 */

const CACHE_TIME = 60000;

export class ChannelCache {
    /** @type {Map<string, Channel>} */
    #cache = new Map();

    cleanupCb = () => {
        const currentTimestamp = Date.now();
        // console.log("Checking items:", this.#keys);
        for (const key of this.#keys) {
            if (key[1] + CACHE_TIME < currentTimestamp) {
                this.#cache.delete(key[0]);
                // console.log("Remove channel from cache:", key);
                this.#keys.splice(this.#keys.indexOf(key) >>> 0, 1);
            }
        }

        this.#cleanupTimer = setTimeout(this.cleanupCb, 1000);
    };

    #cleanupTimer = setTimeout(this.cleanupCb, 1000);
    #keys = [];



    [Symbol.dispose] = () => {
        // TODO: `using` and stuff. Could work :shrug:
        console.log("Dispose, destructor hype!");
        clearTimeout(this.#cleanupTimer);
    };

    /**
     * @param {string} login
     */
    getChannel(login) {
        return this.#cache.get(login);
    }

    /**
     * @param {string} login
     * @param {Channel} channel
     */
    setChannel(login, channel) {
        this.#cache.set(login, channel);
        this.#keys.push([login, Date.now(), 10000]);
    }
}
