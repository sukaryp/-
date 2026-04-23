/**
 * نظام السفير لخدمات السيارات - الملف الرئيسي (Dashboard)
 * Developed by: ProCoding (Belal Hesham)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. إدارة الوقت والتاريخ الحقيقي (توقيت السيرفر)
    initLiveClock();

    // 2. إضافة تأثيرات تفاعلية للكروت (Cards Interaction)
    initCardEffects();

    // 3. تأثير ظهور تدريجي للعناصر (Entrance Animation)
    initEntranceAnimation();

    console.log("🚀 نظام السفير جاهز.. أهلاً بك يا هندسة بلال.");
});

/**
 * وظيفة تحديث الساعة والتاريخ بناءً على وقت السيرفر
 */
function initLiveClock() {
    const serverTimeInput = document.getElementById('server-start-time');
    const dateDisplay = document.getElementById('live-date');
    const clockDisplay = document.getElementById('live-clock');

    if (!serverTimeInput) return;

    // تحويل القيمة القادمة من Node.js لكائن تاريخ
    let currentTime = new Date(serverTimeInput.value);

    function updateTick() {
        // زيادة ثانية واحدة في كل دورة
        currentTime.setSeconds(currentTime.getSeconds() + 1);

        // تنسيق عرض التاريخ والوقت باللغة العربية
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: true 
        };

        if (dateDisplay) dateDisplay.innerText = currentTime.toLocaleDateString('ar-EG', dateOptions);
        if (clockDisplay) clockDisplay.innerText = currentTime.toLocaleTimeString('ar-EG', timeOptions);
    }

    // تشغيل التحديث كل 1000 ملي ثانية (ثانية واحدة)
    setInterval(updateTick, 1000);
    updateTick(); // تشغيل فوري لتجنب التأخير عند التحميل
}

/**
 * وظيفة التأثيرات البصرية عند الضغط أو التحويم
 */
function initCardEffects() {
    const cards = document.querySelectorAll('.main-card');

    cards.forEach(card => {
        // تأثير الضغط (Scale down)
        card.addEventListener('mousedown', function() {
            this.style.transform = "scale(0.95)";
            this.style.transition = "0.1s ease-in-out";
        });

        // العودة للحجم الطبيعي (Scale up)
        card.addEventListener('mouseup', function() {
            this.style.transform = "translateY(-10px) scale(1)";
            this.style.transition = "0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        });

        // في حالة خروج الماوس بعيداً عن الكارت وهو مضغوط
        card.addEventListener('mouseleave', function() {
            this.style.transform = "translateY(0) scale(1)";
        });

        // تسجيل الحركة في الكونسول للتصحيح (Debugging)
        card.addEventListener('click', function(e) {
            const sectionName = this.querySelector('h5') ? this.querySelector('h5').innerText : "قسم غير معروف";
            console.log(`📡 جاري الانتقال إلى: ${sectionName}`);
            
            // إضافة تأثير نبضة (Ripple) بسيط عند الضغط
            createRipple(e, this);
        });
    });
}

/**
 * تأثير ظهور الكروت بالتتابع (Staggered Animation)
 */
function initEntranceAnimation() {
    const cards = document.querySelectorAll('.main-card');
    cards.forEach((card, index) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        card.style.transition = `all 0.5s ease-out ${index * 0.1}s`;
        
        setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }, 50);
    });
}

/**
 * وظيفة تأثير النبضة عند الضغط (Ripple Effect)
 */
function createRipple(event, element) {
    const circle = document.createElement("span");
    const diameter = Math.max(element.clientWidth, element.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - element.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - element.offsetTop - radius}px`;
    circle.classList.add("ripple");

    const ripple = element.getElementsByClassName("ripple")[0];
    if (ripple) { ripple.remove(); }
    element.appendChild(circle);
}