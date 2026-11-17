// পেজ চালু হওয়ার সাথে সাথেই প্রোডাক্ট লোড নিশ্চিত করা
document.addEventListener("DOMContentLoaded", function() {
    if (typeof products !== "undefined" && typeof renderProducts === "function") {
        renderProducts(products);
    }
});

let cart = JSON.parse(localStorage.getItem('luvella_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('luvella_wish')) || [];
let currentOrderItems = [];

// পেজ লোড হলে সবকিছু সেটআপ হবে
window.onload = function () {
    renderProducts(products);
    updateBadges();
    checkSharedProductLink();
};

// প্রোডাক্ট কার্ড তৈরি ও দেখানো (সেভ % এবং রেটিংসহ)
function renderProducts(list) {
    const grid = document.getElementById('productGrid');
    const countText = document.getElementById('productCountText');
    grid.innerHTML = '';
    countText.innerText = `${list.length}টি প্রোডাক্ট`;

    if (list.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding:20px;">কোনো প্রোডাক্ট পাওয়া যায়নি!</p>';
        return;
    }

    list.forEach(item => {
        // অটোমেটিক Save % হিসাব করা
        let discountPercent = 0;
        if (item.oldPrice && item.oldPrice > item.price) {
            discountPercent = Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100);
        }

        const isWished = wishlist.some(w => w.id === item.id) ? 'wished' : '';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${discountPercent > 0 ? `<span class="discount-badge">Save ${discountPercent}%</span>` : ''}
            
                        <div class="card-top-actions">
                <button class="card-icon-btn ${isWished}" onclick="toggleWishlist(${item.id})" title="Wishlist">
                    ${isWished ? '❤️' : '🤍'}
                </button>
                <button class="card-icon-btn" onclick="copyProductLink(${item.id})" title="লিংক কপি করুন">
                    🔗
                </button>
            </div>

            <div class="product-img-wrap" onclick="openZoom(${item.id})">
                <img src="${item.image}" alt="${item.name}">
            </div>

            <div class="product-info">
                <span class="product-cat-tag">${item.isSpecialOffer ? 'স্পেশাল অফার' : item.category}</span>
                <h3 class="product-title">${item.name}</h3>
                <div class="product-rating">★ ${item.rating}</div>
                
                <div class="price-row">
                    <span class="current-price">${item.price}৳</span>
                    ${item.oldPrice ? `<span class="old-price">${item.oldPrice}৳</span>` : ''}
                </div>

                <div class="card-buttons">
                    <button class="btn-cart" onclick="addToCart(${item.id})">Add to Cart</button>
                    <button class="btn-order" onclick="openSingleOrder(${item.id})">Order Now</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// সার্চ ফাংশন
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    );
    renderProducts(filtered);
}

// ক্যাটাগরি ফিল্টার
function filterCategory(cat, btnElement) {
    document.querySelectorAll('.cat-btn, .special-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    if (cat === 'all') {
        renderProducts(products);
    } else if (cat === 'স্পেশাল অফার') {
        renderProducts(products.filter(p => p.isSpecialOffer));
    } else {
        renderProducts(products.filter(p => p.category === cat));
    }
}

// প্রোডাক্ট ছবিতে ক্লিক করলে জুম হবে
function openZoom(id) {
    const item = products.find(p => p.id === id);
    if (!item) return;
    document.getElementById('zoomImg').src = item.image;
    document.getElementById('zoomTitle').innerText = item.name;
    document.getElementById('zoomPrice').innerText = `দাম: ${item.price}৳`;
    openModal('zoomModal');
}

// প্রোডাক্টের ডিরেক্ট লিংক কপি ও শেয়ার করার সুবিধা
function copyProductLink(id) {
    const url = `${window.location.origin}${window.location.pathname}?product=${id}`;
    navigator.clipboard.writeText(url).then(() => {
        alert('প্রোডাক্টের লিংক কপি হয়েছে! এখন যে কাউকে শেয়ার করতে পারবেন।');
    });
}

// কেউ শেয়ার করা লিংকে ক্লিক করলে সরাসরি ওই প্রোডাক্টটি জুম হয়ে খুলবে
function checkSharedProductLink() {
    const params = new URLSearchParams(window.location.search);
    const prodId = parseInt(params.get('product'));
    if (prodId) {
        openZoom(prodId);
    }
}
// উইশলিস্ট (Wishlist) যোগ ও রিমুভ
function toggleWishlist(id) {
    const item = products.find(p => p.id === id);
    const index = wishlist.findIndex(w => w.id === id);

    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(item);
    }

    localStorage.setItem('luvella_wish', JSON.stringify(wishlist));
    updateBadges();
    renderProducts(products);
    renderWishlistModal();
}

function renderWishlistModal() {
    const container = document.getElementById('wishlistItemsList');
    if (wishlist.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:15px;">উইশলিস্টে কোনো প্রোডাক্ট নেই।</p>';
        return;
    }
    container.innerHTML = wishlist.map(item => `
        <div class="list-item">
            <div>
                <strong>${item.name}</strong><br>
                <small style="color:#8B1E41;">${item.price}৳</small>
            </div>
            <div>
                <button class="btn-order" style="padding:5px 10px; font-size:12px;" onclick="addToCart(${item.id}); closeModal('wishlistModal')">Add to Cart</button>
                <button class="remove-btn" onclick="toggleWishlist(${item.id})">বাদ দিন</button>
            </div>
        </div>
    `).join('');
}

// কার্ট (Add to Cart) ফাংশন
function addToCart(id) {
    const item = products.find(p => p.id === id);
    const existing = cart.find(c => c.id === id);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }

    localStorage.setItem('luvella_cart', JSON.stringify(cart));
    updateBadges();
    alert(`"${item.name}" আপনার ব্যাগে যোগ হয়েছে!`);
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    localStorage.setItem('luvella_cart', JSON.stringify(cart));
    updateBadges();
    renderCartModal();
}

function renderCartModal() {
    const container = document.getElementById('cartItemsList');
    const totalBox = document.getElementById('cartTotalBox');

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:15px;">আপনার শপিং ব্যাগ খালি।</p>';
        if (totalBox) totalBox.innerHTML = '';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        return `
            <div class="list-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>${item.price}৳ × ${item.qty} = ${item.price * item.qty}৳</small>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">মুছুন</button>
            </div>
        `;
    }).join('');

    if (totalBox) {
        totalBox.innerHTML = `<p style="text-align:right; font-weight:bold; margin:10px 0; color:#8B1E41;">মোট বিল: ${total}৳</p>`;
    }
}

function updateBadges() {
    document.getElementById('wishCount').innerText = wishlist.length;
    const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').innerText = totalCartQty;
}

// সিঙ্গেল প্রোডাক্ট অর্ডার বা কার্ট থেকে অর্ডার শুরু করা
function openSingleOrder(id) {
    const item = products.find(p => p.id === id);
    currentOrderItems = [{ ...item, qty: 1 }];
    showOrderSummary();
    openModal('orderModal');
}

function checkoutFromCart() {
    if (cart.length === 0) {
        alert('আপনার ব্যাগে কোনো প্রোডাক্ট নেই!');
        return;
    }
    currentOrderItems = [...cart];
    closeModal('cartModal');
    showOrderSummary();
    openModal('orderModal');
}

function showOrderSummary() {
    const summaryBox = document.getElementById('orderProductSummary');
    let total = 0;
    let html = currentOrderItems.map(i => {
        total += i.price * i.qty;
        return `<div>• ${i.name} (${i.qty}টি) - <strong>${i.price * i.qty}৳</strong></div>`;
    }).join('');
    html += `<hr style="margin:6px 0; border-color:#F3D1DC;"><div>সর্বমোট বিল: <strong style="color:#8B1E41;">${total}৳</strong></div>`;
    summaryBox.innerHTML = html;
}

// পেমেন্ট মেথড (bKash / Nagad নম্বর দেখানো)
function togglePaymentInfo() {
    const method = document.getElementById('paymentMethod').value;
    const infoBox = document.getElementById('mobileBankingInfo');
    infoBox.style.display = (method === 'bKash' || method === 'Nagad') ? 'block' : 'none';
}

// অর্ডার কনফার্ম ও প্রিন্ট রিসিট তৈরি
function confirmOrder() {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const payment = document.getElementById('paymentMethod').value;
    const trxId = document.getElementById('trxId').value.trim();

    if (!name || !phone || !address) {
        alert('দয়া করে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা সঠিকভাবে লিখুন।');
        return;
    }

    if ((payment === 'bKash' || payment === 'Nagad') && !trxId) {
        alert('বিকাশ বা নগদ পেমেন্টের Transaction ID (TrxID) দিন।');
        return;
    }

    const orderId = 'LUV-' + Math.floor(1000 + Math.random() * 9000);
    const totalAmount = currentOrderItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const orderDate = new Date().toLocaleDateString('bn-BD');

    const orderData = {
        orderId,
        name,
        phone,
        address,
        payment,
        trxId: trxId || 'N/A',
        items: currentOrderItems,
        totalAmount,
        date: orderDate,
        status: 'অর্ডার কনফার্ম হয়েছে (প্যাকেজিং চলছে)'
    };

    // অর্ডার ট্র্যাকিংয়ের জন্য সেভ রাখা
    let savedOrders = JSON.parse(localStorage.getItem('luvella_orders')) || [];
    savedOrders.push(orderData);
    localStorage.setItem('luvella_orders', JSON.stringify(savedOrders));

    // রিসিট দেখানো
    document.getElementById('receiptDetails').innerHTML = `
        <p><strong>অর্ডার আইডি:</strong> ${orderId}</p>
        <p><strong>তারিখ:</strong> ${orderDate}</p>
        <p><strong>ক্রেতার নাম:</strong> ${name}</p>
        <p><strong>মোবাইল:</strong> ${phone}</p>
        <p><strong>ঠিকানা:</strong> ${address}</p>
        <p><strong>পেমেন্ট:</strong> ${payment} ${trxId ? `(TrxID: ${trxId})` : ''}</p>
        <hr style="margin:8px 0;">
        ${currentOrderItems.map(i => `<p>${i.name} × ${i.qty} = ${i.price * i.qty}৳</p>`).join('')}
        <hr style="margin:8px 0;">
        <p style="font-size:16px; color:#8B1E41;"><strong>সর্বমোট বিল: ${totalAmount}৳</strong></p>
        <p style="font-size:12px; color:#666; margin-top:6px;">* অর্ডার ট্র্যাক করতে আপনার অর্ডার আইডি (${orderId}) সংরক্ষণ করুন।</p>
    `;

    closeModal('orderModal');
    openModal('receiptModal');
}

function orderViaWhatsApp(waNumber) {
    const name = document.getElementById('custName').value.trim() || 'Customer';
    const phone = document.getElementById('custPhone').value.trim() || 'N/A';
    const address = document.getElementById('custAddress').value.trim() || 'N/A';
    const payment = document.getElementById('paymentMethod').value;

    let itemText = currentOrderItems.map(i => `${i.name} (${i.qty} pcs - ${i.price * i.qty} TK)`).join(', ');
    let total = currentOrderItems.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const message = `Assalamu Alaikum Luvella Avenue,\nI want to order:\n\nProduct: ${itemText}\nTotal: ${total} TK\nPayment: ${payment}\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}`;
    
    window.open(`https://wa.me{waNumber}?text=${encodeURIComponent(message)}`, '_blank');
}



// অর্ডার ট্র্যাকিং ফাংশন
function trackOrder() {
    const inputId = document.getElementById('trackOrderId').value.trim().toUpperCase();
    const resultBox = document.getElementById('trackResult');
    let savedOrders = JSON.parse(localStorage.getItem('luvella_orders')) || [];

    const found = savedOrders.find(o => o.orderId === inputId);
    if (found) {
        resultBox.innerHTML = `
            <p style="color:#8B1E41; font-weight:bold;">অর্ডার পাওয়া গেছে! (${found.orderId})</p>
            <p><strong>ক্রেতা:</strong> ${found.name}</p>
            <p><strong>মোট বিল:</strong> ${found.totalAmount}৳ (${found.payment})</p>
            <p><strong>বর্তমান অবস্থা:</strong> <span style="color:green; font-weight:bold;">${found.status}</span></p>
        `;
    } else {
        resultBox.innerHTML = `<p style="color:#E11D48;">দুঃখিত! এই অর্ডার আইডি (${inputId}) খুঁজে পাওয়া যায়নি। সঠিক আইডি দিন।</p>`;
    }
}
// পেজ লোড হলে সেভ করা রিভিউগুলো দেখানো
let savedReviews = JSON.parse(localStorage.getItem('luvella_reviews')) || [];

function renderReviews() {
    const reviewList = document.getElementById('reviewList');
    if (!reviewList) return;

    if (savedReviews.length === 0) {
        reviewList.innerHTML = '<p style="font-size: 13px; color: #666;">এখনও কোনো রিভিউ নেই। পণ্য কেনার পর আপনার অর্ডার আইডি দিয়ে রিভিউ দিন।</p>';
        return;
    }

    reviewList.innerHTML = savedReviews.map(r => `
        <div class="review-card" style="padding: 10px;">
            <div class="stars" style="font-size: 13px;">★★★★★ (${r.rating}) <span style="color:green; font-size:11px;">✔ Verified Buyer</span></div>
            <p style="font-size: 13px; margin: 4px 0;">"${r.text}"</p>
            <h4 style="font-size: 12px;">- ${r.name}</h4>
        </div>
    `).join('');
}

// শুধুমাত্র অর্ডার করা কাস্টমাররাই রিভিউ দিতে পারবে
function addReview() {
    const orderIdInput = document.getElementById('revOrderId').value.trim().toUpperCase();
    const name = document.getElementById('revName').value.trim();
    const rating = document.getElementById('revRating').value;
    const text = document.getElementById('revText').value.trim();

    if (!orderIdInput || !name || !text) {
        alert('দয়া করে অর্ডার আইডি, আপনার নাম এবং মতামত লিখুন।');
        return;
    }

    // চেক করা হচ্ছে এই অর্ডার আইডি দিয়ে আসলেই কেনা হয়েছে কি না
    let savedOrders = JSON.parse(localStorage.getItem('luvella_orders')) || [];
    const isValidBuyer = savedOrders.some(o => o.orderId === orderIdInput);

    if (!isValidBuyer) {
        alert('দুঃখিত! শুধুমাত্র আমাদের ওয়েবসাইট থেকে অর্ডার করা ক্রেতারাই সঠিক Order ID দিয়ে রিভিউ দিতে পারবেন।');
        return;
    }

    savedReviews.unshift({ name, rating, text });
    localStorage.setItem('luvella_reviews', JSON.stringify(savedReviews));
    renderReviews();

    document.getElementById('revOrderId').value = '';
    document.getElementById('revName').value = '';
    document.getElementById('revText').value = '';
    alert('ধন্যবাদ! আপনার ভেরিফায়েড রিভিউটি সফলভাবে যুক্ত হয়েছে।');
}

// পেজ লোড হওয়ার সাথে সাথে রিভিউ লোড করা
document.addEventListener('DOMContentLoaded', renderReviews);



// হেল্প পপআপ ও মোডাল কন্ট্রোল
function toggleHelp() {
    document.getElementById('helpPopup').classList.toggle('show');
}

function openModal(modalId) {
    if (modalId === 'cartModal') renderCartModal();
    if (modalId === 'wishlistModal') renderWishlistModal();
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}
