const {Client, GatewayIntentBits, Events, AuditLogEvent, EmbedBuilder} = require('discord.js');

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
        await new Promise(r => setTimeout(r, 500)); 
        const fetchedLogs = await oldState.guild.fetchAuditLogs({
            type: AuditLogEvent.MemberMove,
            limit: 5
        });

        // เปลี่ยนชื่อตัวแปรเป็น currentTime เพื่อไม่ให้ซ้ำกับ now ด้านบน
        const nowTs = Date.now();
        const moveLog = fetchedLogs.entries.find(entry => {
            const isRecent = (nowTs - entry.createdTimestamp) < 2000;
            const isSameChannel = entry.extra?.channel?.id === newCh.id;

            return isRecent && isSameChannel;
        });

        if (moveLog) {
            movedBy = moveLog.executor;
        }
        } catch (err) {
            console.log('Audit log error:', err);
        }
        // แสดงผล
        const member = newState.member;
        const actionLine = movedBy && movedBy.id !== member.id ? `${member} ถูกย้ายโดย ${movedBy}` : `${member} ย้ายห้องเอง`;
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("📢 Voice Activity")
            .addFields(
                { name: "⏰ เวลา", value: timeNow, inline: true },
                { name: "👤 ผู้ใช้", value: `${member}`, inline: true },
                { name: "📌 การกระทำ", value: actionLine }
            )
            .addFields(
                { name: "จาก", value: oldCh.name, inline: true },
                { name: "ไปยัง", value: newCh.name, inline: true }
            )
            .setTimestamp();
        logChannel.send({ embeds: [embed] });
    }
});

bot.login(process.env.DISCORD_TOKEN);
