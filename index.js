const { Client, GatewayIntentBits, Events, AuditLogEvent } = require('discord.js');

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
    ]
});

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}`);
});

bot.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const oldCh = oldState.channel;
    const newCh = newState.channel;
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeNow = `${hours}:${minutes}:${seconds}`;
    const logChannel = oldState.guild.channels.cache.find(c => c.name === "ทดสอบ-samabot" || c.name === "ห้องแจ้งเตือนเข้าออกห้องพูดคุย" );

    if (!logChannel) 
        return;
    // ====== เข้า Voice ======
    if (!oldCh && newCh) {
        logChannel.send(`**-----------------------------------------**`);
        logChannel.send(`**[⌚ เวลา : ${timeNow}] **`);
        logChannel.send(`**[${newState.member.user.username}]** เข้าห้องเสียง **\n${newCh.name}**`);
    }
    // ====== ออก Voice ======
    if (oldCh && !newCh) {
        logChannel.send(`**-----------------------------------------**`);
        logChannel.send(`**[⌚ เวลา : ${timeNow}] **`);
        logChannel.send(`**[${oldState.member.user.username}]** ออกจากห้องเสียง **\n${oldCh.name}**`);
    }
    // ====== ย้ายห้อง ======
    if (oldCh && newCh && oldCh.id !== newCh.id) {
        let movedBy = null;
        try {
            await new Promise(r => setTimeout(r, 1000));
            const fetchedLogs = await oldState.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberMove,
                limit: 5
            });
            const now = Date.now();
            const moveLog = fetchedLogs.entries.find(entry => {
            const isTarget = entry.target.id === newState.id;
            const isRecent = (now - entry.createdTimestamp) < 5000;
                return isTarget && isRecent;
            });
            if (moveLog) {
                movedBy = moveLog.executor;
            }
            } catch (err) {
                console.log('Audit log error:', err);
            }
        logChannel.send(`**-----------------------------------------**`);
        logChannel.send(`**[⌚ เวลา : ${timeNow}] **`);
        if (movedBy && movedBy.id !== newState.id) {
            logChannel.send(`**[${movedBy.username}] ได้ทำการย้าย**`);
        } else {
            logChannel.send(`**[${newState.member.user.username}] ได้เข้ามาเอง**`);
        }
        logChannel.send(` ย้ายออกจากห้อง **\n${oldCh.name}\n** ------- ⬇️⬇️⬇️ ------- **\n${newCh.name}**`);
    }
});

bot.login(process.env.DISCORD_TOKEN);
