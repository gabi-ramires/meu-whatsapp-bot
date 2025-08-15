const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');

const app = express();
app.use(express.json());

// Configuração para persistir a sessão
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, '.wwebjs_auth')
  }),
  puppeteer: { 
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    headless: true
  }
});

let qrCodeImage = null;  // Aqui vamos guardar o QR code gerado em base64
let isReady = false;

client.on('qr', async qr => {
  try {
    qrCodeImage = await qrcode.toDataURL(qr); // Gera QR code como imagem base64
    console.log('QR code gerado, escaneie com seu WhatsApp');
    isReady = false;
  } catch (err) {
    console.error('Erro ao gerar QR code', err);
  }
});

client.on('ready', () => {
  console.log('Cliente WhatsApp pronto!');
  isReady = true;
  qrCodeImage = null; // Limpa o QR code quando conectado
});

client.on('authenticated', () => {
  console.log('Cliente autenticado!');
});

client.on('auth_failure', (msg) => {
  console.error('Falha na autenticação:', msg);
  isReady = false;
});

client.on('disconnected', (reason) => {
  console.log('Cliente desconectado:', reason);
  isReady = false;
  qrCodeImage = null;
});

// Rota para mostrar o QR code no navegador
app.get('/', (req, res) => {
  if (isReady) {
    return res.send(`
      <h1>WhatsApp Bot Conectado! ✅</h1>
      <p>O bot está pronto para enviar mensagens.</p>
      <p>Use POST /send-message para enviar mensagens.</p>
    `);
  }

  if (!qrCodeImage) {
    return res.send('<h1>QR code ainda não gerado, aguarde...</h1>');
  }

  res.send(`
    <h1>Escaneie o QR code com o WhatsApp</h1>
    <img src="${qrCodeImage}" />
    <p>Após escanear, a sessão será salva automaticamente.</p>
  `);
});

// Rota para verificar status
app.get('/status', (req, res) => {
  res.json({ 
    isReady, 
    hasQRCode: !!qrCodeImage,
    isAuthenticated: client.authStrategy.isAuthenticated
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

app.listen(process.env.PORT || 3000, () => {
  console.log('API rodando na porta ' + (process.env.PORT || 3000));
});
