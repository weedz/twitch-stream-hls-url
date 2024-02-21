const form = document.getElementById("form");
const submitBtn = form.querySelector(".submit-btn");
const infoSection = document.getElementById("info");

const favoriteChannelsListEl = document.getElementById("favorite-channels");

/** @type {string[]} */
let favoriteChannels = [];
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

    const channelsData = channelsResponseData.filter(channel => !!channel);

    // Remove invalid channels from localstorage
    favoriteChannels = channelsData.map(channel => channel.login);
    storeFavoriteChannels();

    // Sort "live" channels first, then by "channel name" in ascending order 
    channelsData.sort((a, b) => a.stream?.type === "live" && a.login.localeCompare(b.login));

    for (const channel of channelsData) {
        const item = document.createElement("li");
        const channelTitle = document.createElement("p");
        channelTitle.textContent = `${channel.login}: ${channel.broadcastSettings.title}`;
        item.appendChild(channelTitle);

        if (channel.stream?.type === "live") {
            const castBtn = document.createElement("button");
            castBtn.type = "button";
            castBtn.classList.add("cast-btn");
            castBtn.textContent = "Cast";
            castBtn.addEventListener("click", () => {
                castChannel(channel.login);
            });
            item.appendChild(castBtn);
        }

        const removeFavoriteBtn = document.createElement("button");
        removeFavoriteBtn.textContent = "Remove";
        removeFavoriteBtn.type = "button";
        removeFavoriteBtn.addEventListener("click", () => {
            const idx = favoriteChannels.indexOf(channel.login);

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
