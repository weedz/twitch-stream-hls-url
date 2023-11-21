/*
SOURCE:
- https://gitlab.futo.org/videostreaming/plugins/twitch/-/blob/master/TwitchScript.js
- https://github.com/streamlink/streamlink/blob/master/src/streamlink/plugins/twitch.py


curl https://gql.twitch.tv/gql -X POST -H 'content-type: application/json' -H 'Client-ID: kimne78kx3ncx6brgo4mv6wki5h1ko' -d '{"operationName":"StreamMetadata","extensions":{"persistedQuery":{"version":1,"sha256Hash":"1c719a40e481453e5c48d9bb585d971b8b372f8ebb105b17076722264dfa5b3e"}},"variables":{"channelLogin":"wirtual"}}'
*/

// const hls_url = `https://usher.ttvnw.net/api/channel/hls/${login}.m3u8?acmb=e30=&allow_source=true&fast_bread=true&p=&play_session_id=&player_backend=mediaplayer&playlist_include_framerate=true&reassignments_supported=true&sig=${spat.signature}&supported_codecs=avc1&token=${spat.value}&transcode_mode=vbr_v1&cdm=wv&player_version=1.20.0`

// const CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko"; // OLD
const CLIENT_ID = "ue6666qo983tsx6so1t0vnawi233wa";
const GQL_URL = "https://gql.twitch.tv/gql";

async function getStreamMetadata(channelLogin) {
    const res = await fetch(GQL_URL, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Client-ID": CLIENT_ID,
        },
        body: JSON.stringify({
            operationName: "StreamMetadata",
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash: "1c719a40e481453e5c48d9bb585d971b8b372f8ebb105b17076722264dfa5b3e"
                }
            },
            variables: {
                channelLogin
            }
        }),
    });
    if (!res.ok) {
        console.error("Failed to read stream");
        console.log("response:", await res.json().catch(_ => null));
        process.exit(1);
    }

    const responseJson = await res.json();
    console.log("response:", responseJson);
}

async function getPlaybackAccessToken(channelLogin) {
    const res = await fetch(GQL_URL, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Client-ID": CLIENT_ID,
        },
        body: JSON.stringify({
            extensions: {
                persistedQuery: {
                    sha256Hash: '0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712',
                    version: 1,
                },
            },
            operationName: 'PlaybackAccessToken',
            variables: {
                isLive: true,
                isVod: false,
                login: channelLogin,
                playerType: 'frontpage',
                vodID: '',
            },
            query: 'query PlaybackAccessToken($login: String! $isLive: Boolean! $vodID: ID! $isVod: Boolean! $playerType: String!) { streamPlaybackAccessToken(channelName: $login params: {platform: "web" playerBackend: "mediaplayer" playerType: $playerType}) @include(if: $isLive) { value signature } videoPlaybackAccessToken(id: $vodID params: {platform: "web" playerBackend: "mediaplayer" playerType: $playerType}) @include(if: $isVod) { value signature } }',
        }),
    });
    const responseJson = await res.json().catch(_ => null);
    if (!res.ok || !responseJson || !responseJson.data?.streamPlaybackAccessToken) {
        console.error("Failed to read stream");
        console.log("response:", await res.json().catch(_ => null));
        process.exit(1);
    }

    console.log("response:", responseJson);
    return responseJson.data.streamPlaybackAccessToken;
}

function printPlaybackUrl(channelLogin, playbackAccessToken) {
    const hls_url = `https://usher.ttvnw.net/api/channel/hls/${channelLogin}.m3u8?acmb=e30=&allow_source=true&fast_bread=true&p=&play_session_id=&player_backend=mediaplayer&playlist_include_framerate=true&reassignments_supported=true&sig=${playbackAccessToken.signature}&supported_codecs=avc1&token=${playbackAccessToken.value}&transcode_mode=vbr_v1&cdm=wv&player_version=1.20.0`
    console.log("Url:", hls_url);
}
if (process.argv.length !== 3) {
    console.error(`Usage: ${process.argv0} main.js [channel name]`);
    process.exit(1);
}

const channelName = process.argv[2];

// await getStreamMetadata(channelName);
const playbackAccessToken = await getPlaybackAccessToken(channelName);
printPlaybackUrl(channelName, playbackAccessToken);
