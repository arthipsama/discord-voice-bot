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
        // เพิ่มเวลาการรอให้ Discord บันทึก Audit Log ลงระบบให้เสร็จก่อน
        await new Promise(r => setTimeout(r, 1000)); 

        const fetchedLogs = await oldState.guild.fetchAuditLogs({
            type: AuditLogEvent.MemberMove,
            limit: 5
        });

        console.log("===== DEBUG AUDIT LOG =====");
        fetchedLogs.entries.forEach(entry => {
            console.log({
                executor: entry.executor?.username,
                target: entry.target?.username,
                channel: entry.extra?.channel?.name,
                created: new Date(entry.createdTimestamp)
            });
        });
        console.log("===== END DEBUG =====");
            
        // เปลี่ยนชื่อตัวแปรเป็น currentTime เพื่อไม่ให้ซ้ำกับ now ด้านบน
        const nowTs = Date.now();
        const moveLog = fetchedLogs.entries.find(entry => {

            const isRecent = (nowTs - entry.createdTimestamp) < 7000;
            const isSameChannel = entry.extra?.channel?.id === newCh.id;

            return isRecent && isSameChannel;
        });

        if (moveLog) {
            movedBy = moveLog.executor;
        }
        } catch (err) {
            console.log('Audit log error:', err);
        }
        logChannel.send(`**-----------------------------------------**`);
        logChannel.send(`**[⌚ เวลา : ${timeNow}] **`);
    
        // เช็คว่ามีคนย้าย และคนที่ย้ายไม่ใช่ตัวเอง
        if (movedBy && movedBy.id !== newState.id) {
            logChannel.send(`**[${movedBy.username}] ได้ทำการย้าย**`);
        } else {
            logChannel.send(`**[${newState.member.user.username}] ได้เข้ามาเอง**`);
        }
        logChannel.send(` ย้ายออกจากห้อง **\n${oldCh.name}\n** ------- ⬇️⬇️⬇️ ------- **\n${newCh.name}**`);
    }
});

bot.login(process.env.DISCORD_TOKEN);
