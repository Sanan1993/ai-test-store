const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Твои настройки Telegram из переменной окружения или напрямую
const BOT_TOKEN = '8805285337:AAFekM5hRqF555E3DGhLmgMhRqAiB5-goT8';
const CHAT_ID = '596455016';

const AI_BOTS = [
    'GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 
    'Google-Extended', 'Bytespider', 'CCBot', 'FacebookBot', 'Diffbot'
];

app.get('*', async (req, res) => {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const isAi = AI_BOTS.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
    
    // Формируем красивый лог
    const tag = isAi ? '🚨 <b>ИИ-БОТ ОБНАРУЖЕН!</b>' : '👤 Визит на сервер';
    const message = `${tag}\n\n` +
        `<b>IP:</b> <code>${req.headers['x-forwarded-for'] || req.socket.remoteAddress}</code>\n` +
        `<b>User-Agent:</b> <code>${userAgent}</code>\n` +
        `<b>URL:</b> <code>${req.url}</code>`;

    // Отправка в Telegram прямо с сервера (без CORS и ограничений браузера)
    if (BOT_TOKEN !== '8805285337:AAFekM5hRqF555E3DGhLmgMhKpAiB5-goT8') {
        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
        } catch (e) {
            console.error('Ошибка Telegram:', e);
        }
    }

    // Отдаем чистую HTML-страницу с наживкой
    res.send(`
<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>iPhone 16 Pro 128GB Natural Titanium — Special Offer Baku</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "iPhone 16 Pro 128GB Natural Titanium",
      "description": "Apple iPhone 16 Pro 128GB Natural Titanium rəsmi zəmanətli smartfon Bakıda ən sərfəli qiymətə",
      "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg",
      "sku": "iphone-16-pro-128-nat",
      "brand": { "@type": "Brand", "name": "Apple" },
      "offers": {
        "@type": "Offer",
        "price": "1990.00",
        "priceCurrency": "AZN",
        "priceValidUntil": "2027-12-31",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    }
    </script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f7; color: #1d1d1f; margin: 0; padding: 40px 20px; }
        .card { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 18px; padding: 30px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); display: flex; gap: 30px; align-items: center; }
        .img { width: 220px; height: auto; border-radius: 12px; }
        .info { flex: 1; }
        h1 { font-size: 22px; margin: 0 0 10px; }
        .price { font-size: 28px; font-weight: 700; color: #0071e3; margin-bottom: 12px; }
        .badge { background: #e8f2ff; color: #0071e3; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .stock { color: #34c759; font-weight: 600; font-size: 14px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="card">
        <img src="https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg" class="img" alt="iPhone 16 Pro">
        <div class="info">
            <span class="badge">Xüsusi Təklif</span>
            <h1>iPhone 16 Pro 128GB Natural Titanium</h1>
            <div class="price">1990.00 ₼ <span style="font-size:14px; color:#86868b; text-decoration:line-through;">2450.00 ₼</span></div>
            <div class="stock">✔ Stokda var (Məhdud sayda)</div>
        </div>
    </div>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
