// ১. Order Now এর ৩টি WhatsApp বাটন ঠিক করা
function orderViaWhatsApp(waNumber) {
    const name = document.getElementById('custName').value.trim() || 'দেওয়া হয়নি';
    const phone = document.getElementById('custPhone').value.trim() || 'দেওয়া হয়নি';
    const address = document.getElementById('custAddress').value.trim() || 'দেওয়া হয়নি';
    const payment = document.getElementById('paymentMethod').value;

    let itemText = currentOrderItems.map(i => `${i.name} (${i.qty}টি - ${i.price * i.qty}৳)`).join(', ');
    let total = currentOrderItems.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const message = `আসসালামু আলাইকুম Luvella Avenue,\nআমি একটি অর্ডার করতে চাই:\n\nপ্রোডাক্ট: ${itemText}\nমোট বিল: ${total}৳\nপেমেন্ট: ${payment}\n\nনাম: ${name}\nমোবাইল: ${phone}\nঠিকানা: ${address}`;

    // সরাসরি আপনার ইনস্টল করা WhatsApp অ্যাপের চ্যাটবক্স ওপেন করবে
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
