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
// 2. ГЛАВНАЯ СТРАНИЦА (КАТАЛОГ С ПАГИНАЦИЕЙ)
// -------------------------------------------------------------
app.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!userAgent.includes('facebookexternalhit')) {
    sendTelegramMessage(`🏠 <b>ПРОСМОТР КАТАЛОГА (Стр. ${page})!</b>\n\n<b>User-Agent:</b> <code>${userAgent}</code>\n<b>IP:</b> <code>${userIp}</code>`);
  }

  const allProducts = getProducts();
  const totalPages = Math.ceil(allProducts.length / limit);
  const startIndex = (page - 1) * limit;
  const products = allProducts.slice(startIndex, startIndex + limit);
  
  let html = `
  <!DOCTYPE html>
  <html lang="az">
  <head>
    <meta charset="UTF-8">
    <title>BakuElectro.az — Orijinal Texnika Bakıda</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      :root {
        --primary: #2563eb;
        --dark: #0f172a;
        --slate: #475569;
        --border: #e2e8f0;
        --accent: #10b981;
      }
      * { box-sizing: border-box; }
      body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; margin: 0; padding: 0; color: var(--dark); }
      .top-banner { background: var(--dark); color: #e2e8f0; text-align: center; padding: 10px 16px; font-size: 13px; font-weight: 600; }
      header { background: #fff; border-bottom: 1px solid var(--border); padding: 16px 0; position: sticky; top: 0; z-index: 10; }
      .container { max-width: 1000px; margin: 0 auto; padding: 0 16px; }
      .logo { font-size: 22px; font-weight: 800; color: var(--dark); text-decoration: none; }
      .logo span { color: var(--primary); }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; margin: 24px 0; }
      .card { background: #fff; border-radius: 16px; border: 1px solid var(--border); overflow: hidden; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
      .card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
      .card-img-container { height: 200px; padding: 16px; display: flex; align-items: center; justify-content: center; background: #fff; }
      .card-img { max-width: 100%; max-height: 100%; object-fit: contain; }
      .card-body { padding: 16px; display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; }
      .card h3 { font-size: 15px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.4; color: var(--dark); }
      .price { font-size: 20px; font-weight: 800; color: var(--primary); }
      .old-price { text-decoration: line-through; color: #94a3b8; font-size: 13px; margin-left: 6px; }
      .btn-sm { margin-top: 12px; background: #f1f5f9; color: var(--dark); text-align: center; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 700; }
      
      .pagination { display: flex; justify-content: center; gap: 8px; margin: 32px 0 48px 0; }
      .page-btn { padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border); background: #fff; text-decoration: none; color: var(--dark); font-weight: 600; font-size: 14px; }
      .page-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
    </style>
  </head>
  <body>
    <div class="top-banner">⚡ Bakı üzrə 45 dəqiqəyə pulsuz çatdırılma • Qapıda ödəniş</div>
    <header>
      <div class="container">
        <a href="/" class="logo">BakuElectro<span>.az</span></a>
      </div>
    </header>
    <div class="container">
      <div class="grid">
  `;

  products.forEach(p => {
    html += `
        <a href="/product/${p.slug}" class="card">
          <div class="card-img-container">
            <img src="${p.image}" class="card-img" alt="${p.name}">
          </div>
          <div class="card-body">
            <h3>${p.name}</h3>
            <div>
              <span class="price">${p.price} ₼</span>
              ${p.oldPrice ? `<span class="old-price">${p.oldPrice} ₼</span>` : ''}
            </div>
            <div class="btn-sm">Baxmaq və Sifariş etmək →</div>
          </div>
        </a>
    `;
  });

  html += `
      </div>

      <div class="pagination">
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `<a href="/?page=${i}" class="page-btn ${i === page ? 'active' : ''}">${i}</a>`;
  }

  html += `
      </div>
    </div>
  </body>
  </html>
  `;

  res.send(html);
});

// -------------------------------------------------------------
// 3. СТРАНИЦА ТОВАРА
// -------------------------------------------------------------
app.get('/product/:id', (req, res) => {
  const param = req.params.id;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!userAgent.includes('facebookexternalhit')) {
    sendTelegramMessage(`👀 <b>ПРОСМОТР ТОВАРА!</b>\n\n<b>URL:</b> <code>/product/${param}</code>\n<b>User-Agent:</b> <code>${userAgent}</code>\n<b>IP:</b> <code>${userIp}</code>`);
  }

  const products = getProducts();
  const lowerParam = param.toLowerCase();

  let product = products.find(p => p.id === parseInt(param) || p.slug === lowerParam);
  if (!product) {
    product = products[0];
  }

  const safeName = String(product.name).replace(/"/g, '&quot;');

  const html = `
  <!DOCTYPE html>
  <html lang="az">
  <head>
    <meta charset="UTF-8">
    <title>${product.name} — Bakıda Sərfəli Qiymətə</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      :root {
        --primary: #2563eb;
        --dark: #0f172a;
        --slate: #475569;
        --border: #e2e8f0;
        --accent: #10b981;
      }
      * { box-sizing: border-box; }
      body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; margin: 0; padding: 16px; color: var(--dark); }
      .container { max-width: 600px; margin: 0 auto; }
      .back { display: inline-block; margin-bottom: 16px; color: var(--slate); text-decoration: none; font-weight: 600; font-size: 14px; }
      .card { background: #fff; border-radius: 20px; padding: 24px; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
      .img-wrapper { height: 260px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
      .product-img { max-width: 100%; max-height: 100%; object-fit: contain; }
      h1 { font-size: 22px; font-weight: 800; margin: 0 0 12px 0; line-height: 1.3; }
      .price-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 20px; }
      .price { font-size: 32px; font-weight: 800; color: var(--primary); }
      .old-price { text-decoration: line-through; color: #94a3b8; font-size: 18px; }
      .trust-box { background: #f8fafc; border-radius: 12px; padding: 14px; margin-bottom: 20px; border: 1px solid var(--border); }
      .trust-item { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
      .trust-item:last-child { margin-bottom: 0; }
      .description { font-size: 14px; color: var(--slate); line-height: 1.6; margin-bottom: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
      .btn { display: block; width: 100%; background: var(--accent); color: white; text-align: center; padding: 18px 0; border-radius: 14px; font-size: 17px; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3); }

      /* МОДАЛКА */
      .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(6px); z-index: 100; justify-content: center; align-items: center; padding: 16px; }
      .modal { background: white; padding: 28px; border-radius: 20px; width: 100%; max-width: 400px; position: relative; text-align: center; }
      .modal h2 { margin: 0 0 8px 0; font-size: 20px; font-weight: 800; }
      .modal p { color: var(--slate); font-size: 13px; margin-bottom: 20px; }
      .form-group input { width: 100%; padding: 14px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 16px; margin-bottom: 16px; outline: none; }
      .submit-btn { width: 100%; background: var(--primary); color: white; border: none; padding: 16px; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; }
      .close-btn { position: absolute; top: 16px; right: 16px; background: #f1f5f9; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; }
    </style>
  </head>
  <body>
    <div class="container">
      <a href="/" class="back">← Kataloqa qayıtmaq</a>
      <div class="card">
        <div class="img-wrapper">
          <img src="${product.image}" class="product-img" alt="${product.name}">
        </div>
        <h1>${product.name}</h1>

        <div class="price-row">
          <span class="price">${product.price} ₼</span>
          ${product.oldPrice ? `<span class="old-price">${product.oldPrice} ₼</span>` : ''}
        </div>

        <div class="trust-box">
          <div class="trust-item">🤝 <b>0 ₼ Önədənişsiz</b> — yalnız məhsulu yoxladıqdan sonra ödəniş</div>
          <div class="trust-item">🚚 <b>Bakı üzrə pulsuz çatdırılma</b> (45 dəqiqəyə)</div>
          <div class="trust-item">🛡️ <b>1 il rəsmi zəmanət</b> və bağlı qutu</div>
        </div>

        <p class="description">${product.description}</p>

        <button id="openModalBtn" class="btn" data-id="${product.id}" data-name="${safeName}" data-price="${product.price}">
          Sifariş et (Qapıda ödəniş)
        </button>
      </div>
    </div>

    <div id="modalOverlay" class="modal-overlay">
      <div class="modal">
        <button id="closeModalBtn" class="close-btn">&times;</button>
        <h2>Sürətli Sifariş</h2>
        <p>Əlaqə nömrənizi qeyd edin, menecer 5 dəqiqə ərzində sizinlə əlaqə saxlayacaq.</p>

        <form id="orderForm">
          <input type="tel" id="custPhone" placeholder="+994 (50) 000-00-00" required>
          <button type="submit" class="submit-btn" id="subBtn">Sifarişi təsdiqlə</button>
        </form>
      </div>
    </div>

    <script>
      const modal = document.getElementById('modalOverlay');
      const openBtn = document.getElementById('openModalBtn');
      const closeBtn = document.getElementById('closeModalBtn');
      const form = document.getElementById('orderForm');

      openBtn.addEventListener('click', () => modal.style.display = 'flex');
      closeBtn.addEventListener('click', () => modal.style.display = 'none');

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const subBtn = document.getElementById('subBtn');
        subBtn.innerText = 'Göndərilir...';
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
        }).then(() => {
          alert('Təşəkkürlər! Sifarişiniz qəbul olundu.');
          modal.style.display = 'none';
          subBtn.innerText = 'Sifarişi təsdiqlə';
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
                    `<b>Цена:</b> ${price} ₼\n\n` +
                    `<b>IP:</b> <code>${userIp}</code>`;

  sendTelegramMessage(clickText);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
