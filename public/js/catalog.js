// Скрипт страницы каталога

let currentFilters = {
    category: '',
    is_new: '',
    is_promo: '',
    is_popular: '',
    search: ''
};

document.addEventListener('DOMContentLoaded', () => {
    parseUrlParams();
    initFilters();
    loadCategories();
    loadProducts();
});

// Парсинг параметров URL для предустановки фильтров (например, при переходе с поиска или категорий)
function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('search')) {
        currentFilters.search = params.get('search');
        // Заполняем поле поиска в шапке
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => input.value = params.get('search'));
    }
    
    if (params.get('category')) {
        currentFilters.category = params.get('category');
    }

    if (params.get('filter')) {
        const filterVal = params.get('filter');
        if (filterVal === 'new') currentFilters.is_new = 'true';
        if (filterVal === 'promo') currentFilters.is_promo = 'true';
        if (filterVal === 'popular') currentFilters.is_popular = 'true';
        
        // Устанавливаем радио-кнопку активной
        const radio = document.getElementById(filterVal);
        if (radio) radio.checked = true;
    }
}

// Инициализация фильтров (клик по Новинки/Акции/Популярное)
function initFilters() {
    const filterRadios = document.querySelectorAll('input[name="filter"]');
    
    filterRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            // Сбрасываем фильтры статусов
            currentFilters.is_new = '';
            currentFilters.is_promo = '';
            currentFilters.is_popular = '';

            const selectedFilter = e.target.id;
            if (selectedFilter === 'new') currentFilters.is_new = 'true';
            if (selectedFilter === 'promo') currentFilters.is_promo = 'true';
            if (selectedFilter === 'popular') currentFilters.is_popular = 'true';

            loadProducts();
        });
    });

    // Обработка кнопки сброса/всех товаров
    const clearBtn = document.querySelector('.clear-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            currentFilters = {
                category: '',
                is_new: '',
                is_promo: '',
                is_popular: '',
                search: ''
            };
            
            // Сбрасываем инпуты
            const popularRadio = document.getElementById('popular');
            if (popularRadio) popularRadio.checked = true;
            currentFilters.is_popular = 'true';

            document.querySelectorAll('.search-input').forEach(input => input.value = '');
            document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
            
            loadProducts();
        });
    }
}

// Загрузка уникальных категорий и построение меню категорий
async function loadCategories() {
    const categoriesContainer = document.querySelector('.categories-list');
    if (!categoriesContainer) return;

    // Карты названий категорий для красивого вывода на русском языке
    const categoryNamesRu = {
        'drones': 'Дроны',
        'reb': 'РЭБ системы',
        'components': 'Комплектующие',
        'detectors': 'Детекторы БПЛА'
    };

    const categories = await API.getCategories();
    
    let categoriesHtml = `
        <button class="category-tab ${!currentFilters.category ? 'active' : ''}" data-category="">
            Все товары
        </button>
    `;

    categories.forEach(cat => {
        const isActive = currentFilters.category === cat;
        const displayName = categoryNamesRu[cat] || cat.toUpperCase();
        categoriesHtml += `
            <button class="category-tab ${isActive ? 'active' : ''}" data-category="${cat}">
                ${displayName}
            </button>
        `;
    });

    categoriesContainer.innerHTML = categoriesHtml;

    // Навешиваем слушатели на табы категорий
    const tabs = categoriesContainer.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            currentFilters.category = e.target.dataset.category;
            loadProducts();
        });
    });
}

// Загрузка и отрисовка товаров
async function loadProducts() {
    const productsContainer = document.querySelector('.products-grid');
    if (!productsContainer) return;

    // Показываем скелетоны при загрузке
    renderSkeletons(productsContainer);

    const products = await API.getProducts(currentFilters);

    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4vw 0; background: rgba(20, 20, 28, 0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--border-radius-md); text-align: center;">
                <p style="font-size: 24px; color: white; margin-bottom: 20px; text-transform: uppercase; font-family: var(--font-primary);">К сожалению по Вашему запросу ничего не нашлось</p>
                <button class="red-btn reset-search-btn catalog-link" style="padding: 15px 30px; border-radius: 50px; font-size: 16px;">Смотреть весь каталог</button>
            </div>
        `;
        
        const resetBtn = productsContainer.querySelector('.reset-search-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                document.querySelector('.clear-filters-btn')?.click();
                // Also redirect to catalog if we have search params
                window.location.href = '/catalog.html';
            });
        }
        return;
    }

    let productsHtml = '';
    products.forEach(product => {
        const isProductLiked = liked.includes(product.id);
        const priceText = product.price > 0 
            ? `${product.price.toLocaleString('ru-RU')} ₽` 
            : 'По запросу';
        
        // Лейблы
        let badgeHtml = '';
        if (product.is_new) badgeHtml = '<span class="badge badge-new">НОВИНКА</span>';
        else if (product.is_promo) badgeHtml = '<span class="badge badge-promo">АКЦИЯ</span>';

        // Генерируем 3 ключевые характеристики для вывода в превью карточки
        let specsHtml = '';
        if (product.specifications) {
            const specKeys = Object.keys(product.specifications).slice(0, 3);
            specKeys.forEach(key => {
                specsHtml += `<span><b>${key}:</b> ${product.specifications[key]}</span>`;
            });
        }

        // Подбираем заглушки для картинок дронов/рэб/детекторов, если картинок физически нет
        const imgUrl = product.image_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=60';

        productsHtml += `
            <div class="product-card glassmorphic animate-fade-in" data-id="${product.id}">
                <div class="card-image">
                    <img src="${imgUrl}" alt="${product.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=500&auto=format&fit=crop&q=60'"/>
                    ${badgeHtml}
                    <button class="like-btn ${isProductLiked ? 'active' : ''}" data-id="${product.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="card-info">
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-specs-preview">${specsHtml}</div>
                    <div class="card-footer">
                        <span class="product-price">${priceText}</span>
                        <div class="card-actions">
                            <a href="/product.html?id=${product.id}" class="details-btn">Подробнее</a>
                            <button class="buy-btn red-btn" data-id="${product.id}">
                                <span>Купить</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    productsContainer.innerHTML = productsHtml;

    // Навешиваем слушатели на кнопки «Купить» и «Лайк»
    productsContainer.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const id = e.currentTarget.dataset.id;
            addToCart(id, 1);
        });
    });

    productsContainer.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const id = e.currentTarget.dataset.id;
            const isLikedNow = toggleLike(id);
            if (isLikedNow) e.currentTarget.classList.add('active');
            else e.currentTarget.classList.remove('active');
        });
    });
}

// Отрисовка заполнителей (skeletons) во время загрузки AJAX данных
function renderSkeletons(container) {
    let skeletonsHtml = '';
    for (let i = 0; i < 6; i++) {
        skeletonsHtml += `
            <div class="product-card skeleton-card">
                <div class="skeleton skeleton-img"></div>
                <div class="skeleton-info">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 70%;"></div>
                    <div class="skeleton-footer">
                        <div class="skeleton skeleton-price"></div>
                        <div class="skeleton skeleton-button"></div>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = skeletonsHtml;
}
