// Скрипт детальной страницы товара

let currentProduct = null;
let currentQuantity = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadProductDetails();
});

// Загрузка и рендеринг деталей товара
async function loadProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id') || params.get('name');

    if (!productId) {
        window.location.href = '/404.html';
        return;
    }

    // Включаем скелетоны/лоадеры на странице
    const mainContainer = document.querySelector('.product-details-container');
    if (mainContainer) mainContainer.classList.add('loading');

    currentProduct = await API.getProductById(productId);

    if (!currentProduct) {
        window.location.href = '/404.html';
        return;
    }

    if (mainContainer) mainContainer.classList.remove('loading');

    // Наполнение страницы деталями
    document.title = `${currentProduct.title} | PGI Technologies`;
    
    // Хлебные крошки
    const breadcrumbCategory = document.querySelector('.breadcrumb-category');
    if (breadcrumbCategory) {
        const catMap = { 'drones': 'Дроны', 'reb': 'РЭБ', 'components': 'Комплектующие', 'detectors': 'Детекторы' };
        breadcrumbCategory.textContent = catMap[currentProduct.category] || currentProduct.category;
        breadcrumbCategory.href = `/catalog.html?category=${currentProduct.category}`;
    }
    
    const breadcrumbCurrent = document.querySelector('.breadcrumb-current');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = currentProduct.title;

    // Рендер галереи изображений
    renderProductGallery();

    const titleElement = document.querySelector('.product-title-detail');
    if (titleElement) titleElement.textContent = currentProduct.title;

    const descElement = document.querySelector('.product-description-detail');
    if (descElement) descElement.textContent = currentProduct.description || 'Описание товара отсутствует.';

    const priceElement = document.querySelector('.product-price-detail');
    if (priceElement) {
        priceElement.textContent = currentProduct.price > 0 
            ? `${currentProduct.price.toLocaleString('ru-RU')} ₽` 
            : 'По запросу';
    }

    // Инициализация счетчика количества
    initQuantitySelector();

    // Инициализация лайков на детальной странице
    const likeBtn = document.querySelector('.detail-like-btn');
    if (likeBtn) {
        const isProductLiked = liked.includes(currentProduct.id);
        if (isProductLiked) likeBtn.classList.add('active');
        
        likeBtn.addEventListener('click', () => {
            const nowLiked = toggleLike(currentProduct.id);
            if (nowLiked) likeBtn.classList.add('active');
            else likeBtn.classList.remove('active');
        });
    }

    // Кнопка «Добавить в корзину»
    const addToCartBtn = document.querySelector('.add-to-cart-detail-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            addToCart(currentProduct.id, currentQuantity);
        });
    }

    // Рендеринг таблицы подробных характеристик
    renderSpecificationsTable();

    // Загрузка похожих товаров
    loadSimilarProducts();
}

// Управление счетчиком количества товара
function initQuantitySelector() {
    const minBtn = document.querySelector('.qty-btn-minus');
    const plusBtn = document.querySelector('.qty-btn-plus');
    const valInput = document.querySelector('.qty-input');

    if (!minBtn || !plusBtn || !valInput) return;

    valInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value) || 1;
        if (val < 1) val = 1;
        currentQuantity = val;
        valInput.value = val;
    });

    minBtn.addEventListener('click', () => {
        if (currentQuantity > 1) {
            currentQuantity--;
            valInput.value = currentQuantity;
        }
    });

    plusBtn.addEventListener('click', () => {
        currentQuantity++;
        valInput.value = currentQuantity;
    });
}

// Отрисовка таблицы ТТХ товара
function renderSpecificationsTable() {
    const table = document.querySelector('.specs-table');
    if (!table) return;

    const specs = currentProduct.specifications || {};
    const keys = Object.keys(specs);

    if (keys.length === 0) {
        table.innerHTML = '<p class="no-specs">Характеристики для этого товара отсутствуют.</p>';
        return;
    }

    let rowsHtml = '';
    keys.forEach(key => {
        rowsHtml += `
            <div class="specs-row">
                <span class="spec-name">${key}</span>
                <span class="spec-value">${specs[key]}</span>
            </div>
        `;
    });
    table.innerHTML = rowsHtml;
}

// Загрузка похожих товаров (той же категории)
async function loadSimilarProducts() {
    const similarContainer = document.querySelector('.similar-products-grid');
    if (!similarContainer) return;

    // Ищем товары из этой же категории, исключая текущий товар
    const similar = await API.getProducts({ category: currentProduct.category });
    const filteredSimilar = similar.filter(p => p.id !== currentProduct.id).slice(0, 3);

    if (filteredSimilar.length === 0) {
        similarContainer.closest('.similar-products-section').style.display = 'none';
        return;
    }

    let similarHtml = '';
    filteredSimilar.forEach(product => {
        const priceText = product.price > 0 
            ? `${product.price.toLocaleString('ru-RU')} ₽` 
            : 'По запросу';
        const imgUrl = product.image_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&auto=format&fit=crop&q=70';

        similarHtml += `
            <div class="product-card similar-card glassmorphic animate-fade-in" onclick="window.location.href='/product.html?id=${product.id}'">
                <div class="card-image-similar">
                    <img src="${imgUrl}" alt="${product.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=400&auto=format&fit=crop&q=70'"/>
                </div>
                <div class="card-info">
                    <h4 class="product-title">${product.title}</h4>
                    <span class="product-price">${priceText}</span>
                </div>
            </div>
        `;
    });
    similarContainer.innerHTML = similarHtml;
}

// Рендеринг галереи изображений с миниатюрами
function renderProductGallery() {
    const mainImage = document.querySelector('#main-gallery-image');
    const thumbnailsContainer = document.querySelector('.product-gallery-thumbnails');

    if (!mainImage || !thumbnailsContainer) return;

    // Получаем массив изображений из gallery_images или используем основное изображение
    let galleryImages = [];

    if (currentProduct.category === 'drones') {
        galleryImages = [
            '/drone_for_catalog.png',
            '/drone_for_catalog.png',
            '/drone_for_catalog.png',
            '/drone_for_catalog.png'
        ];
    } else {
        try {
            if (currentProduct.gallery_images) {
                galleryImages = JSON.parse(currentProduct.gallery_images);
            }
        } catch (e) {
            console.error('Ошибка парсинга gallery_images:', e);
        }

        // Если нет изображений в галерее, используем основное изображение
        if (!galleryImages || galleryImages.length === 0) {
            galleryImages = [currentProduct.image_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=700&auto=format&fit=crop&q=80'];
        }
    }

    let activeImageIndex = 0;

    // Функция обновления активного фото с красивой анимацией
    function switchGalleryImage(index) {
        if (index < 0) index = galleryImages.length - 1;
        if (index >= galleryImages.length) index = 0;
        
        activeImageIndex = index;

        // Добавляем класс анимации
        mainImage.style.opacity = '0';
        mainImage.style.transform = 'scale(0.96) translateY(4px)';

        setTimeout(() => {
            mainImage.src = galleryImages[activeImageIndex];
            
            // Убираем активный класс со всех миниатюр и добавляем на текущую
            const thumbnails = thumbnailsContainer.querySelectorAll('.gallery-thumbnail');
            thumbnails.forEach((t, i) => {
                if (i === activeImageIndex) t.classList.add('active');
                else t.classList.remove('active');
            });

            // Плавное появление обратно
            mainImage.style.opacity = '1';
            mainImage.style.transform = 'scale(1) translateY(0)';
        }, 150);
    }

    // Инициализация стилей перехода для плавности
    mainImage.style.transition = 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';

    // Устанавливаем первое изображение как основное
    mainImage.src = galleryImages[0];
    mainImage.alt = currentProduct.title;
    mainImage.onerror = () => {
        mainImage.src = '/drone_for_catalog.png';
    };

    // Если только одно изображение, скрываем стрелки и миниатюры
    const prevBtn = document.querySelector('#gallery-prev-btn');
    const nextBtn = document.querySelector('#gallery-next-btn');

    if (galleryImages.length <= 1) {
        thumbnailsContainer.style.display = 'none';
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    } else {
        thumbnailsContainer.style.display = 'grid';
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    }

    // Создаем миниатюры
    let thumbnailsHtml = '';
    galleryImages.forEach((imageUrl, index) => {
        const activeClass = index === 0 ? 'active' : '';
        thumbnailsHtml += `
            <div class="gallery-thumbnail ${activeClass}" data-index="${index}">
                <img src="${imageUrl}" alt="${currentProduct.title} - фото ${index + 1}" loading="lazy" />
            </div>
        `;
    });

    thumbnailsContainer.innerHTML = thumbnailsHtml;

    // Добавляем обработчики клика на миниатюры
    const thumbnails = thumbnailsContainer.querySelectorAll('.gallery-thumbnail');
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            switchGalleryImage(index);
        });
    });

    // Навешиваем обработчики на стрелки навигации
    if (prevBtn && !prevBtn.dataset.listener) {
        prevBtn.dataset.listener = 'true';
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            switchGalleryImage(activeImageIndex - 1);
        });
    }
    if (nextBtn && !nextBtn.dataset.listener) {
        nextBtn.dataset.listener = 'true';
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            switchGalleryImage(activeImageIndex + 1);
        });
    }
}
