-- Создание таблицы товаров
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    image_url TEXT,
    gallery_images TEXT, -- Хранит JSON массив URL изображений галереи
    specifications TEXT, -- Хранит JSON в виде строки
    is_new INTEGER DEFAULT 0,
    is_promo INTEGER DEFAULT 0,
    is_popular INTEGER DEFAULT 0
);

-- Создание таблицы заявок обратной связи
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы заказов
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    total_price INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы элементов заказа
CREATE TABLE IF NOT EXISTS order_items (
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id)
);

-- Очистка таблицы товаров перед заполнением (если необходимо)
DELETE FROM products;

-- Наполнение базы начальными товарами (седы)
INSERT INTO products (title, description, price, category, image_url, gallery_images, specifications, is_new, is_promo, is_popular) VALUES
('Kaiten 10inch 5.8G-2.5W', 'Высокоэффективный 10-дюймовый дрон-камикадзе для дальних полетов. Оснащен мощным видеопередатчиком 5.8 ГГц на 2.5 Вт.', 115000, 'drones', '/assets/products/kaiten10.jpg', '["/assets/gallery/1.png","/assets/gallery/2.png","/assets/gallery/3.png","/assets/gallery/4.png","/assets/gallery/5.png","/assets/gallery/6.png","/assets/gallery/7.png","/assets/gallery/8.png"]', '{"Размер рамы": "10 дюймов", "Частота видео": "5.8 ГГц", "Мощность передатчика": "2.5 Вт", "Грузоподъемность": "до 3.5 кг", "Время полета": "до 25 мин"}', 1, 0, 1),
('Kaiten 13inch 5.8G-2.5W', 'Профессиональный 13-дюймовый дрон с повышенной грузоподъемностью и дальностью связи. Видео 5.8 ГГц, мощность 2.5 Вт.', 145000, 'drones', '/assets/products/kaiten13.jpg', NULL, '{"Размер рамы": "13 дюймов", "Частота видео": "5.8 ГГц", "Мощность передатчика": "2.5 Вт", "Грузоподъемность": "до 5 кг", "Время полета": "до 30 мин"}', 1, 0, 0),
('Kaiten 15inch 5.8G-2.5W', 'Тяжелый 15-дюймовый дрон-носитель для выполнения сложных задач. Максимальная стабильность полета и полезная нагрузка.', 185000, 'drones', '/assets/products/kaiten15.jpg', NULL, '{"Размер рамы": "15 дюймов", "Частота видео": "5.8 ГГц", "Мощность передатчика": "2.5 Вт", "Грузоподъемность": "до 8 кг", "Время полета": "до 35 мин"}', 1, 0, 0),
('Конопелька 1', 'Специализированный дрон для выполнения разведывательных и поисковых задач с тепловизионной камерой.', 95000, 'drones', '/assets/products/konopelka1.jpg', NULL, '{"Камера": "Оптический зум 10х + Тепловизор", "Время полета": "до 40 мин", "Дальность связи": "до 10 км", "Вес": "950 г"}', 1, 0, 1),
('Конопелька 6', 'Модернизированный разведывательный дрон с увеличенным временем полета и улучшенным зумом.', 130000, 'drones', '/assets/products/konopelka6.jpg', NULL, '{"Камера": "Оптический зум 30х + Тепловизор", "Время полета": "до 50 мин", "Дальность связи": "до 15 км", "Вес": "1.2 кг"}', 1, 0, 0),
('Kaiten 7inch 5.8G-2.5W', 'Маневренный и скоростной 7-дюймовый FPV дрон для оперативного развертывания.', 85000, 'drones', '/assets/products/kaiten7.jpg', NULL, '{"Размер рамы": "7 дюймов", "Частота видео": "5.8 ГГц", "Мощность передатчика": "2.5 Вт", "Грузоподъемность": "до 1.5 кг", "Время полета": "до 15 мин"}', 1, 0, 0),
('Детектор дронов Булат v4', 'Портативный обнаружитель беспилотных летательных аппаратов (БПЛА) с круговой диаграммой направленности.', 98000, 'detectors', '/assets/products/bulat4.jpg', NULL, '{"Диапазон частот": "от 900 МГц до 6.0 ГГц", "Радиус обнаружения": "до 1.5 км", "Время работы": "до 15 часов", "Вес": "250 г"}', 0, 0, 1),
('Купол-М РЭБ', 'Комплекс подавления каналов управления и навигации БПЛА купольного типа для защиты стационарных объектов.', 280000, 'reb', '/assets/products/kupol.jpg', NULL, '{"Радиус подавления": "до 500 м", "Подавляемые частоты": "GPS, ГЛОНАСС, 2.4 ГГц, 5.8 ГГц, 900 МГц", "Питание": "220В / 24В", "Мощность": "120 Вт"}', 0, 1, 1),
('Детектор дронов aСhamelon', 'Ультрасовременный всенаправленный детектор с дисплеем спектрального анализа сигналов БПЛА.', 125000, 'detectors', '/assets/products/achameleon.jpg', NULL, '{"Экран": "IPS 2.8 дюйма", "Радиус обнаружения": "до 2.0 км", "Фильтрация ложных сигналов": "Есть", "Время работы": "до 8 часов"}', 0, 1, 0),
('Мобильный подавитель Гарпия 8 полос', 'Носимый антидроновый комплекс в форм-факторе кейса для подавления широкого спектра частот БПЛА.', 210000, 'reb', '/assets/products/garpiya.jpg', NULL, '{"Количество полос": "8 каналов", "Мощность излучения": "80 Вт", "Дальность подавления": "до 1.2 км", "Аккумулятор": "Встроенный, до 1.5 часов"}', 0, 0, 0),
('Пропеллеры Gemfan 1050', 'Высококачественные трехлопастные пропеллеры для 10-дюймовых рам. Комплект из 4 штук (2CW + 2CCW).', 1200, 'components', '/assets/products/propellers10.jpg', NULL, '{"Диаметр": "10 дюймов", "Шаг": "5.0", "Лопасти": "3 шт", "Материал": "Нейлон армированный углеволокном"}', 0, 0, 0),
('Полетный контроллер SpeedyBee F405 V3', 'Надежный полетный контроллер со встроенным Bluetooth для настройки через мобильное приложение.', 6500, 'components', '/assets/products/fc_speedybee.jpg', NULL, '{"Микропроцессор": "STM32F405", "Гироскоп": "BMI270", "Барометр": "Встроенный", "Bluetooth": "Есть, для настройки в приложении"}', 0, 0, 1);
