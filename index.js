const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

const client = new Client({
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

let qrCodeImage = null;  // Aqui vamos guardar o QR code gerado em base64

client.on('qr', async qr => {
  try {
    qrCodeImage = await qrcode.toDataURL(qr); // Gera QR code como imagem base64
    console.log('QR code gerado, escaneie com seu WhatsApp');
  } catch (err) {
    console.error('Erro ao gerar QR code', err);
  }
});

client.on('ready', () => {
  console.log('Cliente WhatsApp pronto!');
  isReady = true;
});

// Rota para mostrar o QR code no navegador
app.get('/', (req, res) => {
  if (!qrCodeImage) {
    return res.send('<h1>QR code ainda não gerado, aguarde...</h1>');
  }

  res.send(`
    <h1>Escaneie o QR code com o WhatsApp</h1>
    <img src="${qrCodeImage}" />
  `);
});

let isReady = false;

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

app.listen(process.env.PORT || 3000, () => {
  console.log('API rodando na porta ' + (process.env.PORT || 3000));
});
