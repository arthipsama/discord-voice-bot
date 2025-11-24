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
    const timeNow = new Date().toLocaleTimeString('th-TH', { hour12: false });
    const logChannel = oldState.guild.channels.cache.find(
        c => c.name === "ทดสอบ-samabot" || c.name === "ห้องแจ้งเตือนเข้าออกห้องพูดคุย" );

    if (!logChannel) return;
    if (!oldCh && newCh) {
        logChannel.send(`**----------------------------------------------**`);
        logChannel.send(`**[เวลา : ${timeNow}] **`);
        logChannel.send(`**[${newState.member.user.username}]** เข้าห้องเสียง **\n${newCh.name}**`);
    }
    if (oldCh && !newCh) {
        logChannel.send(`**----------------------------------------------**`);
        logChannel.send(`**[เวลา : ${timeNow}] **`);
        logChannel.send(`**[${oldState.member.user.username}]** ออกจากห้องเสียง **\n${oldCh.name}**`);
    }
    if (oldCh && newCh && oldCh.id !== newCh.id) {
        logChannel.send(`**----------------------------------------------**`);
        logChannel.send(`**[เวลา : ${timeNow}] **`);
        logChannel.send(`**[${newState.member.user.username}]** ย้ายห้องจาก **\n${oldCh.name}\n** ------- ⬇️⬇️⬇️ ------- **\n${newCh.name}**`);
    }
});

bot.login(process.env.DISCORD_TOKEN);
