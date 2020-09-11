const axios = require('axios');
const winston = require('winston');
const Discord = require('discord.js');
const { token, alertMsg, welcomeMsg } = require('./config/settings.json');
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
        curr_ch.send(`${msg}`);
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
            logger.error('error', `[axios] There was an error connecting to server:\n${response.body}`);
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
                //sendMessage(`${message}\n**일시와 장소:** ${stamp[i]}\n**내용:** ${messages[i]}`);
                sendMessage(alertMsg.format(stamp[i], messages[i]));
                await sleep(1000);
            }
        } catch (e) {
            logger.error ('error', `[!|axios] ${e}`);
            process.exit(1);
    }
        await sleep(intv*1000);
    }
};

client.login(token);
axiosMain();
