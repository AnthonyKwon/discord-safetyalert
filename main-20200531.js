const axios = require('axios');
const Discord = require('discord.js');
const { token, channels, roles, message } = require('./config/settings.json');
const apiUrl = 'http://www.safekorea.go.kr/idsiSFK/neo/ext/json/disasterDataList/disasterDataList.json';
const client = new Discord.Client();
let ready = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const sendMessage = async msg => {
    client.guilds.cache.forEach(async guild => {
        const curr_ch = guild.channels.cache.get(channels.find(ch => guild.channels.cache.get(ch)));
        const curr_r = guild.roles.cache.get(roles.find(r => guild.roles.cache.get(r)));

        if (!curr_ch || !curr_r) {
            console.error(`[discord.js] Unknown channel or role: ${curr_ch}:${curr_r}`);
        } else {
            curr_ch.send(`${curr_r} ${msg}`);
            await sleep(500);
        }
    });
}

client.once ('ready', () => {
    console.log (`[discord.js] Connected to ${client.user.username}!`);
    ready = true;
});

const replaceAll = (string, origin, replace) => string.split(origin).join(replace);

const askAxios = async (url) => {
    try {
        return await axios.get(url);
    } catch (e) {
        console.error (`[!| axios] ${error}`);
    }
};

const axiosMain = async () => {
    let lastStamp = '';
    let intv = 20;
    while (true) {
        if (!ready) {
            await sleep (intv*1000);
            continue;
        }

        console.log(`[axios] Connecting to ${apiUrl}...`);
        const response = await askAxios(apiUrl);
        console.log(`[axios] Server responded with ${response.status}`);

        if (response.status !== 200) {
            console.error(`[axios] There was an error connecting to server:\n${response.body}`);
            await sleep(2*intv*1000);
            continue;
        }

        for (const msg of response.data) {
            if (lastStamp === '') {
                lastStamp = response.data[0].SJ;
            }
            const curStamp = msg.SJ;
            const curMsg = msg.CONT;
            const cleanMsg = decodeURI(curMsg);

            if (lastStamp === curStamp) {
                break;
            }

            sendMessage(`${message}\n**일시와 장소:** ${curStamp}\n**내용:** ${cleanMsg}`);
        }
        lastStamp = response.data[0].SJ;
        await sleep(intv*1000);
    }
};

client.login(token);
axiosMain();