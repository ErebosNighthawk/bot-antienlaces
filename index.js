const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

async function startBot() {
    // Obtener la última versión de Baileys
    const { version } = await fetchLatestBaileysVersion();
    console.log('Usando la versión de Baileys:', version);

    // Crear la conexión del bot
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({
        version,
        auth: state
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot(); // Reconectar si se cierra la conexión
            }
        } else if (connection === 'open') {
            console.log('Conexión abierta');
        }
    });

    // Escuchar los mensajes
    sock.ev.on('messages.upsert', async (m) => {
        console.log('Mensaje recibido: ', m);
        const message = m.messages[0];
        
        // Filtramos los mensajes con enlaces
        if (message.message.conversation) {
            const text = message.message.conversation;
            if (text.includes('http') || text.includes('www')) {
                console.log('Enlace detectado: ', text);
                
                // Enviar un mensaje de advertencia
                await sock.sendMessage(message.key.remoteJid, { text: '¡No se permiten enlaces!' });
            }
        }
    });
}

startBot();
