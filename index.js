const { Client, GatewayIntentBits, Events } = require('discord.js');

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}`);
});

bot.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const oldCh = oldState.channel;
    const newCh = newState.channel;

    const logChannel = oldState.guild.channels.cache.find(c => c.name === "log-voice");
    if (!logChannel) return;

    if (!oldCh && newCh) {
        logChannel.send(`🔊 **${newState.member.user.username}** เข้าห้องเสียง **${newCh.name}**`);
    }

    if (oldCh && !newCh) {
        logChannel.send(`🔇 **${oldState.member.user.username}** ออกจากห้องเสียง **${oldCh.name}**`);
    }

    if (oldCh && newCh && oldCh.id !== newCh.id) {
        logChannel.send(`➡️ **${newState.member.user.username}** ย้ายจาก **${oldCh.name}** ไป **${newCh.name}**`);
    }
});

bot.login(process.env.DISCORD_TOKEN);
