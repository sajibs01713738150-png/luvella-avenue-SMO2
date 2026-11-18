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
