const Discord = require('discord.js');
const config = require('./config/settings.json');
const app = require('./modules/discord.js');
const logger = require('./modules/logger.js');
const parser = require('./modules/parser.js');
const string = require('./modules/stringManager.js');
const user = require('./modules/user.js');

const client = new Discord.Client();
const channelMap = new Map();

client.once('ready', async () => {
    logger.log('info', `[discord.js] Connected to ${client.user.username}!`);
    for ([guildId, guild] of client.guilds.cache)
        channelMap.set(guild, await app.getChannel(guild));
        alertLoop();
});

client.on('guildCreate', async guild => {
    logger.log('verbose', `[discord.js] guild ${g.name}(${g.id}) has added the bot!`);
    channelMap.set(guild, await app.getChannel(guild));
});

const alertLoop = async () => {
    let interval = 10;
    let data = undefined;
    while (true) {
        await user.sleep(interval*1000);
        try {
            const result = await parser.parse(data);
            if (result === undefined) continue; // skip if data is not updated
            data = result;

            const message = [ string.stringFromId('safety.message.line1') ];
            for (let element of data) {
                const datetime = parser.readData(element.SJ, 'datetime');
                const location = parser.readData(element.SJ, 'location');
                const alertMessage = parser.readData(element.CONT, 'message');

                message.push(string.stringFromId('safety.message.line2', datetime, location));
                message.push(alertMessage);
            }

            for ([guild, channel] of channelMap) {
                app.sendMessage(channel, message);
            }
        } catch(err) {
            logger.log('error', err);
        }
    }
};

logger.init();
client.login(config.token);
