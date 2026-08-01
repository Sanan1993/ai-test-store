const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Конфигурация Telegram с твоими токенами
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8805285337:AAFekM5hRqF555E3DGhLmgMhKpAiB5-goT8';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '596455016';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Вспомогательная функция для создания читаемого слага (URL)
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Функция отправки сообщений в Telegram через встроенный fetch
async function sendTelegramMessage(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error.message);
  }
}

// Загрузка товаров из products.json с добавлением слагов
function getProducts() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8');
    const products = JSON.parse(data);
    return products.map(p => ({
      ...p,
      slug: p.slug || createSlug(p.name)
    }));
  } catch (err) {
    console.error('Ошибка чтения products.json:', err.message);
    return [];
  }
}

// -------------------------------------------------------------
// 1. ТРЕКИНГ SITEMAP.XML
// -------------------------------------------------------------
app.get('/sitemap.xml', (req, res) => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const text = `🗺️ <b>СКАНИРОВАНИЕ SITEMAP.XML!</b>\n\n` +
               `<b>User-Agent:</b> <code>${userAgent}</code>\n` +
               `<b>IP:</b> <code>${userIp}</code>`;
  
  sendTelegramMessage(text);

  const products = getProducts();
  const baseUrl = 'https://ai-bait-store.onrender.com';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;

  products.forEach(p => {
    xml += `  <url><loc>${baseUrl}/product/${p.slug}</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/product/${p.id}</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>\n`;
  });

  xml += `</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// -------------------------------------------------------------
// 2. ГЛАВНАЯ СТРАНИЦА (КАТАЛОГ)
// -------------------------------------------------------------
app.get('/', (req, res) => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const text = `🏠 <b>ПРОСМОТР ГЛАВНОЙ СТРАНИЦЫ (КАТАЛОГ)!</b>\n\n` +
               `<b>User-Agent:</b> <code>${userAgent}</code>\n` +
               `<b>IP:</b> <code>${userIp}</code>`;
  
  sendTelegramMessage(text);

  const products = getProducts();
  
  let html = `
  <!DOCTYPE html>
  <html lang="ru">
  <head>
    <meta charset="UTF-8">
    <title>AI Bait Store — Каталог электроники в Баку</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f5f7; margin: 0; padding: 20px; }
      .container { max-width: 1000px; margin: 0 auto; }
      h1 { text-align: center; color: #111; margin-bottom: 30px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
      .card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-decoration: none; color: inherit; transition: transform 0.2s; }
      .card:hover { transform: translateY(-3px); }
      .card h3 { margin: 0 0 10px 0; font-size: 18px; color: #1a1a1a; }
      .price { font-size: 20px; font-weight: bold; color: #0070f3; }
      .old-price { text-decoration: line-through; color: #888; font-size: 14px; margin-left: 8px; }
      .badge { display: inline-block; background: #e6f4ea; color: #137333; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Каталог товаров в Баку</h1>
      <div class="grid">
  `;

  products.forEach(p => {
    html += `
        <a href="/product/${p.slug}" class="card">
          <h3>${p.name}</h3>
          <div>
            <span class="price">${p.price} ₼</span>
            ${p.oldPrice ? `<span class="old-price">${p.oldPrice} ₼</span>` : ''}
          </div>
          <span class="badge">В наличии в Баку</span>
        </a>
    `;
  });

  html += `
      </div>
    </div>
  </body>
  </html>
  `;

  res.send(html);
});

// -------------------------------------------------------------
// 3. СТРАНИЦА ТОВАРА + УМНЫЙ ПОИСК И ГЕНЕРАЦИЯ КАРТОЧКИ
// -------------------------------------------------------------
app.get('/product/:id', (req, res) => {
  const param = req.params.id;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Определение типа посетителя
  let visitorType = '👤 Обычный посетитель';
  if (userAgent.includes('GPTBot') || userAgent.includes('ChatGPT')) {
    visitorType = '🤖 OpenAI / GPTBot';
  } else if (userAgent.includes('PerplexityBot') || userAgent.includes('Perplexity')) {
    visitorType = '🤖 PerplexityBot';
  } else if (userAgent.includes('ClaudeBot') || userAgent.includes('Claude')) {
    visitorType = '🤖 ClaudeBot';
  } else if (userAgent.includes('Googlebot')) {
    visitorType = '🔍 Googlebot';
  }

  // Отправляем уведомление о просмотре
  const viewText = `👀 <b>НОВЫЙ ПРОСМОТР СТРАНИЦЫ ТОВАРА!</b>\n\n` +
                   `<b>Запрошен URL:</b> <code>/product/${param}</code>\n` +
                   `<b>Тип:</b> ${visitorType}\n` +
                   `<b>User-Agent:</b> <code>${userAgent}</code>\n` +
                   `<b>IP:</b> <code>${userIp}</code>`;

  sendTelegramMessage(viewText);

  const products = getProducts();
  const lowerParam = param.toLowerCase();

  // 1. Поиск по ID или точным слагам
  let product = products.find(p => 
    p.id === parseInt(param) || 
    p.slug === lowerParam
  );

  // 2. Если не найден — поищем по вхождению слов
  if (!product) {
    product = products.find(p => {
      const pSlug = p.slug.replace(/-/g, ' ');
      const cleanParam = lowerParam.replace(/-/g, ' ');
      return cleanParam.includes(pSlug) || pSlug.includes(cleanParam);
    });
  }

  // 3. Если ВСЁ РАВНО не найден (например, кастомная ссылка от ИИ) — соберём динамическую карточку!
  if (!product) {
    const formattedTitle = param
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    product = {
      id: 999,
      name: formattedTitle,
      price: 1990,
      description: `Оригинальный ${formattedTitle} с официальной гарантией. Доставка по Баку в день заказа или самовывоз.`,
      slug: param
    };
  }

  // Формирование JSON-LD микроразметки Schema.org
  const schemaJson = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "sku": `SKU-${product.id}`,
    "offers": {
      "@type": "Offer",
      "url": `https://ai-bait-store.onrender.com/product/${product.slug}`,
      "priceCurrency": "AZN",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "areaServed": {
        "@type": "City",
        "name": "Baku"
      }
    }
  };

  const html = `
  <!DOCTYPE html>
  <html lang="ru">
  <head>
    <meta charset="UTF-8">
    <title>${product.name} — Купить в Баку</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script type="application/ld+json">
      ${JSON.stringify(schemaJson)}
    </script>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f5f7; margin: 0; padding: 20px; }
      .card { max-width: 600px; margin: 40px auto; background: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      h1 { font-size: 24px; color: #111; margin-top: 0; }
      .price-tag { font-size: 28px; font-weight: bold; color: #0070f3; margin: 15px 0; }
      .description { color: #555; line-height: 1.6; margin-bottom: 25px; }
      .btn { display: block; width: 100%; background: #10b981; color: white; text-align: center; padding: 16px 0; border-radius: 8px; font-size: 18px; font-weight: bold; border: none; cursor: pointer; text-decoration: none; transition: background 0.2s; }
      .btn:hover { background: #059669; }
      .back { display: inline-block; margin-bottom: 15px; color: #666; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="card">
      <a href="/" class="back">← Назад в каталог</a>
      <h1>${product.name}</h1>
      <div class="price-tag">${product.price} ₼</div>
      <p class="description">${product.description}</p>

      <button id="orderBtn" class="btn">Проверить наличие / Заказать</button>
    </div>

    <script>
      document.getElementById('orderBtn').addEventListener('click', function() {
        this.innerText = 'Проверяем наличие...';
        this.style.background = '#6b7280';
        
        fetch('/api/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: ${product.id},
            productName: "${product.name.replace(/"/g, '\\"')}",
            price: ${product.price}
          })
        }).then(() => {
          alert('Товар есть в наличии в Баку! Менеджер свяжется с вами.');
          this.innerText = 'В наличии!';
          this.style.background = '#10b981';
        }).catch(() => {
          this.innerText = 'Проверить наличие / Заказать';
          this.style.background = '#10b981';
        });
      });
    </script>
  </body>
  </html>
  `;

  res.send(html);
});

// -------------------------------------------------------------
// 4. ТРЕКИНГ КЛИКОВ ПО КНОПКЕ "ЗАКАЗАТЬ"
// -------------------------------------------------------------
app.post('/api/click', (req, res) => {
  const { productId, productName, price } = req.body;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const clickText = `🔥 <b>ЖИВОЙ КЛИК ПОКУПАТЕЛЯ!</b>\n\n` +
                    `<b>Товар:</b> ${productName} (ID: ${productId})\n` +
                    `<b>Цена:</b> ${price} ₼\n` +
                    `<b>User-Agent:</b> <code>${userAgent}</code>\n` +
                    `<b>IP:</b> <code>${userIp}</code>`;

  sendTelegramMessage(clickText);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
