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
    logger.log('info', `[discord.js] guild ${g.name}(${g.id}) has added the bot!`);
    channelMap.set(guild, await app.getChannel(guild));
});

const alertLoop = async () => {
    let interval = 60;
    let data = undefined;
    while (true) {
        // wait before next parse (skip when data is undefined)
        if (data) await user.sleep(interval*1000);
        try {
            const result = await parser.parse(data);
            if (result === undefined) continue; // skip if data is not updated
            data = result;
            
            const message = [ string.stringFromId('safety.message.line1') ];
            for (let i = data.length; i > 0; i-=25) {
                const start = i > 25 ? data.length - 25 : 0; // start point of the split
                const end = i; // end point of the split
                // slice data array by each 25, and reverse 
                const splitedData = data.slice(start, end).reverse();

                // last parsed date/time
                const lastParsed = new Date(parser.readData(splitedData[splitedData.length-1].SJ, 'isodatetime'));
                const embed = new Discord.MessageEmbed().setColor(14556188)
                    .setTimestamp(lastParsed)
                    .setFooter(string.stringFromId('safety.embed.last_update'));

                for (let element of splitedData) {
                    const location = parser.readData(element.SJ, 'location');
                    const alertMessage = parser.readData(element.CONT, 'message');
                    embed.addField(location, alertMessage);
                }
                for ([guild, channel] of channelMap) app.sendMessage(channel, message, embed);
                // sleep before send next message (only when next message exists)
                if (start > 0) await user.sleep(1000);
            }
        } catch(err) {
            logger.log('error', err.stack);
        }
    }
};

logger.init();
client.login(config.token);
