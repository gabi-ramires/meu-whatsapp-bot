const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

const client = new Client({
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

let isReady = false;

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('QR code gerado, escaneie com seu WhatsApp');
});

client.on('ready', () => {
  console.log('Cliente WhatsApp pronto!');
  isReady = true;
  app.listen(process.env.PORT || 3000, () => {
    console.log('API rodando na porta ' + (process.env.PORT || 3000));
  });
});

app.post('/send-message', async (req, res) => {
  if (!isReady) return res.status(503).json({ error: 'Cliente WhatsApp não está pronto' });

  const { number, message } = req.body;
  if (!number || !message) return res.status(400).json({ error: 'Número e mensagem obrigatórios' });

  try {
    const chatId = number + '@c.us';
    await client.sendMessage(chatId, message);
    res.json({ status: 'Mensagem enviada!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

client.initialize();
