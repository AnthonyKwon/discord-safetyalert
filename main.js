const axios = require('axios');
const winston = require('winston');
const Discord = require('discord.js');
const { token } = require('./config/token.json');
const { alertMsg, welcomeMsg } = require('./config/settings.json');
const apiUrl = 'http://www.safekorea.go.kr/idsiSFK/neo/ext/json/disasterDataList/disasterDataList.json';
const client = new Discord.Client();
let ready = false;

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'verbose.log', level: 'verbose' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

/* https://stackoverflow.com/a/18405800 */
if (!String.prototype.format) {
  String.prototype.format = function() {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined'
              ? args[number]
              : match
            ;
          });
    };
}

/* https://stackoverflow.com/a/52184527 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const firstChannel = guild => guild.channels.cache.filter(c => c.type === 'text' && c.permissionsFor(guild.client.user).has('SEND_MESSAGES')).first();

const sendMessage = msg => {
    client.guilds.cache.forEach(guild => {
        const curr_ch = firstChannel(guild);
        curr_ch ? curr_ch.send(`${msg}`) : logger.log('warn', `[discord.js] Failed to send message to some channel!`);
        sleep(500);
    });
}

client.once ('ready', () => {
    logger.log('info', `[discord.js] Connected to ${client.user.username}!`);
    ready = true;
});

client.on ('guildCreate', g => {
    logger.log('verbose', `[discord.js] guild ${g.name}(${g.id}) has added the bot!`);
    firstChannel(g).send(welcomeMsg.format(client.user.id));
});

const replaceAll = (string, origin, replace) => string.split(origin).join(replace);

const unescape = (string) => {
    const targetList = ['&middot;', '&lt;', '&gt;'];
    const replaceList = [String.fromCharCode(183), '<', '>'];
    let newstr = string;
    targetList.forEach(e => {
        newstr = newstr.split(e).join(replaceList[targetList.indexOf(e)]);
        return true;
    });
    return newstr;
}

/* parse and return SJ(Time/Location Information) */
const SJparse = (SJ, parseType) => {
    const SJsplit = SJ.split(' ');
    if (parseType === 'date') {
        SJsplit.pop();
        return SJsplit.join(' ');
    } else if (parseType === 'location') {
        try {
            return SJsplit[2].split('[')[1].replace(']', '');
        } catch (err) {
            logger.log('error', `[Axios] Failed to parse the data: ${err}\n${err.body}`);
        }
    }
}

const askAxios = async (url) => {
    try {
        return await axios.get(url);
    } catch (e) {
           logger.log ('error', `[!| axios] ${e}`);
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

        logger.log('verbose', `[axios] Connecting to ${apiUrl}...`);
        const response = await askAxios(apiUrl);
        logger.log('info',`[axios] Server responded with ${response.status}`);

        if (response.status !== 200) {
            logger.log('error', `[axios] There was an error connecting to server:\n${response.body}`);
            await sleep(2*intv*1000);
            continue;
        }

        let stamp = [], messages = [];
        try {
            for (const msg of response.data) {
                if (lastStamp === '') {
                    logger.log('warn', '[axios] Initial data not found. Fetching initial data...');
                    lastStamp = response.data[0].SJ;
                    logger.log('verbose', `INITIAL_DATA: ${lastStamp}\n${response.data[0].CONT}`);
                    stamp.unshift(lastStamp); // Debug
                    messages.unshift(response.data[0].CONT); // Debug
                }
                const curStamp = msg.SJ;
                const curMsg = msg.CONT;

                if (lastStamp === curStamp) {
                    break;
                }

                stamp.unshift(curStamp);
                messages.unshift(curMsg);
            }
            lastStamp = response.data[0].SJ;
            for (let i = 0; i < stamp.length; i++) {
                sendMessage(alertMsg.format(SJparse(stamp[i], 'date'), SJparse(stamp[i], 'location'), unescape(messages[i])));
                await sleep(1000);
            }
        } catch (e) {
            logger.log ('error', `[!|axios] ${e}`);
            process.exit(1);
    }
        await sleep(intv*1000);
    }
};

client.login(token);
axiosMain();
