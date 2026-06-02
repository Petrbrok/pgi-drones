// Main script for PGI Drones website

// Cart and Liked from LocalStorage
let cart = JSON.parse(localStorage.getItem('pgi_cart')) || [];
let liked = JSON.parse(localStorage.getItem('pgi_liked')) || [];

document.addEventListener('DOMContentLoaded', () => {
    injectContactModal();
    initHeader();
    initBurgerMenu();
    initFooterForm();
    updateCounters();
});

// Inject contact modal dynamically to ensure it is present and unified on all pages
function injectContactModal() {
    if (document.getElementById('contact-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'header-form-modal';
    modal.id = 'contact-modal';
    modal.innerHTML = `
        <div>
            <div onclick="hideContactModal()"></div>
            <div class="header-form-ui">
                <button class="header-form-cross" onclick="hideContactModal()">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#2f2f2f" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
                <div class="header-form-title">Оставьте свои контактные данные, и мы свяжемся с Вами в рабочее время</div>
                <form class="header-form-inputs" id="header-lead-form">
                    <label>
                        <p>Ваше имя</p>
                        <input type="text" name="name" required placeholder="Сергей Сергеевич">
                    </label>
                    <label>
                        <p>Номер телефона</p>
                        <input type="tel" name="phone" required placeholder="+7 (999) 999-99-99">
                    </label>
                    <label>
                        <p>Ваша почта</p>
                        <input type="email" name="email" placeholder="example@mail.ru">
                    </label>
                    <div class="header-form-confirm">Нажимая отправить, Вы соглашаетесь на обработку персональных данных, и соглашаетесь с офертой</div>
                    <button type="submit" class="header-form-submit">Отправить</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Initialize form submission
    initHeaderForm();
}

// Update badge counters
function updateCounters() {
    // Cart and liked badges are inside cart-liked div
    const cartLinks = document.querySelectorAll('.cart-liked a');
    const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalLikedItems = liked.length;

    if (cartLinks[0]) {
        let badge = cartLinks[0].querySelector('.counter-badge');
        if (!badge && totalCartItems > 0) {
            badge = document.createElement('div');
            badge.className = 'counter-badge';
            cartLinks[0].appendChild(badge);
        }
        if (badge) {
            badge.textContent = totalCartItems;
            badge.style.display = totalCartItems > 0 ? 'flex' : 'none';
        }
    }

    if (cartLinks[1]) {
        let badge = cartLinks[1].querySelector('.counter-badge');
        if (!badge && totalLikedItems > 0) {
            badge = document.createElement('div');
            badge.className = 'counter-badge';
            cartLinks[1].appendChild(badge);
        }
        if (badge) {
            badge.textContent = totalLikedItems;
            badge.style.display = totalLikedItems > 0 ? 'flex' : 'none';
        }
    }
}

// Add to cart
function addToCart(productId, quantity = 1) {
    productId = parseInt(productId);
    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ id: productId, quantity: quantity });
    }

    localStorage.setItem('pgi_cart', JSON.stringify(cart));
    updateCounters();
    showToast('Товар добавлен в корзину! 🛒');
}

// Remove from cart
function removeFromCart(productId) {
    productId = parseInt(productId);
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('pgi_cart', JSON.stringify(cart));
    updateCounters();
}

// Toggle liked
function toggleLike(productId) {
    productId = parseInt(productId);
    const index = liked.indexOf(productId);
    let isLiked = false;

    if (index > -1) {
        liked.splice(index, 1);
    } else {
        liked.push(productId);
        isLiked = true;
    }

    localStorage.setItem('pgi_liked', JSON.stringify(liked));
    updateCounters();

    if (isLiked) {
        showToast('Добавлено в избранное! ❤️');
    } else {
        showToast('Удалено из избранного.');
    }

    return isLiked;
}

// Header search init
function initHeader() {
    const searchInputs = document.querySelectorAll('.search-main input');
    
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    window.location.href = `/catalog.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    });

    // Mobile search button handler
    const searchMobileBtn = document.querySelector('.search-mobile button');
    if (searchMobileBtn) {
        searchMobileBtn.addEventListener('click', () => {
            const query = prompt('Введите поисковый запрос для поиска по каталогу:');
            if (query && query.trim()) {
                window.location.href = `/catalog.html?search=${encodeURIComponent(query.trim())}`;
            }
        });
    }

    // Catalog link handling: smooth scroll on homepage, redirect on other pages
    const catalogLinks = document.querySelectorAll('.header-links a[href="/catalog.html"], .burger-links a[href="/catalog.html"], .burger-links button.burger-link, .hero-section .btn-primary');
    catalogLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '';
            if (isHomepage) {
                const target = document.querySelector('.catalog-section');
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                    // If in burger menu, close it
                    const burgerMenu = document.getElementById('burger-menu');
                    if (burgerMenu && burgerMenu.classList.contains('burger-menu')) {
                        document.getElementById('burger-btn')?.click();
                    }
                }
            } else if (link.tagName !== 'BUTTON' && !link.classList.contains('btn-primary')) {
                window.location.href = '/catalog.html';
            }
        });
    });
}

// Burger menu
function initBurgerMenu() {
    const burgerBtn = document.getElementById('burger-btn');
    const burgerMenu = document.getElementById('burger-menu');

    const closeMenu = () => {
        if (burgerMenu && burgerMenu.classList.contains('burger-menu')) {
            burgerMenu.classList.remove('burger-menu');
            burgerMenu.classList.add('burger-closed');
            burgerBtn.classList.remove('burger-close-btn');
            burgerBtn.classList.add('burger');
            document.body.style.overflow = '';
        }
    };

    if (burgerBtn && burgerMenu) {
        burgerBtn.addEventListener('click', () => {
            const isOpen = burgerMenu.classList.contains('burger-menu');
            
            if (isOpen) {
                closeMenu();
            } else {
                burgerMenu.classList.remove('burger-closed');
                burgerMenu.classList.add('burger-menu');
                burgerBtn.classList.remove('burger');
                burgerBtn.classList.add('burger-close-btn');
                document.body.style.overflow = 'hidden';
            }
        });

        // Close menu when clicking on any link inside the burger menu
        burgerMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });
    }

    // Handle "Каталог" expand/collapse or redirect inside mobile burger menu
    const burgerLinks = document.querySelector('.burger-links');
    if (burgerLinks) {
        const catalogBtn = burgerLinks.querySelector('button.burger-link');
        const catDropdown = burgerLinks.querySelector('.burger-cat-closed') || burgerLinks.querySelector('.burger-cat-open');
        
        if (catalogBtn && catDropdown) {
            catalogBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Toggle sub-links visibility
                if (catDropdown.classList.contains('burger-cat-closed')) {
                    catDropdown.classList.remove('burger-cat-closed');
                    catDropdown.classList.add('burger-cat-open');
                } else {
                    catDropdown.classList.remove('burger-cat-open');
                    catDropdown.classList.add('burger-cat-closed');
                }
            });
        }
    }

    // Добавляем автоматическое закрытие бургер-меню при клике по кнопке "Связаться" в меню
    const burgerContactBtn = document.querySelector('.burger-contact');
    if (burgerContactBtn) {
        burgerContactBtn.addEventListener('click', () => {
            closeMenu();
        });
    }
}

// Contact Modal
function showContactModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Hide Contact Modal
function hideContactModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Header form (modal form)
function initHeaderForm() {
    const form = document.getElementById('header-lead-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = form.querySelector('input[name="name"]').value.trim();
        const phone = form.querySelector('input[name="phone"]').value.trim();
        const email = form.querySelector('input[name="email"]') ? form.querySelector('input[name="email"]').value.trim() : '';
        const submitBtn = form.querySelector('.header-form-submit');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';

            await API.sendLead(name, phone, email);
            
            form.reset();
            showToast('Заявка отправлена! 🚀');
            hideContactModal();
        } catch (error) {
            alert('Ошибка: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить';
        }
    });
}



// Footer form
function initFooterForm() {
    const form = document.getElementById('footer-lead-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = form.querySelector('#footer-name').value.trim();
        const phone = form.querySelector('#footer-tel').value.trim();
        const email = form.querySelector('#footer-email') ? form.querySelector('#footer-email').value.trim() : '';
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';

            await API.sendLead(name, phone, email);

            form.reset();
            showToast('Заявка отправлена! 🚀 Мы свяжемся с вами.');
        } catch (error) {
            alert('Ошибка: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить';
        }
    });
}

// Toast notification
function showToast(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2vw;
        left: 50%;
        transform: translateX(-50%);
        background-color: #2f2f2f;
        color: #fff;
        padding: 1vw 2vw;
        border-radius: 200px;
        font-size: 1vw;
        z-index: 100;
        animation: toastIn 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add toast animation
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    .counter-badge {
        position: absolute;
        text-align: center;
        background-color: red;
        color: #fff;
        top: .36vw;
        right: .88vw;
        width: 1.04vw;
        height: 1.04vw;
        border-radius: 50%;
        font-size: .78125vw;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    @media (max-width: 768px) {
        .toast-notification {
            font-size: 3vw !important;
            padding: 2.67vw 5.33vw !important;
            bottom: 5vw !important;
        }
        .counter-badge {
            top: 1.87vw;
            right: 0;
            width: 2.67vw;
            height: 2.67vw;
            font-size: 1.6vw;
        }
    }
`;
document.head.appendChild(toastStyle);
