const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const config = require("./config");

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["KING WILFRID MD", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connexion fermée, reconnexion...");
      if (shouldReconnect) start();
    } else if (connection === "open") {
      console.log("✅ KING WILFRID MD EST CONNECTÉ !");
      console.log("Bot :", config.botName);
      console.log("Owner :", config.ownerNumber);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const from = msg.key.remoteJid;

    // Commande test
    if (text === ".ping") {
      await sock.sendMessage(from, { text: "🏓 Pong ! KING WILFRID MD est en ligne 🔥\n\nChaîne : " + config.channelLink });
    }

    if (text === ".menu") {
      await sock.sendMessage(from, { text: "👑 *KING WILFRID MD*\n\n*.ping* - Tester le bot\n*.menu* - Voir ce menu\n\nChaîne : " + config.channelLink });
    }
  });

  // Demande le code de pairing si pas connecté
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(config.ownerNumber);
        console.log("TON CODE DE PAIRING :", code);
        console.log("Va dans WhatsApp > Appareils liés > Lier avec un numéro");
      } catch (e) {
        console.log("Erreur pairing :", e.message);
      }
    }, 3000);
  }
}

start();
