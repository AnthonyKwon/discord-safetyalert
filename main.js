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
            // last parsed date/time
            const lastParsed = new Date(parser.readData(data[0].SJ, 'datetime').split(/\//).join('-').split(' ').join('T') + '+09:00');
            const embed = new Discord.MessageEmbed().setColor(14556188)
                .setTimestamp(lastParsed)
                .setFooter(string.stringFromId('safety.embed.last_update'));

            for (let i = (data.length-1); i >= 0; i--) { // inverted order (of array)
                if (i > 25) i = 25; // bot can have max 25 field for embed
                const location = parser.readData(data[i].SJ, 'location');
                const alertMessage = parser.readData(data[i].CONT, 'message');

                embed.addField(location, alertMessage);
            }

            for ([guild, channel] of channelMap) app.sendMessage(channel, message, embed);
        } catch(err) {
            logger.log('error', err);
        }
    }
};

logger.init();
client.login(config.token);
