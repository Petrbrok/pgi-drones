// Скрипт для страниц Корзины и Избранного

document.addEventListener('DOMContentLoaded', () => {
    // В зависимости от того, на какой странице находится пользователь, запускаем логику
    if (document.querySelector('.cart-page-container')) {
        renderCartPage();
        initCheckoutForm();
    }
    
    if (document.querySelector('.liked-page-container')) {
        renderLikedPage();
    }
});

// ==========================================
// 🛒 ЛОГИКА СТРАНИЦЫ КОРЗИНЫ
// ==========================================

async function renderCartPage() {
    const listContainer = document.querySelector('.cart-items-list');
    const totalAmountEl = document.querySelector('.cart-total-amount');
    const checkoutSection = document.querySelector('.cart-checkout-section');
    
    if (!listContainer) return;

    if (cart.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-cart-message glassmorphic">
                <h3>Ваша корзина пуста 🛒</h3>
                <p>Добавьте товары из нашего каталога, чтобы начать покупки.</p>
                <a href="/catalog.html" class="red-btn empty-cart-btn">Перейти в каталог</a>
            </div>
        `;
        if (totalAmountEl) totalAmountEl.textContent = '0 ₽';
        if (checkoutSection) checkoutSection.style.display = 'none';
        return;
    }

    if (checkoutSection) checkoutSection.style.display = 'block';
    listContainer.innerHTML = '<div class="skeleton-loader-cart">Загрузка элементов корзины...</div>';

    let itemsHtml = '';
    let grandTotal = 0;

    // Подгружаем детали для каждого товара в корзине
    for (const cartItem of cart) {
        const product = await API.getProductById(cartItem.id);
        
        if (!product) {
            // Если товар вдруг удален из БД, убираем из корзины
            removeFromCart(cartItem.id);
            continue;
        }

        const itemTotal = product.price * cartItem.quantity;
        grandTotal += itemTotal;

        const priceText = product.price > 0 
            ? `${product.price.toLocaleString('ru-RU')} ₽` 
            : 'По запросу';
        const totalText = product.price > 0 
            ? `${itemTotal.toLocaleString('ru-RU')} ₽` 
            : 'По запросу';
        
        const imgUrl = product.image_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=200&auto=format&fit=crop&q=70';

        itemsHtml += `
            <div class="cart-item glassmorphic animate-fade-in" data-id="${product.id}">
                <div class="cart-item-image">
                    <img src="${imgUrl}" alt="${product.title}" onerror="this.src='https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=200&auto=format&fit=crop&q=70'"/>
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title"><a href="/product.html?id=${product.id}">${product.title}</a></h4>
                    <span class="cart-item-price-each">${priceText}</span>
                </div>
                <div class="cart-item-quantity">
                    <button class="cart-qty-btn cart-qty-minus" data-id="${product.id}">-</button>
                    <span class="cart-qty-value">${cartItem.quantity}</span>
                    <button class="cart-qty-btn cart-qty-plus" data-id="${product.id}">+</button>
                </div>
                <div class="cart-item-total">
                    <span>${totalText}</span>
                </div>
                <button class="cart-item-remove" data-id="${product.id}">&times;</button>
            </div>
        `;
    }

    listContainer.innerHTML = itemsHtml;
    if (totalAmountEl) totalAmountEl.textContent = `${grandTotal.toLocaleString('ru-RU')} ₽`;

    // Навешиваем обработчики на кнопки управления количеством в корзине
    listContainer.querySelectorAll('.cart-qty-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const index = cart.findIndex(item => item.id === id);
            if (index > -1 && cart[index].quantity > 1) {
                cart[index].quantity--;
                localStorage.setItem('pgi_cart', JSON.stringify(cart));
                updateCounters();
                renderCartPage();
            }
        });
    });

    listContainer.querySelectorAll('.cart-qty-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const index = cart.findIndex(item => item.id === id);
            if (index > -1) {
                cart[index].quantity++;
                localStorage.setItem('pgi_cart', JSON.stringify(cart));
                updateCounters();
                renderCartPage();
            }
        });
    });

    // Навешиваем обработчики на кнопки удаления товара
    listContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            removeFromCart(id);
            renderCartPage();
        });
    });
}

// Оформление заказа (отправка на бэкенд и уведомление бота)
function initCheckoutForm() {
    const form = document.querySelector('.checkout-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (cart.length === 0) {
            alert('Ваша корзина пуста. Нечего оформлять!');
            return;
        }

        const name = form.querySelector('#checkout-name').value.trim();
        const phone = form.querySelector('#checkout-phone').value.trim();
        const email = form.querySelector('#checkout-email').value.trim();
        const submitBtn = form.querySelector('.checkout-submit-btn');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Оформление...';

            // Отправляем заказ на бэкенд
            const orderResult = await API.createOrder(name, phone, email, cart);

            // Очищаем корзину после успешной отправки
            cart = [];
            localStorage.setItem('pgi_cart', JSON.stringify(cart));
            updateCounters();

            // Показываем красивый поп-ап об успехе
            showSuccessModal(orderResult.orderId, orderResult.total);
            
            // Перерисовываем корзину
            renderCartPage();

        } catch (error) {
            alert('Ошибка оформления заказа: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Подтвердить заказ';
        }
    });
}

// Модальное окно успешного оформления заказа
function showSuccessModal(orderId, total) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-card glassmorphic animate-fade-in text-center" style="max-width: 500px;">
            <div class="success-icon" style="margin: 0 auto 20px;">✓</div>
            <h2>Заказ успешно оформлен! 🚀</h2>
            <p style="margin-bottom: 10px;">Заказу присвоен номер: <b>#${orderId}</b></p>
            <p style="margin-bottom: 20px;">Сумма к оплате: <b>${total.toLocaleString('ru-RU')} ₽</b></p>
            <p>Ваша заявка успешно отправлена. Наш менеджер скоро свяжется с вами для подтверждения деталей.</p>
            <button class="red-btn close-order-modal-btn" style="margin-top: 25px; width: 100%;">Вернуться на главную</button>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const closeBtn = modal.querySelector('.close-order-modal-btn');
    closeBtn.addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = '';
        window.location.href = '/';
    });
}


// ==========================================
// ❤️ ЛОГИКА СТРАНИЦЫ ИЗБРАННОГО
// ==========================================

async function renderLikedPage() {
    const listContainer = document.querySelector('.liked-products-grid');
    if (!listContainer) return;

    if (liked.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-cart-message glassmorphic" style="grid-column: 1 / -1; width: 100%;">
                <h3>В избранном пока пусто ❤️</h3>
                <p>Добавляйте понравившиеся товары из каталога, чтобы сохранить их здесь.</p>
                <a href="/catalog.html" class="red-btn empty-cart-btn">Перейти в каталог</a>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = '<div class="skeleton-loader-cart" style="grid-column: 1/-1;">Загрузка избранных товаров...</div>';

    let itemsHtml = '';
    
    // Подгружаем детали для каждого понравившегося товара
    for (const productId of liked) {
        const product = await API.getProductById(productId);
        if (!product) continue;

        const priceText = product.price > 0 
            ? `${product.price.toLocaleString('ru-RU')} ₽` 
            : 'По запросу';
        
        let badgeHtml = '';
        if (product.is_new) badgeHtml = '<span class="badge badge-new">НОВИНКА</span>';
        else if (product.is_promo) badgeHtml = '<span class="badge badge-promo">АКЦИЯ</span>';

        let specsHtml = '';
        if (product.specifications) {
            const specKeys = Object.keys(product.specifications).slice(0, 3);
            specKeys.forEach(key => {
                specsHtml += `<span><b>${key}:</b> ${product.specifications[key]}</span>`;
            });
        }

        const imgUrl = product.image_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=70';

        itemsHtml += `
            <div class="product-card glassmorphic animate-fade-in" data-id="${product.id}">
                <div class="card-image">
                    <img src="${imgUrl}" alt="${product.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=500&auto=format&fit=crop&q=70'"/>
                    ${badgeHtml}
                    <button class="like-btn active" data-id="${product.id}">
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
    }

    listContainer.innerHTML = itemsHtml;

    // Навешиваем слушатели на кнопки «Купить» и «Лайк» (удаление из избранного)
    listContainer.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            addToCart(id, 1);
        });
    });

    listContainer.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            toggleLike(id);
            renderLikedPage(); // Перерисовываем
        });
    });
}
