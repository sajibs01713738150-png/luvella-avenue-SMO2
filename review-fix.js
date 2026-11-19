(function () {
    // ১. কাস্টমারের নিজের দেওয়া রিভিউগুলো দেখানো
    function showLocalReviews() {
        const list = document.getElementById('reviewList');
        if (!list) return;

        let reviews = JSON.parse(localStorage.getItem('luvella_reviews')) || [];
        const isAdmin = (typeof isAdminReviewMode !== 'undefined' && isAdminReviewMode);
        const visibleReviews = isAdmin ? reviews : reviews.filter(r => !r.hidden);

        if (visibleReviews.length === 0) {
            list.innerHTML = '';
            list.style.marginBottom = '0';
            return;
        }

        list.style.marginBottom = '15px';
        list.innerHTML = visibleReviews.map(r => `
            <div class="review-card" style="padding:10px; opacity:${r.hidden ? '0.5' : '1'};">
                <div class="stars" style="font-size:13px;">
                    ★★★★★ (${r.rating}) ${r.verified ? '<span style="color:green; font-size:11px;">✔ Verified Buyer</span>' : ''}
                    ${r.hidden ? '<span style="color:red; font-size:11px;"> [Hidden]</span>' : ''}
                </div>
                <p style="font-size:13px; margin:5px 0;">"${r.text}"</p>
                ${r.image ? `<img src="${r.image}" onclick="openZoomImage('${r.image}')" style="width:65px; height:65px; object-fit:cover; border-radius:6px; cursor:zoom-in; border:1px solid #ddd;">` : ''}
                <h4 style="font-size:12px;">- ${r.name}</h4>
                ${isAdmin ? `
                    <div style="margin-top:5px;">
                        <button onclick="localToggleReview(${r.id})" style="background:#f59e0b; color:#fff; border:none; padding:2px 7px; border-radius:4px; font-size:11px; cursor:pointer;">${r.hidden ? 'Show' : 'Hide'}</button>
                        <button onclick="localDeleteReview(${r.id})" style="background:#e11d48; color:#fff; border:none; padding:2px 7px; border-radius:4px; font-size:11px; cursor:pointer;">Delete</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // ২. ছবি ছাড়া অথবা ছবিসহ রিভিউ পোস্ট করা (কোনো নেটওয়ার্ক এরর ছাড়াই)
    window.addReview = function () {
        const orderIdEl = document.getElementById('revOrderId');
        const nameEl = document.getElementById('revName');
        const ratingEl = document.getElementById('revRating');
        const textEl = document.getElementById('revText');
        const imgInput = document.getElementById('revImage');

        const orderId = orderIdEl ? orderIdEl.value.trim().toUpperCase() : '';
        const name = nameEl ? nameEl.value.trim() : '';
        const rating = ratingEl ? ratingEl.value : '5.0';
        const text = textEl ? textEl.value.trim() : '';

        if (!name || !text) {
            alert('দয়া করে আপনার নাম এবং মতামত লিখুন।');
            return;
        }

        let savedOrders = JSON.parse(localStorage.getItem('luvella_orders')) || [];
        const isVerified = orderId && savedOrders.some(o => o.orderId && o.orderId.toUpperCase() === orderId);

        const saveReview = (imgData) => {
            let reviews = JSON.parse(localStorage.getItem('luvella_reviews')) || [];
            reviews.unshift({
                id: Date.now(),
                name: name,
                rating: rating,
                text: text,
                verified: !!isVerified,
                image: imgData || null,
                hidden: false
            });
            localStorage.setItem('luvella_reviews', JSON.stringify(reviews));

            if (orderIdEl) orderIdEl.value = '';
            if (nameEl) nameEl.value = '';
            if (textEl) textEl.value = '';
            if (imgInput) imgInput.value = '';

            showLocalReviews();
            alert('ধন্যবাদ! আপনার মূল্যবান মতামতটি সফলভাবে যুক্ত হয়েছে।');
        };

        if (imgInput && imgInput.files && imgInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const scale = img.width > 350 ? (350 / img.width) : 1;
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    saveReview(canvas.toDataURL('image/jpeg', 0.65));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(imgInput.files[0]);
        } else {
            saveReview(null);
        }
    };

    // ৩. অ্যাডমিন হাইড ও ডিলিট কন্ট্রোল
    window.localToggleReview = function (id) {
        let reviews = JSON.parse(localStorage.getItem('luvella_reviews')) || [];
        reviews = reviews.map(r => r.id === id ? { ...r, hidden: !r.hidden } : r);
        localStorage.setItem('luvella_reviews', JSON.stringify(reviews));
        showLocalReviews();
    };

    window.localDeleteReview = function (id) {
        if (!confirm('রিভিউটি মুছে ফেলবেন?')) return;
        let reviews = JSON.parse(localStorage.getItem('luvella_reviews')) || [];
        reviews = reviews.filter(r => r.id !== id);
        localStorage.setItem('luvella_reviews', JSON.stringify(reviews));
        showLocalReviews();
    };

    showLocalReviews();
    window.renderReviews = showLocalReviews;
})();
// অর্ডার কনফার্ম ও রিসিট পপআপ সঠিকভাবে কাজ করানোর স্থায়ী সমাধান
document.addEventListener("DOMContentLoaded", function () {
    const confirmBtn = document.querySelector('#orderModal .confirm-order-btn');
    if (confirmBtn) {
        // ফর্ম সাবমিট হয়ে পেজ রিলোড হওয়া বন্ধ করা
        confirmBtn.setAttribute('type', 'button');

        confirmBtn.onclick = function (e) {
            e.preventDefault();

            const name = document.getElementById('custName').value.trim();
            const phone = document.getElementById('custPhone').value.trim();
            const address = document.getElementById('custAddress').value.trim();
            const payment = document.getElementById('paymentMethod').value;
            const trxId = document.getElementById('trxId').value.trim();

            if (!name || !phone || !address) {
                alert('দয়া করে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা লিখুন।');
                return;
            }
            if ((payment === 'bKash' || payment === 'Nagad') && !trxId) {
                alert('দয়া করে বিকাশ বা নগদের Transaction ID (TrxID) লিখুন।');
                return;
            }

            const orderId = 'LUV-' + Math.floor(1000 + Math.random() * 9000);
            const totalAmount = currentOrderItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
            const orderDate = new Date().toLocaleDateString('bn-BD');

            // অর্ডার রেকর্ড সেভ করা
            let savedOrders = JSON.parse(localStorage.getItem('luvella_orders')) || [];
            savedOrders.push({
                orderId, name, phone, address, payment,
                trxId: trxId || 'N/A', items: currentOrderItems, totalAmount, date: orderDate,
                status: 'অর্ডার কনফার্ম হয়েছে'
            });
            localStorage.setItem('luvella_orders', JSON.stringify(savedOrders));

            // রিসিটের ভেতরের তথ্য সাজানো
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
            `;

            // সরাসরি অর্ডার মোডাল সরিয়ে রিসিট মোডাল দেখানো (হোমে ফিরে যাবে না)
            document.getElementById('orderModal').classList.remove('show');
            document.getElementById('receiptModal').classList.add('show');
        };
    }
});
// ১. "অর্ডার কনফার্ম ও রিসিট প্রিন্ট" বাটনটি সরিয়ে ফেলা
(function hideConfirmAndEnableDirectWhatsApp() {
    const hideBtn = () => {
        const confirmBtn = document.querySelector('#orderModal .confirm-order-btn');
        if (confirmBtn) confirmBtn.style.display = 'none';
    };
    hideBtn();
    setInterval(hideBtn, 300);

    // ২. কাস্টমার ফর্ম পূরণ করে WhatsApp বাটনে চাপ দিলেই সরাসরি অর্ডার সেভ হয়ে মেসেজ যাবে
    window.orderViaWhatsApp = function (waNumber) {
        const name = document.getElementById('custName').value.trim();
        const phone = document.getElementById('custPhone').value.trim();
        const address = document.getElementById('custAddress').value.trim();
        const payment = document.getElementById('paymentMethod').value;
        const trxId = document.getElementById('trxId').value.trim();

        if (!name || !phone || !address) {
            alert('দয়া করে আগে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা লিখুন!');
            return;
        }
        if ((payment === 'bKash' || payment === 'Nagad') && !trxId) {
            alert('দয়া করে বিকাশ বা নগদের Transaction ID (TrxID) লিখুন!');
            return;
        }
        const missingSize = (typeof currentOrderItems !== 'undefined' ? currentOrderItems : []).find(i => i.sizes && i.sizes.length && !i.selectedSize);
        if (missingSize) {
            alert('দয়া করে "' + missingSize.name + '" এর সাইজ সিলেক্ট করুন!');
            return;
        }
        const orderId = 'LUV-' + Math.floor(1000 + Math.random() * 9000);
        const itemsList = (typeof currentOrderItems !== 'undefined' && currentOrderItems.length > 0) ? currentOrderItems : [];
        const totalAmount = itemsList.reduce((sum, i) => sum + (i.price * i.qty), 0);
        const orderDate = new Date().toLocaleDateString('bn-BD');

        // কাস্টমার যেন পরবর্তীতে রিভিউয়ে এই অর্ডার আইডি ব্যবহার করতে পারে তাই সেভ রাখা
        let savedOrders = JSON.parse(localStorage.getItem('luvella_orders')) || [];
        savedOrders.push({
            orderId, name, phone, address, payment,
            trxId: trxId || 'N/A', items: itemsList, totalAmount, date: orderDate,
            status: 'অর্ডার কনফার্ম হয়েছে'
        });
        localStorage.setItem('luvella_orders', JSON.stringify(savedOrders));

        const itemText = itemsList.map(i => `${i.name}${i.selectedSize ? ' [সাইজ: ' + i.selectedSize + ']' : ''} (${i.qty}টি - ${i.price * i.qty}৳)`).join(', ');
        const message = `আসসালামু আলাইকুম Luvella Avenue,\nআমি একটি অর্ডার করতে চাই:\n\n🆔 অর্ডার আইডি: ${orderId}\nপ্রোডাক্ট: ${itemText}\nমোট বিল: ${totalAmount}৳\nপেমেন্ট: ${payment} ${trxId ? `(TrxID: ${trxId})` : ''}\n\n👤 ক্রেতার তথ্য:\nনাম: ${name}\nমোবাইল: ${phone}\nঠিকানা: ${address}`;

        window.location.href = "whatsapp://send?phone=" + waNumber + "&text=" + encodeURIComponent(message);
    };
})();
