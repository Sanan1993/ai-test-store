const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8805285337:AAFekM5hRqF555E3DGhLmgMhKpAiB5-goT8';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '596455016';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

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
// 1. SITEMAP.XML
// -------------------------------------------------------------
app.get('/sitemap.xml', (req, res) => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  sendTelegramMessage(`🗺️ <b>СКАНИРОВАНИЕ SITEMAP.XML!</b>\n\n<b>User-Agent:</b> <code>${userAgent}</code>\n<b>IP:</b> <code>${userIp}</code>`);

  const products = getProducts();
  const baseUrl = 'https://ai-bait-store.onrender.com';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
  products.forEach(p => {
    xml += `  <url><loc>${baseUrl}/product/${p.slug}</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>\n`;
  });
  xml += `</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// -------------------------------------------------------------
// 2. ГЛАВНАЯ СТРАНИЦА (КАТАЛОГ В ПРЕМИУМ-ДИЗАЙНЕ)
// -------------------------------------------------------------
app.get('/', (req, res) => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  sendTelegramMessage(`🏠 <b>ПРОСМОТР ГЛАВНОЙ СТРАНИЦЫ (КАТАЛОГ)!</b>\n\n<b>User-Agent:</b> <code>${userAgent}</code>\n<b>IP:</b> <code>${userIp}</code>`);

  const products = getProducts();
  
  let html = `
  <!DOCTYPE html>
  <html lang="ru">
  <head>
    <meta charset="UTF-8">
    <title>Baku Electro — Премиальная техника в Баку</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      :root {
        --primary: #2563eb;
        --primary-dark: #1d4ed8;
        --dark: #0f172a;
        --slate: #475569;
        --light-slate: #f8fafc;
        --border: #e2e8f0;
        --accent: #10b981;
      }
      * { box-sizing: border-box; }
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f1f5f9; margin: 0; padding: 0; color: var(--dark); -webkit-font-smoothing: antialiased; }
      .top-banner { background: var(--dark); color: #94a3b8; text-align: center; padding: 12px 20px; font-size: 13px; font-weight: 500; letter-spacing: 0.2px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .top-banner span { color: #f8fafc; font-weight: 600; }
      header { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--border); padding: 18px 0; }
      .container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }
      .nav-row { display: flex; justify-content: space-between; align-items: center; }
      .logo { font-size: 22px; font-weight: 800; color: var(--dark); text-decoration: none; letter-spacing: -0.5px; }
      .logo span { color: var(--primary); }
      .hero { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 56px 32px; border-radius: 24px; margin: 32px 0; text-align: center; box-shadow: 0 20px 30px -10px rgba(15, 23, 42, 0.15); border: 1px solid rgba(255,255,255,0.08); position: relative; overflow: hidden; }
      .hero h1 { margin: 0 0 14px 0; font-size: 36px; font-weight: 800; letter-spacing: -1px; line-height: 1.2; }
      .hero p { margin: 0 auto; opacity: 0.8; font-size: 17px; max-width: 600px; font-weight: 400; line-height: 1.6; color: #cbd5e1; }
      .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 40px; }
      .feature-item { background: #fff; padding: 20px; border-radius: 16px; text-align: center; font-size: 14px; font-weight: 600; color: var(--slate); border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: flex; align-items: center; justify-content: center; gap: 10px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 28px; }
      .card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 10px 15px -3px rgba(0,0,0,0.03); border: 1px solid var(--border); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); text-decoration: none; color: inherit; display: flex; flex-direction: column; }
      .card:hover { transform: translateY(-6px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08); border-color: #cbd5e1; }
      .card-body { padding: 24px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
      .card h3 { margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: var(--dark); line-height: 1.4; letter-spacing: -0.3px; }
      .price-box { margin-top: 20px; display: flex; align-items: baseline; gap: 10px; }
      .price { font-size: 24px; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }
      .old-price { text-decoration: line-through; color: #94a3b8; font-size: 15px; font-weight: 500; }
      .card-footer { margin-top: 18px; padding-top: 16px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
      .badge { display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .badge::before { content: ''; width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
      .arrow-link { font-size: 13px; font-weight: 600; color: var(--primary); }
      footer { margin-top: 60px; background: #fff; border-top: 1px solid var(--border); padding: 40px 0; text-align: center; color: var(--slate); font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="top-banner">⚡ <span>Экспресс-доставка по Баку за 45 минут</span> — Оплата при получении после проверки</div>
    <header>
      <div class="container nav-row">
        <a href="/" class="logo">BakuElectro<span>.az</span></a>
      </div>
    </header>
    <div class="container">
      <div class="hero">
        <h1>Оригинальная техника по лучшим ценам в Баку</h1>
        <p>Только запечатанные устройства с официальной гарантией 1 год и бесплатной курьерской доставкой</p>
      </div>

      <div class="features">
        <div class="feature-item">🚀 Доставка по Баку за 45 минут</div>
        <div class="feature-item">💳 Оплата наличными или картой</div>
        <div class="feature-item">🛡️ Официальная гарантия 12 месяцев</div>
      </div>

      <div class="grid">
  `;

  products.forEach(p => {
    html += `
        <a href="/product/${p.slug}" class="card">
          <div class="card-body">
            <h3>${p.name}</h3>
            <div class="price-box">
              <span class="price">${p.price} ₼</span>
              ${p.oldPrice ? `<span class="old-price">${p.oldPrice} ₼</span>` : ''}
            </div>
            <div class="card-footer">
              <span class="badge">В наличии в Баку</span>
              <span class="arrow-link">Подробнее →</span>
            </div>
          </div>
        </a>
    `;
  });

  html += `
      </div>
    </div>
    <footer>
      <div class="container">© 2026 BakuElectro Store. Все права защищены. Баку, Азербайджан.</div>
    </footer>
  </body>
  </html>
  `;

  res.send(html);
});

// -------------------------------------------------------------
// 3. СТРАНИЦА ТОВАРА С ПРЕМИУМ-МОДАЛКОЙ
// -------------------------------------------------------------
app.get('/product/:id', (req, res) => {
  const param = req.params.id;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  let visitorType = '👤 Обычный посетитель';
  if (userAgent.includes('GPTBot') || userAgent.includes('ChatGPT')) visitorType = '🤖 OpenAI / GPTBot';
  else if (userAgent.includes('PerplexityBot') || userAgent.includes('Perplexity')) visitorType = '🤖 PerplexityBot';
  else if (userAgent.includes('ClaudeBot') || userAgent.includes('Claude')) visitorType = '🤖 ClaudeBot';
  else if (userAgent.includes('Googlebot')) visitorType = '🔍 Googlebot';

  sendTelegramMessage(`👀 <b>НОВЫЙ ПРОСМОТР СТРАНИЦЫ ТОВАРА!</b>\n\n<b>Запрошен URL:</b> <code>/product/${param}</code>\n<b>Тип:</b> ${visitorType}\n<b>User-Agent:</b> <code>${userAgent}</code>\n<b>IP:</b> <code>${userIp}</code>`);

  const products = getProducts();
  const lowerParam = param.toLowerCase();

  let product = products.find(p => p.id === parseInt(param) || p.slug === lowerParam);
  if (!product) {
    product = products.find(p => {
      const pSlug = p.slug.replace(/-/g, ' ');
      const cleanParam = lowerParam.replace(/-/g, ' ');
      return cleanParam.includes(pSlug) || pSlug.includes(cleanParam);
    });
  }

  if (!product) {
    const formattedTitle = param.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    product = { id: 999, name: formattedTitle, price: 1090, description: `Оригинальный ${formattedTitle} с гарантией 1 год. Бесплатная доставка по Баку.`, slug: param };
  }

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
      "areaServed": { "@type": "City", "name": "Baku" }
    }
  };

  const safeName = String(product.name).replace(/"/g, '&quot;');

  const html = `
  <!DOCTYPE html>
  <html lang="ru">
  <head>
    <meta charset="UTF-8">
    <title>${product.name} — Купить в Баку с доставкой</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script type="application/ld+json">${JSON.stringify(schemaJson)}</script>
    <style>
      :root {
        --primary: #2563eb;
        --primary-dark: #1d4ed8;
        --dark: #0f172a;
        --slate: #475569;
        --border: #e2e8f0;
        --accent: #10b981;
      }
      * { box-sizing: border-box; }
      body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: var(--dark); -webkit-font-smoothing: antialiased; }
      .container { max-width: 720px; margin: 20px auto; }
      .back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 24px; color: var(--slate); text-decoration: none; font-weight: 600; font-size: 14px; transition: color 0.2s; }
      .back:hover { color: var(--primary); }
      .card { background: #fff; border-radius: 24px; padding: 40px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.04); border: 1px solid var(--border); }
      h1 { font-size: 28px; font-weight: 800; color: var(--dark); margin: 0 0 16px 0; letter-spacing: -0.5px; line-height: 1.3; }
      .price-tag { font-size: 36px; font-weight: 800; color: var(--primary); margin: 20px 0; letter-spacing: -1px; }
      .badges-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
      .badge-item { background: #eff6ff; color: #1e40af; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; }
      .description { color: var(--slate); line-height: 1.7; font-size: 16px; margin-bottom: 32px; border-top: 1px solid #f1f5f9; padding-top: 24px; font-weight: 400; }
      .btn { display: block; width: 100%; background: var(--accent); color: white; text-align: center; padding: 20px 0; border-radius: 14px; font-size: 18px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25); }
      .btn:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35); }

      /* ПРЕМИУМ МОДАЛЬНОЕ ОКНО */
      .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 1000; justify-content: center; align-items: center; padding: 20px; }
      .modal { background: white; padding: 36px; border-radius: 28px; width: 100%; max-width: 420px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); position: relative; text-align: center; border: 1px solid rgba(255,255,255,0.2); }
      .modal h2 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: var(--dark); letter-spacing: -0.5px; }
      .modal p { color: var(--slate); font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
      .form-group { margin-bottom: 20px; text-align: left; }
      .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #334155; }
      .form-group input { width: 100%; padding: 16px; border: 1.5px solid var(--border); border-radius: 12px; font-size: 16px; box-sizing: border-box; outline: none; transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit; }
      .form-group input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
      .submit-btn { width: 100%; background: var(--primary); color: white; border: none; padding: 18px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
      .submit-btn:hover { background: var(--primary-dark); }
      .close-modal { position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 18px; cursor: pointer; color: var(--slate); display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
      .close-modal:hover { background: #e2e8f0; }

      .success-icon { width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px auto; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="container">
      <a href="/" class="back">← Вернуться в каталог</a>
      <div class="card">
        <h1>${product.name}</h1>
        
        <div class="badges-row">
          <span class="badge-item">🟢 В наличии в Баку</span>
          <span class="badge-item">⚡ Доставка за 45 минут</span>
          <span class="badge-item">🛡️ 1 год гарантии</span>
        </div>

        <div class="price-tag">${product.price} ₼</div>
        <p class="description">${product.description}</p>

        <button id="openModalBtn" class="btn" data-id="${product.id}" data-name="${safeName}" data-price="${product.price}">
          Заказать с доставкой
        </button>
      </div>
    </div>

    <!-- 1. Форма заказа -->
    <div id="modalOverlay" class="modal-overlay">
      <div class="modal">
        <button id="closeModalBtn" class="close-modal">&times;</button>
        <h2>Быстрый заказ</h2>
        <p>Укажите ваш номер телефона, и менеджер свяжется с вами через 5 минут для подтверждения адреса.</p>

        <form id="orderForm">
          <div class="form-group">
            <label>Номер телефона / WhatsApp</label>
            <input type="tel" id="custPhone" placeholder="+994 (50) 000-00-00" required autofocus>
          </div>
          <button type="submit" class="submit-btn" id="subBtn">Подтвердить заказ</button>
        </form>
      </div>
    </div>

    <!-- 2. Окно успешной отправки -->
    <div id="successOverlay" class="modal-overlay">
      <div class="modal">
        <div class="success-icon">✓</div>
        <h2>Заказ успешно оформлен</h2>
        <p>Спасибо! Менеджер свяжется с вами по указанному номеру для уточнения деталей доставки.</p>
        <button id="closeSuccessBtn" class="submit-btn" style="background: var(--accent);">Отлично</button>
      </div>
    </div>

    <script>
      const modal = document.getElementById('modalOverlay');
      const successModal = document.getElementById('successOverlay');
      const openBtn = document.getElementById('openModalBtn');
      const closeBtn = document.getElementById('closeModalBtn');
      const closeSuccessBtn = document.getElementById('closeSuccessBtn');
      const form = document.getElementById('orderForm');

      openBtn.addEventListener('click', () => modal.style.display = 'flex');
      closeBtn.addEventListener('click', () => modal.style.display = 'none');
      closeSuccessBtn.addEventListener('click', () => successModal.style.display = 'none');

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const subBtn = document.getElementById('subBtn');
        subBtn.innerText = 'Отправка...';
        subBtn.disabled = true;

        fetch('/api/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: openBtn.getAttribute('data-id'),
            productName: openBtn.getAttribute('data-name'),
            price: openBtn.getAttribute('data-price'),
            customerPhone: document.getElementById('custPhone').value
          })
        }).then(res => {
          modal.style.display = 'none';
          successModal.style.display = 'flex';
          subBtn.innerText = 'Подтвердить заказ';
          subBtn.disabled = false;
          form.reset();
        }).catch(err => {
          modal.style.display = 'none';
          successModal.style.display = 'flex';
          subBtn.innerText = 'Подтвердить заказ';
          subBtn.disabled = false;
          form.reset();
        });
      });
    </script>
  </body>
  </html>
  `;

  res.send(html);
});

// -------------------------------------------------------------
// 4. ТРЕКИНГ ЗАКАЗОВ
// -------------------------------------------------------------
app.post('/api/click', (req, res) => {
  const { productId, productName, price, customerPhone } = req.body;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const clickText = `🔥 <b>НОВЫЙ РЕАЛЬНЫЙ ЗАКАЗ!</b>\n\n` +
                    `<b>Телефон/WA:</b> <code>${customerPhone || 'Не указано'}</code>\n\n` +
                    `<b>Товар:</b> ${productName}\n` +
                    `<b>Цена:</b> ${price} ₼\n` +
                    `<b>ID:</b> ${productId}\n\n` +
                    `<b>User-Agent:</b> <code>${userAgent}</code>\n` +
                    `<b>IP:</b> <code>${userIp}</code>`;

  sendTelegramMessage(clickText);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
