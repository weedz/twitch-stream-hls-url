import { calculateTimeDifference } from "./lib/time.js";

const form = document.getElementById("form");
const submitBtn = form.querySelector(".submit-btn");
const infoSection = document.getElementById("info");

const favoriteChannelsListEl = document.getElementById("favorite-channels");

/** @type {string[]} */
let favoriteChannels = [];
/** @type {import("../lib/cache.js").Channel[]} */
let channelsData = [];
{
    const channels = localStorage.getItem("channels");
    if (!channels) {
        localStorage.setItem("channels", JSON.stringify([]));
    } else {
        // TODO: We just assumes the data is correct :+1:
        favoriteChannels = JSON.parse(channels);
    }
}
async function loadFavoriteChannels() {
    while (favoriteChannelsListEl.firstChild) {
        favoriteChannelsListEl.removeChild(favoriteChannelsListEl.firstChild);
    }
    if (favoriteChannels.length === 0) {
        return;
    }

    const response = await fetch(`/channels?logins=${favoriteChannels.join(",")}`);
    const channelsResponseData = await response.json();

    channelsData = channelsResponseData.filter(channel => !!channel);

    // Remove invalid channels from localstorage
    favoriteChannels = channelsData.map(channel => channel.login);
    storeFavoriteChannels();

    // Sort "live" channels first, then by "channel name" in ascending order
    channelsData.sort((a, b) => {
        if (a.stream !== null && b.stream !== null || a.stream === b.stream) {
            return a.login.localeCompare(b.login);
        }
        return a.stream === null ? 1 : -1
    });

    const dateNow = Date.now();

    for (const channel of channelsData) {
        const item = document.createElement("li");
        const channelTitle = document.createElement("p");
        let game;
        if (!channel.stream) {
            game = "OFFLINE";
        } else if (channel.stream.game) {
            game = channel.stream.game.displayName;
        } else {
            game = "UNKNOWN";
        }
        channelTitle.textContent = `${channel.login} (${game}): ${channel.broadcastSettings.title}`;
        item.appendChild(channelTitle);

        if (channel.stream?.type === "live") {
            item.classList.add("online");

            const channelCreatedDate = new Date(channel.stream.createdAt);
            if (!Number.isNaN(channelCreatedDate.valueOf())) {
                const timeDifference = calculateTimeDifference(channelCreatedDate.getTime(), dateNow);
                const uptimeEl = document.createElement("p");
                uptimeEl.classList.add("small");
                uptimeEl.textContent = `Uptime ${timeDifference.hours}:${timeDifference.minutes.toString().padStart(2, "0")}:${timeDifference.seconds.toString().padStart(2, "0")}`;
                item.appendChild(uptimeEl);
            }

            const castBtn = document.createElement("button");
            castBtn.type = "button";
            castBtn.classList.add("cast-btn");
            castBtn.textContent = "Cast";
            castBtn.addEventListener("click", () => {
                castChannel(channel.login);
            });
            item.appendChild(castBtn);
        } else {
            item.classList.add("offline");
        }

        const removeFavoriteBtn = document.createElement("button");
        removeFavoriteBtn.textContent = "Remove";
        removeFavoriteBtn.type = "button";
        removeFavoriteBtn.addEventListener("click", () => {
            const idx = favoriteChannels.indexOf(channel.login);
            if (idx === -1 || !confirm(`Remove channel '${favoriteChannels[idx]}' from favorites?`)) {
                return;
            }

            favoriteChannels.splice(idx >>> 0, 1);
            storeFavoriteChannels();
            loadFavoriteChannels();
        });
        item.appendChild(removeFavoriteBtn);

        favoriteChannelsListEl.appendChild(item);
    }
}
function storeFavoriteChannels() {
    localStorage.setItem("channels", JSON.stringify(favoriteChannels));
}
async function castChannel(channel) {
    const body = { channel };
    const response = await fetch("/twitch", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "content-type": "application/json",
        }
    });

    infoSection.textContent = `Casting channel "${channel}" to fcast reciever...`;

    disableCastButtons();
    clearInfoTimeout = window.setTimeout(() => {
        enableCastButtons();
        infoSection.textContent = "";
    }, 5000);

    if (!response.ok) {
        infoSection.textContent = `Request failed. Status code: ${response.status} ${response.statusText}`;
    }

    return response.ok;
}
function disableCastButtons() {
    submitBtn.disabled = true;
    const buttons = document.getElementsByClassName("cast-btn");
    for (const button of buttons) {
        button.disabled = true;
    }
}
function enableCastButtons() {
    submitBtn.disabled = false;
    const buttons = document.getElementsByClassName("cast-btn");
    for (const button of buttons) {
        button.disabled = false;
    }
}

loadFavoriteChannels();

let clearInfoTimeout;
form.addEventListener("submit", async e => {
    e.preventDefault();

    window.clearTimeout(clearInfoTimeout);

    const channel = e.currentTarget.channel.value;
    if (!channel) {
        return;
    }

    const response = await castChannel(channel);
    if (response) {
        if (!favoriteChannels.includes(channel)) {
            favoriteChannels.push(channel);
            storeFavoriteChannels();
            loadFavoriteChannels();
        }
    }
});
