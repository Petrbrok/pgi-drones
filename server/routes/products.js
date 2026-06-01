const express = require('express');
const router = express.Router();
const dbService = require('../services/db');

/**
 * GET /api/products
 * Возвращает список товаров. Поддерживает фильтрацию по query-параметрам:
 * - category (string) - фильтр по категории
 * - is_new (1/true) - только новинки
 * - is_promo (1/true) - только товары по акции
 * - is_popular (1/true) - только популярные товары
 * - search (string) - поиск по названию и описанию
 */
router.get('/', async (req, res) => {
    try {
        const { category, is_new, is_promo, is_popular, search } = req.query;
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }
        if (is_new === '1' || is_new === 'true') {
            sql += ' AND is_new = 1';
        }
        if (is_promo === '1' || is_promo === 'true') {
            sql += ' AND is_promo = 1';
        }
        if (is_popular === '1' || is_popular === 'true') {
            sql += ' AND is_popular = 1';
        }
        if (search) {
            sql += ' AND (title LIKE ? OR description LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
        }

        const products = await dbService.all(sql, params);

        // Парсим JSON строку характеристик обратно в объект для каждого товара
        const parsedProducts = products.map(p => {
            try {
                p.specifications = p.specifications ? JSON.parse(p.specifications) : {};
            } catch (e) {
                p.specifications = {};
            }
            return p;
        });

        res.json(parsedProducts);
    } catch (err) {
        console.error('Ошибка бэкенда при получении товаров:', err.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера при получении товаров' });
    }
});

/**
 * GET /api/products/categories
 * Возвращает список всех уникальных категорий, представленных в базе данных.
 */
router.get('/categories', async (req, res) => {
    try {
        const sql = 'SELECT DISTINCT category FROM products';
        const rows = await dbService.all(sql);
        const categories = rows.map(r => r.category);
        res.json(categories);
    } catch (err) {
        console.error('Ошибка бэкенда при получении категорий:', err.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера при получении категорий' });
    }
});

/**
 * GET /api/products/:idOrName
 * Возвращает детальную информацию о конкретном товаре по ID или Названию.
 */
router.get('/:idOrName', async (req, res) => {
    try {
        const param = req.params.idOrName;
        let sql, queryParams;
        if (!isNaN(param)) {
            sql = 'SELECT * FROM products WHERE id = ?';
            queryParams = [param];
        } else {
            sql = 'SELECT * FROM products WHERE title = ?';
            queryParams = [param];
        }
        const product = await dbService.get(sql, queryParams);

        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        // Парсим характеристики товара
        try {
            product.specifications = product.specifications ? JSON.parse(product.specifications) : {};
        } catch (e) {
            product.specifications = {};
        }

        res.json(product);
    } catch (err) {
        console.error('Ошибка бэкенда при получении товара по ID:', err.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера при получении товара' });
    }
});

module.exports = router;
