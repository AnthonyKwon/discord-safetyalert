const fs = require('fs');

class ChannelException {
    constructor(reason) {
        this.reason = reason;
    }
}

// Read guild-channel data from 'config/guilds.json' file
async function readChannelFromFile(guild, raw=false) {
    if (!fs.existsSync('./config/guilds.json'))
        throw new ChannelException('FILE_NOT_EXIST');
    
    const stream = await fs.readFileSync('./config/guilds.json');
    if (raw === true) // if raw is true, return raw stream data
        return stream;
    
    const channelList = JSON.parse(stream.toString());
    const channel = guild.client.channels.cache.get(channelList[guild.id]);
    // check for channel permission
    if (channel.permissionsFor(guild.client.user).has('SEND_MESSAGES'))
        return channel;
    else
        throw new ChannelException('NO_PERMISSION');
}

// Write guild-channel data to 'config/guilds.json' file
async function writeChannelToFile(guild, newData) {
    let guildData = { };
    try {
        const stream = await readChannelFromFile(guild, true);
        guildData = JSON.parse(stream.toString());
    } catch (err) {
        // TODO: File doesn't exist, warn this to console
    }
    Object.assign(guildData, newData);
    await fs.writeFileSync('./config/guilds.json', JSON.stringify(guildData), { encoding: 'utf8' });
}

// Search for first available channel in specified guild
function searchChannel(guild) {
    for ([channelId, channel] of guild.channels.cache) {
        if (channel.type !== 'text') continue;
        // Check if bot has permission to send message
        if (channel.permissionsFor(guild.client.user).has('SEND_MESSAGES'))
            return channel;
    }
    // Failed to find valid channel, throw exception
    throw new ChannelException('NO_CHANNEL_FOUND');
}

// Get registered channel from specified guild (safe)
async function getChannel(guild, fallback=true) {
    let channel = undefined;
    try {
        channel = await readChannelFromFile(guild);
    } catch (err) {
        if (fallback === true) // Fallback is enabled, search for channel
            channel = searchChannel(guild);
        else // Fallback is disabled, reflect exception
            throw err;
    }
    return channel;
}

// Send message to specfieid channel (safe)
function sendMessage(channel, message, embed=undefined) {
    if (!channel.permissionsFor(channel.client.user).has('SEND_MESSAGES'))
        channel = searchChannel(channel.guild, true);
    
    // check if embed is available
    if (embed)
        channel.send(message, embed);
    else
        channel.send(message); 
}

module.exports = {
    getChannel,
    sendMessage
}
