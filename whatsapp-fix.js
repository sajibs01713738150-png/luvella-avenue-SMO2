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
