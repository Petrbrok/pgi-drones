// API Клиент для взаимодействия с бэкендом
const API = {
    // Получение списка товаров с фильтрами
    async getProducts(filters = {}) {
        const queryParams = new URLSearchParams();
        
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.is_new) queryParams.append('is_new', filters.is_new);
        if (filters.is_promo) queryParams.append('is_promo', filters.is_promo);
        if (filters.is_popular) queryParams.append('is_popular', filters.is_popular);
        if (filters.search) queryParams.append('search', filters.search);

        try {
            const response = await fetch(`/api/products?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Ошибка сети при получении товаров');
            return await response.json();
        } catch (error) {
            console.error('API Error (getProducts):', error);
            return [];
        }
    },

    // Получение одного товара по ID
    async getProductById(id) {
        try {
            const response = await fetch(`/api/products/${id}`);
            if (!response.ok) throw new Error(`Товар с ID ${id} не найден`);
            return await response.json();
        } catch (error) {
            console.error(`API Error (getProductById: ${id}):`, error);
            return null;
        }
    },

    // Получение списка категорий
    async getCategories() {
        try {
            const response = await fetch('/api/products/categories');
            if (!response.ok) throw new Error('Ошибка сети при получении категорий');
            return await response.json();
        } catch (error) {
            console.error('API Error (getCategories):', error);
            return [];
        }
    },

    // Отправка заявки на обратный звонок (из футера)
    async sendLead(name, phone, email = '') {
        try {
            const response = await fetch('/api/orders/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Ошибка при отправке заявки');
            return data;
        } catch (error) {
            console.error('API Error (sendLead):', error);
            throw error;
        }
    },

    // Оформление заказа из корзины
    async createOrder(name, phone, email = '', items = []) {
        try {
            const response = await fetch('/api/orders/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email, items })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Ошибка при оформлении заказа');
            return data;
        } catch (error) {
            console.error('API Error (createOrder):', error);
            throw error;
        }
    }
};
