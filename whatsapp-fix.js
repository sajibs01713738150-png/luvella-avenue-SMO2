let isAdminReviewMode = false;
// ১. অর্ডার কনফার্ম করার আগে WhatsApp বাটন ব্লক রাখা এবং অর্ডার আইডিসহ মেসেজ পাঠানো
function orderViaWhatsApp(waNumber) {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const payment = document.getElementById('paymentMethod').value;
    const trxId = document.getElementById('trxId').value.trim();

    // কাস্টমার ফর্ম পূরণ না করলে WhatsApp-এ যেতে দেবে না
    if (!name || !phone || !address) {
        alert('আগে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা লিখে "অর্ডার কনফার্ম ও রিসিট প্রিন্ট" বাটনে ক্লিক করুন!');
        return;
    }

    if ((payment === 'bKash' || payment === 'Nagad') && !trxId) {
        alert('আগে বিকাশ বা নগদের Transaction ID (TrxID) লিখুন!');
        return;
    }

    // চেক করা হচ্ছে কাস্টমার আগে "অর্ডার কনফার্ম" বাটনে ক্লিক করেছে কি না
    let savedOrders = JSON.parse(localStorage.getItem('luvella_orders')) || [];
    const confirmedOrder = savedOrders.find(o => o.phone.trim() === phone && o.name.trim() === name);

    if (!confirmedOrder) {
        alert('দয়া করে আগে উপরের "অর্ডার কনফার্ম ও রিসিট প্রিন্ট" বাটনে ক্লিক করে আপনার অর্ডার আইডি তৈরি করুন, তারপর WhatsApp-এ পাঠান!');
        return;
    }

    let itemText = confirmedOrder.items.map(i => `${i.name} (${i.qty}টি - ${i.price * i.qty}৳)`).join(', ');

    const message = `আসসালামু আলাইকুম Luvella Avenue,\nআমি ওয়েবসাইটে অর্ডার কনফার্ম করেছি:\n\n🆔 অর্ডার আইডি: ${confirmedOrder.orderId}\nপ্রোডাক্ট: ${itemText}\nমোট বিল: ${confirmedOrder.totalAmount}৳\nপেমেন্ট: ${confirmedOrder.payment} ${confirmedOrder.trxId !== 'N/A' ? `(TrxID: ${confirmedOrder.trxId})` : ''}\n\n👤 ক্রেতার তথ্য:\nনাম: ${confirmedOrder.name}\nমোবাইল: ${confirmedOrder.phone}\nঠিকানা: ${confirmedOrder.address}`;

    // সরাসরি WhatsApp অ্যাপের চ্যাটবক্স ওপেন করবে
    window.location.href = "whatsapp://send?phone=" + waNumber + "&text=" + encodeURIComponent(message);
}



// ২. Help বাটনের ৩টি WhatsApp লিংকও অটোমেটিক ঠিক করে দেওয়া
document.addEventListener("DOMContentLoaded", function () {
    const waLinks = document.querySelectorAll('.wa-text-btn, .wa-link');
    waLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('880')) {
            const numMatch = href.match(/880\d+/);
            if (numMatch) {
                link.removeAttribute('target');
                link.setAttribute('href', 'whatsapp://send?phone=' + numMatch[0] + '&text=' + encodeURIComponent('আসসালামু আলাইকুম Luvella Avenue'));
            }
        }
    });
});
// ট্র্যাক বাটন এবং স্ট্যাটাস চেক করার স্থায়ী সমাধান
document.addEventListener("DOMContentLoaded", function () {
    const trackBtn = document.querySelector('#trackModal .confirm-order-btn');
    if (trackBtn) {
        trackBtn.onclick = function () {
            const inputEl = document.getElementById('trackOrderId');
            const resultBox = document.getElementById('trackResult');
            const query = inputEl.value.trim().toUpperCase();

            if (!query) {
                resultBox.innerHTML = `<p style="color:#E11D48;">দয়া করে আপনার অর্ডার আইডি অথবা মোবাইল নম্বর লিখুন।</p>`;
                return;
            }

            let savedOrders = JSON.parse(localStorage.getItem('luvella_orders')) || [];
            const matchedOrders = savedOrders.filter(o =>
                (o.orderId && o.orderId.toUpperCase() === query) ||
                (o.phone && o.phone.trim() === query)
            );

            if (matchedOrders.length > 0) {
                resultBox.innerHTML = matchedOrders.map(order => `
                    <div style="border-bottom: 1px dashed #F3D1DC; padding-bottom: 8px; margin-bottom: 8px;">
                        <p style="color:#8B1E41; font-weight:bold;">অর্ডার আইডি: ${order.orderId}</p>
                        <p><strong>ক্রেতা:</strong> ${order.name} (${order.phone})</p>
                        <p><strong>পণ্য:</strong> ${order.items.map(i => `${i.name} (${i.qty}টি)`).join(', ')}</p>
                        <p><strong>মোট বিল:</strong> ${order.totalAmount}৳ (${order.payment})</p>
                        <p><strong>বর্তমান অবস্থা:</strong> <span style="color:green; font-weight:bold;">${order.status}</span></p>
                    </div>
                `).join('');
            } else {
                resultBox.innerHTML = `<p style="color:#E11D48;">দুঃখিত! "${query}" দিয়ে কোনো অর্ডার খুঁজে পাওয়া যায়নি।</p>`;
            }
        };
    }
});
// জুম বা যেকোনো পপআপের বাইরের কালো অংশে ক্লিক করলেই সহজে বন্ধ হবে
window.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
});
// রিভিউ না থাকলে কোনো খালি লেখা দেখাবে না
function renderReviews() {
    const reviewList = document.getElementById('reviewList');
    if (!reviewList) return;

    let reviews = JSON.parse(localStorage.getItem('luvella_reviews')) || [];
    const visibleReviews = isAdminReviewMode ? reviews : reviews.filter(r => !r.hidden);

    if (visibleReviews.length === 0) {
        reviewList.innerHTML = '';
        reviewList.style.marginBottom = '0';
        return;
    }

    reviewList.style.marginBottom = '15px';
    reviewList.innerHTML = visibleReviews.map(r => `
        <div class="review-card" style="padding: 10px; opacity: ${r.hidden ? '0.5' : '1'};">
            <div class="stars" style="font-size: 13px;">
                ★★★★★ (${r.rating}) <span style="color:green; font-size:11px;">✔ Verified Buyer</span>
                ${r.hidden ? '<span style="color:red; font-size:11px;"> [Hidden]</span>' : ''}
            </div>
            <p style="font-size: 13px; margin: 5px 0;">"${r.text}"</p>
            ${r.image ? `<img src="${r.image}" alt="Review Photo" onclick="openZoomImage('${r.image}')" style="width: 65px; height: 65px; object-fit: cover; border-radius: 6px; margin: 5px 0; cursor: zoom-in; border: 1px solid #ddd;">` : ''}
            <h4 style="font-size: 12px;">- ${r.name}</h4>
            ${isAdminReviewMode ? `
                <div style="margin-top: 6px; display: flex; gap: 5px;">
                    <button onclick="toggleHideReview(${r.id})" style="background:#f59e0b; color:#fff; border:none; padding:3px 7px; border-radius:4px; font-size:11px; cursor:pointer;">
                        ${r.hidden ? '👁️ Show করুন' : '🙈 Hide করুন'}
                    </button>
                    <button onclick="deleteReview(${r.id})" style="background:#e11d48; color:#fff; border:none; padding:3px 7px; border-radius:4px; font-size:11px; cursor:pointer;">
                        🗑️ মুছুন
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// ফোনে ও ল্যাপটপে ৩ ট্যাপ করলে নিশ্চিতভাবে অ্যাডমিন পাসওয়ার্ড চাইবে
(function setupAdminFooterTap() {
    const footer = document.querySelector('.footer');
    if (!footer) return;
    footer.style.touchAction = 'manipulation'; // ফোনের ডাবল-ট্যাপ জুম বন্ধ করবে
    let tapCount = 0;
    let tapTimer = null;

    footer.addEventListener('click', function () {
        tapCount++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => { tapCount = 0; }, 1200);

        if (tapCount >= 3) {
            tapCount = 0;
            const pass = prompt('অ্যাডমিন পাসওয়ার্ড দিন (1234):');
            if (pass === 'SMO') {
                isAdminReviewMode = !isAdminReviewMode;
                renderReviews();
                alert(isAdminReviewMode ? 'অ্যাডমিন মোড চালু হয়েছে!' : 'অ্যাডমিন মোড বন্ধ হয়েছে।');
            } else if (pass !== null) {
                alert('ভুল পাসওয়ার্ড!');
            }
        }
    });
    renderReviews();
})();
// ফোনের Back বাটন চাপলে ওয়েবসাইট থেকে বের না হওয়ার ১০০% কার্যকর সমাধান
(function bulletproofBackButton() {
    // ১. পেজ খোলার সাথে সাথে একটি বেস হিস্ট্রি স্টেট তৈরি রাখা
    if (!window.location.hash) {
        history.replaceState({ page: 'home' }, '', '#home');
    }

    const oldOpenModal = window.openModal;
    const oldCloseModal = window.closeModal;

    // ২. যেকোনো পপআপ (Order, Zoom, Cart, Track) খুললে URL-এ #modal যুক্ত হবে
    window.openModal = function (modalId) {
        if (typeof oldOpenModal === 'function') {
            oldOpenModal(modalId);
        } else {
            const m = document.getElementById(modalId);
            if (m) m.classList.add('show');
        }
        history.pushState({ modal: modalId }, '', '#' + modalId);
    };

    // ৩. ক্রস (×) বাটনে চাপ দিয়ে বন্ধ করলে হিস্ট্রি আবার #home-এ ফিরে আসবে
    window.closeModal = function (modalId) {
        if (typeof oldCloseModal === 'function') {
            oldCloseModal(modalId);
        } else {
            const m = document.getElementById(modalId);
            if (m) m.classList.remove('show');
        }
        if (window.location.hash !== '#home') {
            history.back();
        }
    };

    // ৪. ফোনের Back বাটন চাপলে খোলা সব পপআপ ও হেল্প বক্স বন্ধ হবে, সাইট থেকে বের হবে না
    window.addEventListener('popstate', function () {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
        const helpPopup = document.getElementById('helpPopup');
        if (helpPopup) helpPopup.classList.remove('show');
    });
})();
// Love বাটনে ১ ক্লিকে Wishlist এবং টানা ৪ ক্লিকে Product Link কপি করা
let loveTapCount = 0;
let loveTapTimer = null;
let lastTappedProductId = null;


// Love বাটনে ১ ক্লিকে Wishlist এবং টানা ৪ ক্লিকে Link Copy (১০০% কার্যকর সমাধান)
(function setupFourTapLinkCopy() {
    const originalToggleWishlist = window.toggleWishlist;
    let tapCount = 0;
    let tapTimer = null;
    let currentProductId = null;

    window.toggleWishlist = function (id) {
        if (currentProductId !== id) {
            tapCount = 0;
            currentProductId = id;
        }

        tapCount++;
        clearTimeout(tapTimer);

        // যদি টানা ৪ বার ক্লিক করা হয় -> লিংক কপি হবে
        if (tapCount >= 4) {
            tapCount = 0;
            const url = window.location.origin + window.location.pathname + '?product=' + id;
            copyProductUrlSafely(url);
            return;
        }

        // ৪ বার না হলে -> ৬০০ মিলিসেকেন্ড পর স্বাভাবিক ১-ক্লিক Wishlist হিসেবে কাজ করবে
        tapTimer = setTimeout(() => {
            if (tapCount > 0 && tapCount < 4) {
                if (typeof originalToggleWishlist === 'function') {
                    originalToggleWishlist(id);
                }
            }
            tapCount = 0;
        }, 600);
    };

    // ফোন ও ল্যাপটপ সব ব্রাউজারে নিশ্চিতভাবে লিংক কপি করার ফাংশন
    function copyProductUrlSafely(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showToastMessage('🔗 প্রোডাক্টের লিংক কপি হয়েছে!');
            }).catch(() => {
                manualCopyFallback(text);
            });
        } else {
            manualCopyFallback(text);
        }
    }

    function manualCopyFallback(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToastMessage('🔗 প্রোডাক্টের লিংক কপি হয়েছে!');
        } catch (err) {
            prompt('লিংকটি কপি করুন:', text);
        }
        document.body.removeChild(textArea);
    }

    // স্ক্রিনের নিচে কপি হওয়ার মেসেজ দেখানো
    function showToastMessage(msg) {
        let toast = document.getElementById('copyToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'copyToast';
            toast.style.cssText = 'position:fixed; bottom:85px; left:50%; transform:translateX(-50%); background:#8B1E41; color:#fff; padding:8px 18px; border-radius:20px; font-size:13px; font-weight:600; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.25); white-space:nowrap;';
            document.body.appendChild(toast);
        }
        toast.innerText = msg;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2500);
    }

    // ছবির ওপরের আলাদা Link বাটন লুকিয়ে রাখা এবং Love বাটনের জুম আটকানো
    setInterval(() => {
        document.querySelectorAll('.card-top-actions').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.wish-inline-btn').forEach(btn => btn.style.touchAction = 'manipulation');
    }, 300);
})();

