const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Config
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8805285337:AAFekM5hRqF555E3DGhLmgMhKpAiB5-goT8';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '596455016';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Загрузка базы данных товаров
let products = [];
try {
  const data = fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8');
  products = JSON.parse(data);
  console.log(`[INFO] Успешно загружено ${products.length} товаров из products.json`);
} catch (err) {
  console.error('[ERROR] Ошибка чтения products.json:', err.message);
}

// Список известных ИИ-краулеров для Telegram-алертов
const AI_BOTS = [
  { name: 'PerplexityBot', pattern: /PerplexityBot/i },
  { name: 'GPTBot (OpenAI)', pattern: /GPTBot/i },
  { name: 'ChatGPT-User', pattern: /ChatGPT-User/i },
  { name: 'ClaudeBot (Anthropic)', pattern: /ClaudeBot/i },
  { name: 'Claude-Web', pattern: /Claude-Web/i },
  { name: 'Bytespider (TikTok)', pattern: /Bytespider/i },
  { name: 'Google-Extended', pattern: /Google-Extended/i },
  { name: 'Amazonbot', pattern: /Amazonbot/i },
  { name: 'Applebot-Extended', pattern: /Applebot-Extended/i }
];

// Мидлвар для логирования визитов ИИ-ботов
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const matchedBot = AI_BOTS.find(bot => bot.pattern.test(userAgent));

  if (matchedBot) {
    const msg = `🚨 <b>ИИ-БОТ ОБНАРУЖЕН!</b>\n\n` +
                `<b>Бот:</b> ${matchedBot.name}\n` +
                `<b>URL:</b> <code>${req.originalUrl}</code>\n` +
                `<b>IP:</b> ${ip}\n` +
                `<b>User-Agent:</b> <code>${userAgent}</code>`;

    sendTelegramAlert(msg);
  }

  next();
});

// Функция отправки сообщений в Telegram через https
function sendTelegramAlert(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('[LOG] Telegram-уведомление не отправлено.');
    return;
  }

  const payload = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'HTML'
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    res.on('data', () => {});
  });

  req.on('error', (err) => {
    console.error('[ERROR] Ошибка отправки в Telegram:', err.message);
  });

  req.write(payload);
  req.end();
}

// Генератор JSON-LD Schema.org для карточки товара
function generateSchemaJsonLd(product, host, protocol) {
  const productUrl = `${protocol}://${host}/product/${product.id}`;
  
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [product.image],
    "description": product.description,
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": product.currency,
      "price": product.price,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.availability === "InStock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "AI Bait Store Baku"
      }
    }
  };

  return JSON.stringify(schema, null, 2);
}

// 1. Главная страница — Каталог товаров
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Каталог товаров и услуг в Баку | AI Bait Store</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f4f6f8; color: #333; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { text-align: center; color: #111; }
        p.subtitle { text-align: center; color: #666; margin-bottom: 30px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; }
        .card h3 { margin-top: 0; font-size: 1.1rem; color: #1a0dab; }
        .category { font-size: 0.8rem; background: #eef2ff; color: #4f46e5; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 10px; }
        .price { font-size: 1.25rem; font-weight: bold; color: #059669; margin: 10px 0; }
        .btn { display: block; text-align: center; background: #2563eb; color: white; text-decoration: none; padding: 10px; border-radius: 8px; font-weight: 500; }
        .btn:hover { background: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Каталог товаров и услуг в Баку</h1>
        <p class="subtitle">Официальные цены, гарантия и быстрая доставка по Азербайджану</p>
        <div class="grid">
          ${products.map(p => `
            <div class="card">
              <div>
                <span class="category">${p.category}</span>
                <h3>${p.name}</h3>
                <p style="font-size: 0.9rem; color: #555;">${p.description.substring(0, 90)}...</p>
              </div>
              <div>
                <div class="price">${p.price > 0 ? p.price + ' ' + p.currency : 'Бесплатно / Заказ'}</div>
                <a href="/product/${p.id}" class="btn">Посмотреть товар</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </body>
    </html>
  `);
});

// 2. Динамическая страница товара
app.get('/product/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).send('<h1>Товар не найден (404)</h1><a href="/">Вернуться в каталог</a>');
  }

  const jsonLdData = generateSchemaJsonLd(product, req.get('host'), req.protocol);

  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>${product.name} — Купить в Баку по цене ${product.price} ${product.currency}</title>
      <meta name="description" content="${product.description}">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      
      <!-- Schema.org JSON-LD Разметка для ИИ-ботов -->
      <script type="application/ld+json">
      ${jsonLdData}
      </script>

      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f4f6f8; color: #333; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        a.back { text-decoration: none; color: #2563eb; font-weight: 500; display: inline-block; margin-bottom: 20px; }
        h1 { font-size: 1.8rem; margin-top: 0; }
        .price { font-size: 2rem; font-weight: bold; color: #059669; margin: 15px 0; }
        .specs { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .specs table { width: 100%; border-collapse: collapse; }
        .specs td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .specs td:first-child { font-weight: 500; color: #64748b; }
        .btn-buy { background: #059669; color: white; border: none; padding: 15px 30px; font-size: 1.1rem; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; }
        .btn-buy:hover { background: #047857; }
        
        /* Modal Styles */
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; }
        .modal-content { background: white; padding: 25px; border-radius: 12px; max-width: 400px; width: 90%; }
        .modal h3 { margin-top: 0; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
        .form-group input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
        .btn-submit { background: #2563eb; color: white; border: none; padding: 12px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; }
        .btn-close { background: #e5e7eb; border: none; padding: 8px; width: 100%; border-radius: 6px; margin-top: 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="/" class="back">← Назад в каталог</a>
        <h1>${product.name}</h1>
        <p><strong>Бренд:</strong> ${product.brand} | <strong>Категория:</strong> ${product.category}</p>
        <div class="price">${product.price > 0 ? product.price + ' ' + product.currency : 'Запрос цены / Бронирование'}</div>
        <p>${product.description}</p>

        <div class="specs">
          <h3>Характеристики и условия:</h3>
          <table>
            ${Object.entries(product.specs).map(([key, val]) => `
              <tr>
                <td>${key}:</td>
                <td><strong>${val}</strong></td>
              </tr>
            `).join('')}
          </table>
        </div>

        <button class="btn-buy" onclick="openModal()">Заказать / Оформить в Баку</button>
      </div>

      <!-- Modal Form -->
      <div id="orderModal" class="modal">
        <div class="modal-content">
          <h3>Оформление заявки</h3>
          <p style="font-size: 0.9rem; color: #666;">Укажите контактные данные для подтверждения заказа в Баку</p>
          <form id="orderForm">
            <div class="form-group">
              <label>Ваше имя</label>
              <input type="text" id="custName" required placeholder="Например, Рауф">
            </div>
            <div class="form-group">
              <label>Номер телефона / WhatsApp</label>
              <input type="tel" id="custPhone" required placeholder="+994 50 000 00 00">
            </div>
            <button type="submit" class="btn-submit">Подтвердить заказ</button>
            <button type="button" class="btn-close" onclick="closeModal()">Отмена</button>
          </form>
        </div>
      </div>

      <script>
        function openModal() { document.getElementById('orderModal').style.display = 'flex'; }
        function closeModal() { document.getElementById('orderModal').style.display = 'none'; }

        document.getElementById('orderForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = document.getElementById('custName').value;
          const phone = document.getElementById('custPhone').value;

          const res = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productName: "${product.name}",
              productPrice: "${product.price} ${product.currency}",
              custName: name,
              custPhone: phone
            })
          });

          if (res.ok) {
            alert('Спасибо за заявку! Наш менеджер свяжется с вами в течение 15 минут.');
            closeModal();
          } else {
            alert('Ошибка отправки. Попробуйте снова.');
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Обработчик заказа (Отправка Лида в Telegram)
app.post('/api/order', (req, res) => {
  const { productName, productPrice, custName, custPhone } = req.body;

  const msg = `🛒 <b>НОВАЯ ЗАЯВКА НА ТОВАР!</b>\n\n` +
              `<b>Товар:</b> ${productName}\n` +
              `<b>Цена:</b> ${productPrice}\n` +
              `<b>Клиент:</b> ${custName}\n` +
              `<b>Телефон:</b> <code>${custPhone}</code>`;

  sendTelegramAlert(msg);
  res.json({ success: true });
});

// 3. Динамический Sitemap для ИИ и Поисковиков
app.get('/sitemap.xml', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;

  const urls = products.map(p => `
    <url>
      <loc>${protocol}://${host}/product/${p.id}</loc>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>
  `).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>${protocol}://${host}/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    ${urls}
  </urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(sitemap);
});

app.listen(PORT, () => {
  console.log(`[INFO] Сервер успешно запущен на порту ${PORT}`);
});
