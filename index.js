const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json()); // para receber JSON no corpo da requisição

const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('QR code gerado, escaneie com seu WhatsApp');
});

client.on('ready', () => {
  console.log('Cliente WhatsApp pronto!');
});

// Endpoint para enviar mensagem
app.post('/send-message', async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios.' });
  }

  try {
    // Formato esperado: número completo com código do país, sem "+" nem espaços, ex: 5511999998888
    const chatId = number + "@c.us";

    await client.sendMessage(chatId, message);
    res.json({ status: 'Mensagem enviada!' });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Falha ao enviar mensagem' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

client.initialize();
