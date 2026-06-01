const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../db/database.sqlite');
const dbDir = path.dirname(dbPath);

// Создаем папку для базы данных, если она отсутствует
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Подключаемся к базе данных
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных SQLite:', err.message);
    } else {
        console.log('Успешное подключение к базе данных SQLite по пути:', dbPath);
        initializeDatabase();
    }
});

// Инициализируем схему базы данных, если таблицы еще не созданы
function initializeDatabase() {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='products'", (err, row) => {
        if (err) {
            console.error('Ошибка проверки существования таблиц:', err.message);
            return;
        }

        if (!row) {
            console.log('Таблицы не найдены. Выполняется инициализация схемы из schema.sql...');
            const schemaPath = path.join(__dirname, '../db/schema.sql');
            
            if (fs.existsSync(schemaPath)) {
                const schemaSql = fs.readFileSync(schemaPath, 'utf8');
                
                // Выполняем файл схемы БД
                db.exec(schemaSql, (err) => {
                    if (err) {
                        console.error('Ошибка выполнения схемы БД schema.sql:', err.message);
                    } else {
                        console.log('База данных успешно инициализирована начальными товарами.');
                    }
                });
            } else {
                console.error('Критическая ошибка: файл schema.sql не найден по пути:', schemaPath);
            }
        } else {
            console.log('Таблицы в базе данных уже существуют. Инициализация пропущена.');
        }
    });
}

// Экспортируем методы, обернутые в Промисы для удобного использования async/await
module.exports = {
    db,
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }
};
