(function () {
    const DB_LINK = "https://firebaseio.com";

    // ১. সবার স্ক্রিনে পাবলিক রিভিউ লোড করে দেখানো
    function loadAllReviews() {
        const list = document.getElementById('reviewList');
        if (!list) return;

        fetch(DB_LINK)
            .then(res => res.json())
            .then(data => {
                const allReviews = data ? Object.keys(data).map(k => ({ key: k, ...data[k] })).reverse() : [];
                const isAdmin = (typeof isAdminReviewMode !== 'undefined' && isAdminReviewMode);
                const visibleReviews = isAdmin ? allReviews : allReviews.filter(r => !r.hidden);

                if (visibleReviews.length === 0) {
                    list.innerHTML = '';
                    list.style.marginBottom = '0';
                    return;
                }

                list.style.marginBottom = '15px';
                list.innerHTML = visibleReviews.map(r => `
                    <div class="review-card" style="padding:10px; opacity:${r.hidden ? '0.5' : '1'};">
                        <div class="stars" style="font-size:13px;">
                            ★★★★★ (${r.rating}) ${r.hidden ? '<span style="color:red;">[Hidden]</span>' : ''}
                        </div>
                        <p style="font-size:13px; margin:5px 0;">"${r.text}"</p>
                        ${r.image ? `<img src="${r.image}" onclick="openZoomImage('${r.image}')" style="width:65px; height:65px; object-fit:cover; border-radius:6px; cursor:zoom-in; border:1px solid #ddd;">` : ''}
                        <h4 style="font-size:12px;">- ${r.name}</h4>
                        ${isAdmin ? `
                            <div style="margin-top:5px;">
                                <button onclick="adminToggleReview('${r.key}', ${!r.hidden})" style="background:#f59e0b; color:#fff; border:none; padding:2px 7px; border-radius:4px; font-size:11px; cursor:pointer;">${r.hidden ? 'Show' : 'Hide'}</button>
                                <button onclick="adminDeleteReview('${r.key}')" style="background:#e11d48; color:#fff; border:none; padding:2px 7px; border-radius:4px; font-size:11px; cursor:pointer;">Delete</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            })
            .catch(err => console.log("Review load error:", err));
    }

    // ২. ছবি ছাড়া অথবা ছবিসহ রিভিউ পাবলিশ করা
    window.addReview = function () {
        const name = document.getElementById('revName').value.trim();
        const text = document.getElementById('revText').value.trim();
        const rating = document.getElementById('revRating').value;
        const imgInput = document.getElementById('revImage');

        if (!name || !text) {
            alert('দয়া করে আপনার নাম এবং মতামত লিখুন।');
            return;
        }

        const sendReview = (imgData) => {
            fetch(DB_LINK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    text: text,
                    rating: rating,
                    image: imgData || null,
                    hidden: false
                })
            })
            .then(res => {
                if (!res.ok) throw new Error('Server error');
                document.getElementById('revName').value = '';
                document.getElementById('revText').value = '';
                if (imgInput) imgInput.value = '';
                loadAllReviews();
                alert('ধন্যবাদ! আপনার রিভিউটি সবার জন্য পাবলিশ হয়েছে।');
            })
            .catch(() => alert('নেটওয়ার্ক সমস্যার কারণে সেভ হয়নি, আবার চেষ্টা করুন।'));
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
                    sendReview(canvas.toDataURL('image/jpeg', 0.65));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(imgInput.files);
        } else {
            sendReview(null);
        }
    };

    // ৩. অ্যাডমিন হাইড ও ডিলিট
    window.adminToggleReview = function (key, newState) {
        fetch(`https://firebaseio.com{key}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hidden: newState })
        }).then(() => loadAllReviews());
    };

    window.adminDeleteReview = function (key) {
        if (!confirm('রিভিউটি চিরতরে মুছে ফেলবেন?')) return;
        fetch(`https://firebaseio.com{key}.json`, {
            method: 'DELETE'
        }).then(() => loadAllReviews());
    };

    // পেজ ওপেন হলেই রিভিউ দেখাবে
    loadAllReviews();
    window.renderReviews = loadAllReviews;
})();
