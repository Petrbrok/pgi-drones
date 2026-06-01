require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// Импортируем роуты
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Отдача статических файлов фронтенда из папки public
app.use(express.static(path.join(__dirname, '../public')));

// Монтируем API маршруты
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// Для SPA или многостраничной маршрутизации:
// Если запрашивается страница без расширения, отдаем соответствующий HTML файл из public
app.get('/:page', (req, res, next) => {
    const pageName = req.params.page;
    // Исключаем системные файлы и запросы
    if (pageName.includes('.') || pageName.startsWith('api')) {
        return next();
    }
    const filePath = path.join(__dirname, '../public', `${pageName}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).sendFile(path.join(__dirname, '../public/404.html'), (fallbackErr) => {
                if (fallbackErr) {
                    res.status(404).send('Страница не найдена (404)');
                }
            });
        }
    });
});

// Обработка 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public/404.html'), (err) => {
        if (err) {
            res.status(404).json({ error: 'Ресурс не найден' });
        }
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('\n==================================================');
    console.log(`🚀 СЕРВЕР ЗАПУЩЕН!`);
    console.log(`🌐 Локальный адрес: http://localhost:${PORT}`);
    console.log('==================================================\n');
});
