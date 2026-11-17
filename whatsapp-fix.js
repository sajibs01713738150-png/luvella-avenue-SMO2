function orderViaWhatsApp(waNumber) {
    const name = document.getElementById('custName').value.trim() || 'দেওয়া হয়নি';
    const phone = document.getElementById('custPhone').value.trim() || 'দেওয়া হয়নি';
    const address = document.getElementById('custAddress').value.trim() || 'দেওয়া হয়নি';
    const payment = document.getElementById('paymentMethod').value;

    let itemText = currentOrderItems.map(i => `${i.name} (${i.qty}টি - ${i.price * i.qty}৳)`).join(', ');
    let total = currentOrderItems.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const message = `আসসালামু আলাইকুম Luvella Avenue,\nআমি একটি অর্ডার করতে চাই:\n\nপ্রোডাক্ট: ${itemText}\nমোট বিল: ${total}৳\nপেমেন্ট: ${payment}\n\nনাম: ${name}\nমোবাইল: ${phone}\nঠিকানা: ${address}`;

    // URL তৈরি করার নিরাপদ পদ্ধতি (কখনো স্ল্যাশ ভাঙবে না)
    const waUrl = new URL("https://whatsapp.com");
    waUrl.searchParams.set("phone", waNumber);
    waUrl.searchParams.set("text", message);

    window.open(waUrl.toString(), "_blank");
}
