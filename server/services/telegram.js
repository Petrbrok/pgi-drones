const https = require('https');

/**
 * Отправляет форматированное сообщение в Telegram-канал или чат через Bot API.
 * Использует нативный модуль 'https' для совместимости со всеми версиями Node.js.
 * 
 * @param {string} message - Текст сообщения (поддерживает базовые теги HTML)
 * @returns {Promise<boolean>} - Успешность отправки
 */
function sendTelegramMessage(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Если токен или ID чата не настроены, просто логируем сообщение локально
    if (!token || !chatId || token === 'YOUR_BOT_TOKEN_HERE' || chatId === 'YOUR_CHAT_ID_HERE') {
        console.log('\n[Telegram Bot] ⚠️ Бот не настроен (.env). Уведомление напечатано ниже:');
        console.log('----------------------------------------------------');
        console.log(message.replace(/<[^>]*>/g, '')); // Очищаем от HTML-тегов для консоли
        console.log('----------------------------------------------------\n');
        return Promise.resolve(false);
    }

    const payload = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (parsed.ok) {
                        console.log('[Telegram Bot] ✅ Уведомление успешно отправлено в Telegram!');
                        resolve(true);
                    } else {
                        console.error('[Telegram Bot] ❌ Ошибка API Telegram:', parsed.description);
                        resolve(false);
                    }
                } catch (e) {
                    console.error('[Telegram Bot] ❌ Ошибка парсинга ответа от Telegram:', e.message);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.error('[Telegram Bot] ❌ Ошибка HTTPS-запроса к Telegram:', err.message);
            resolve(false);
        });

        req.write(payload);
        req.end();
    });
}

module.exports = { sendTelegramMessage };
