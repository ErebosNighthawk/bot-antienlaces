const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        const msg = messages[0];
        if (!msg.message || !msg.key.remoteJid.endsWith("@g.us")) return;

        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (/(https?:\/\/[^\s]+)/.test(texto)) {
            try {
                await sock.groupParticipantsUpdate(
                    msg.key.remoteJid,
                    [msg.key.participant],
                    "remove"
                );
                console.log(`👢 Usuario expulsado por enviar un enlace: ${msg.key.participant}`);
            } catch (err) {
                console.log("Error al expulsar:", err);
            }
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error = new Boom(lastDisconnect?.error))?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("conexión cerrada. reconectando:", shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === "open") {
            console.log("✅ Bot conectado");
        }
    });
}

startBot();
