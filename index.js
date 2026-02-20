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
        const embed = new EmbedBuilder().setColor(0x2ECC71).setTitle("🔊 เข้าใช้งาน Voice")
            .setDescription(
                `━━━━━━━━━━━━━━━━━━
                👤 ผู้ใช้: ${newState.member}
                📌 ทำการเข้าห้อง

                📍 ห้อง: ${newCh.name}`
            ).setTimestamp();
            return logChannel.send({ embeds: [embed] });
    }
    // ====== ออก Voice ======
    if (oldCh && !newCh) {
        let kickedBy = null;
        try {
            await new Promise(r => setTimeout(r, 500));
            const logs = await oldState.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberDisconnect
            });
            const nowTs = Date.now();
            const entry = logs.entries.find(e =>(nowTs - e.createdTimestamp) < 2000 && e.target?.id === oldState.id);

            if (entry) kickedBy = entry.executor;
            } catch (err) {
                console.log("Disconnect audit error:", err);
            }
            const member = oldState.member;
            const actionLine = kickedBy && kickedBy.id !== member.id ? `${member} ถูกเตะโดย ${kickedBy}` : `${member} ออกจากห้องเอง`;
            const embed = new EmbedBuilder().setColor(kickedBy ? 0xC0392B : 0xE74C3C).setTitle("🔊 ออกจาก Voice")
                .setDescription(
                    `━━━━━━━━━━━━━━━━━━
                    👤 ผู้ใช้: ${member}
                    📌 ${actionLine}

                    📍 ห้อง: ${oldCh.name}`
                    ).setTimestamp();
            return logChannel.send({ embeds: [embed] });
    }
    // ====== ย้ายห้อง ======
    if (oldCh && newCh && oldCh.id !== newCh.id) {
        let movedBy = null;
        try {
            // ====== เพิ่มเวลาการรอให้ Discord บันทึก Audit Log ลงระบบให้เสร็จก่อน ======
            await new Promise(r => setTimeout(r, 500)); 
            const fetchedLogs = await oldState.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberMove
            });

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
            // ====== แสดงผลเวลาย้ายผู้ใช้ , ย้ายห้องไปมาเอง ======
            const member = newState.member;
            const actionLine = movedBy && movedBy.id !== member.id? `${member} ถูกย้ายโดย ${movedBy}`: ` ย้ายห้องเอง`;
            const embed = new EmbedBuilder()
                .setColor(movedBy ? 0xF39C12 : 0x3498DB).setTitle("🔊 ย้ายห้อง Voice")
                .setDescription(
                    `━━━━━━━━━━━━━━━━━━
                    👤 ผู้ใช้: ${member}
                    📌 ${actionLine}

                    📤 จาก: ${oldCh.name}
                    📥 ไปยัง: ${newCh.name}`
                ).setTimestamp();
                logChannel.send({ embeds: [embed] });
    }
});

bot.login(process.env.DISCORD_TOKEN);
