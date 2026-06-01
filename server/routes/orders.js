const express = require('express');
const router = express.Router();
const dbService = require('../services/db');
const { sendTelegramMessage } = require('../services/telegram');

/**
 * POST /api/leads
 * Создает заявку на обратный звонок (из футера).
 * Сохраняет данные в SQLite и дублирует в Telegram-бота.
 */
router.post('/leads', async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ error: 'Поля Имя и Телефон обязательны для заполнения.' });
        }

        // Сохраняем в базу данных SQLite
        const sql = 'INSERT INTO leads (name, phone, email) VALUES (?, ?, ?)';
        const result = await dbService.run(sql, [name, phone, email || null]);

        // Формируем красивое сообщение для Telegram
        const telegramMessage = `
🔔 <b>НОВАЯ ЗАЯВКА НА ОБРАТНУЮ СВЯЗЬ!</b>
--------------------------------------------
👤 <b>Имя:</b> ${name}
📞 <b>Телефон:</b> <code>${phone}</code>
📧 <b>Email:</b> ${email || 'не указан'}
📅 <b>Дата:</b> ${new Date().toLocaleString('ru-RU')}
--------------------------------------------
<i>Заявка успешно сохранена в базу данных (ID: ${result.id}).</i>
`;

        // Отправляем в Telegram
        await sendTelegramMessage(telegramMessage);

        res.status(201).json({ success: true, leadId: result.id });
    } catch (err) {
        console.error('Ошибка при создании заявки:', err.message);
        res.status(500).json({ error: 'Ошибка сервера при сохранении заявки' });
    }
});

/**
 * POST /api/orders
 * Оформляет заказ из корзины.
 * Рассчитывает стоимость товаров на сервере (защита от накрутки цен),
 * записывает в таблицы orders и order_items, после чего шлет отчет в Telegram.
 */
router.post('/orders', async (req, res) => {
    try {
        const { name, phone, email, items } = req.body;

        if (!name || !phone || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Пожалуйста, заполните Имя, Телефон и добавьте товары в корзину.' });
        }

        let totalOrderPrice = 0;
        const verifiedItems = [];

        // Проверяем товары и рассчитываем стоимость на стороне сервера
        for (const item of items) {
            const product = await dbService.get('SELECT * FROM products WHERE id = ?', [item.id]);
            if (!product) {
                return res.status(400).json({ error: `Товар с ID ${item.id} не найден в базе данных.` });
            }
            
            const quantity = parseInt(item.quantity) || 1;
            const itemTotal = product.price * quantity;
            totalOrderPrice += itemTotal;

            verifiedItems.push({
                product_id: product.id,
                title: product.title,
                quantity: quantity,
                price: product.price,
                total: itemTotal
            });
        }

        // 1. Создаем запись заказа в таблице orders
        const insertOrderSql = 'INSERT INTO orders (client_name, client_phone, client_email, total_price) VALUES (?, ?, ?, ?)';
        const orderResult = await dbService.run(insertOrderSql, [name, phone, email || null, totalOrderPrice]);
        const orderId = orderResult.id;

        // 2. Создаем записи элементов заказа в order_items
        const insertItemSql = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
        for (const item of verifiedItems) {
            await dbService.run(insertItemSql, [orderId, item.product_id, item.quantity, item.price]);
        }

        // 3. Формируем красивый отчет о заказе для Telegram
        let itemsListText = '';
        verifiedItems.forEach((item, index) => {
            itemsListText += `${index + 1}. <b>${item.title}</b> — ${item.quantity} шт. х ${item.price.toLocaleString('ru-RU')} руб. (Итого: ${item.total.toLocaleString('ru-RU')} руб.)\n`;
        });

        const telegramMessage = `
🛒 <b>НОВЫЙ ЗАКАЗ # ${orderId} НА САЙТЕ!</b>
--------------------------------------------
👤 <b>Покупатель:</b> ${name}
📞 <b>Телефон:</b> <code>${phone}</code>
📧 <b>Email:</b> ${email || 'не указан'}

📦 <b>Товары в заказе:</b>
${itemsListText}
💰 <b>ИТОГО К ОПЛАТЕ:</b> <u>${totalOrderPrice.toLocaleString('ru-RU')} руб.</u>
--------------------------------------------
📅 <b>Дата:</b> ${new Date().toLocaleString('ru-RU')}
`;

        // Отправляем в Telegram
        await sendTelegramMessage(telegramMessage);

        res.status(201).json({ success: true, orderId: orderId, total: totalOrderPrice });
    } catch (err) {
        console.error('Ошибка при оформлении заказа:', err.message);
        res.status(500).json({ error: 'Ошибка сервера при оформлении заказа' });
    }
});

module.exports = router;
