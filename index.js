const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();
app.use(express.json());
app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;
  const results = await Promise.all(events.map(handleEvent));
  res.json(results);
});

const client = new line.Client(config);

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  const text = event.message.text;
  const isEnglish = /^[A-Za-z0-9\s.,'"!?;:()\-]+$/.test(text);
  const sourceLang = isEnglish ? 'en' : 'th';
  const targetLang = isEnglish ? 'th' : 'en';

  try {
    const translated = await axios.post('https://libretranslate.com/translate', {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    });
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: translated.data.translatedText,
    });
  } catch (error) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ แปลไม่สำเร็จ: ' + error.message,
    });
  }
}

app.get('/', (req, res) => res.send('LINE Translate Bot is running.'));
app.listen(process.env.PORT || 3000);
