(function () {
    // বাংলাদেশ থেকে ১০০% ফাস্ট কাজ করা পাবলিক ক্লাউড স্টোরেজ (JSONBlob API)
    const CLOUD_API = "https://jsonblob.com";

    // ১. সবার স্ক্রিনে পাবলিক রিভিউ লোড করে দেখানো
    function loadPublicReviews() {
        const list = document.getElementById('reviewList');
        if (!list) return;

        fetch(CLOUD_API, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        })
        .then(res => res.ok ? res.json() : { reviews: [] })
        .then(data => {
            const allReviews = Array.isArray(data.reviews) ? data.reviews : [];
            const isAdmin = (typeof isAdminReviewMode !== 'undefined' && isAdminReviewMode);
            const visibleReviews = isAdmin ? allReviews : allReviews.filter(r => !r.hidden);

            if (visibleReviews.length === 0) {
                list.innerHTML = '';
                list.style.marginBottom = '0';
                return;
            }

            list.style.marginBottom = '15px';
            list.innerHTML = visibleReviews.map((r, index) => `
                <div class="review-card" style="padding:10px; opacity:${r.hidden ? '0.5' : '1'};">
                    <div class="stars" style="font-size:13px;">
                        ★★★★★ (${r.rating}) ${r.hidden ? '<span style="color:red;">[Hidden]</span>' : ''}
                    </div>
                    <p style="font-size:13px; margin:5px 0;">"${r.text}"</p>
                    ${r.image ? `<img src="${r.image}" onclick="openZoomImage('${r.image}')" style="width:65px; height:65px; object-fit:cover; border-radius:6px; cursor:zoom-in; border:1px solid #ddd;">` : ''}
                    <h4 style="font-size:12px;">- ${r.name}</h4>
                    ${isAdmin ? `
                        <div style="margin-top:5px;">
                            <button onclick="adminUpdateReview(${r.id}, 'toggle')" style="background:#f59e0b; color:#fff; border:none; padding:2px 7px; border-radius:4px; font-size:11px; cursor:pointer;">${r.hidden ? 'Show' : 'Hide'}</button>
                            <button onclick="adminUpdateReview(${r.id}, 'delete')" style="background:#e11d48; color:#fff; border:none; padding:2px 7px; border-radius:4px; font-size:11px; cursor:pointer;">Delete</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        })
        .catch(() => {
            // ব্যাকআপ হিসেবে লোকাল রিভিউ দেখাবে
            const local = JSON.parse(localStorage.getItem('luvella_reviews')) || [];
            if (local.length > 0 && list) {
                list.innerHTML = local.map(r => `<div class="review-card" style="padding:10px;"><div class="stars">★★★★★ (${r.rating})</div><p>"${r.text}"</p><h4>- ${r.name}</h4></div>`).join('');
            }
        });
    }

    // ২. নতুন রিভিউ পাবলিকলি সেভ করা
    window.addReview = function () {
        const name = document.getElementById('revName').value.trim();
        const text = document.getElementById('revText').value.trim();
        const rating = document.getElementById('revRating').value;
        const imgInput = document.getElementById('revImage');

        if (!name || !text) {
            alert('দয়া করে আপনার নাম এবং মতামত লিখুন।');
            return;
        }

        const saveToCloud = async (imgData) => {
            try {
                // আগের রিভিউগুলো আনা
                let currentReviews = [];
                const getRes = await fetch(CLOUD_API, { headers: { 'Accept': 'application/json' } });
                if (getRes.ok) {
                    const existingData = await getRes.json();
                    if (Array.isArray(existingData.reviews)) currentReviews = existingData.reviews;
                }

                // নতুন রিভিউ সবার উপরে যোগ করা
                const newEntry = {
                    id: Date.now(),
                    name: name,
                    text: text,
                    rating: rating,
                    image: imgData || null,
                    hidden: false
                };
                currentReviews.unshift(newEntry);

                // ক্লাউডে সেভ করা
                const putRes = await fetch(CLOUD_API, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ reviews: currentReviews })
                });

                if (!putRes.ok) throw new Error('Save failed');

                document.getElementById('revName').value = '';
                document.getElementById('revText').value = '';
                if (imgInput) imgInput.value = '';
                loadPublicReviews();
                alert('ধন্যবাদ! আপনার রিভিউটি সবার জন্য পাবলিশ হয়েছে।');
            } catch (err) {
                alert('সমস্যা হয়েছে: ' + err.message);
            }
        };

        if (imgInput && imgInput.files && imgInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const scale = img.width > 300 ? (300 / img.width) : 1;
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    saveToCloud(canvas.toDataURL('image/jpeg', 0.6));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(imgInput.files);
        } else {
            saveToCloud(null);
        }
    };

    // ৩. অ্যাডমিন হিসেবে রিভিউ Hide বা Delete করা
    window.adminUpdateReview = async function (targetId, action) {
        if (action === 'delete' && !confirm('রিভিউটি চিরতরে মুছে ফেলবেন?')) return;
        const getRes = await fetch(CLOUD_API, { headers: { 'Accept': 'application/json' } });
        const data = await getRes.json();
        let list = Array.isArray(data.reviews) ? data.reviews : [];

        if (action === 'toggle') {
            list = list.map(r => r.id === targetId ? { ...r, hidden: !r.hidden } : r);
        } else if (action === 'delete') {
            list = list.filter(r => r.id !== targetId);
        }

        await fetch(CLOUD_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ reviews: list })
        });
        loadPublicReviews();
    };

    loadPublicReviews();
    window.renderReviews = loadPublicReviews;
})();
