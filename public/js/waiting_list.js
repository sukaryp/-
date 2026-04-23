/**
 * نظام السفير - إدارة قائمة الانتظار
 * Developed by: ProCoding (Belal Hesham)
 */

let selectedClientId = null;

document.addEventListener('DOMContentLoaded', () => {
    initWaitingClock();
});

/**
 * تشغيل الساعة الحية بتوقيت السيرفر
 */
function initWaitingClock() {
    const serverTimeInput = document.getElementById('server-start-time');
    const clockDisplay = document.getElementById('live-clock');
    if (!serverTimeInput || !clockDisplay) return;

    let currentTime = new Date(serverTimeInput.value);
    setInterval(() => {
        currentTime.setSeconds(currentTime.getSeconds() + 1);
        clockDisplay.innerText = currentTime.toLocaleTimeString('ar-EG');
    }, 1000);
}

/**
 * فتح مودال التوزيع وتحديد ID العميل المختار
 */
function openDistributeModal(clientData) {
    // التأكد من تحويل البيانات لـ Object
    const client = typeof clientData === 'string' ? JSON.parse(clientData) : clientData;
    
    // حفظ الـ ID في متغير عام لاستخدامه عند الضغط على اسم الموظف
    selectedClientId = client.Id || client.id; 
    
    // تحديث نص العنوان في المودال
    const targetNameDisplay = document.getElementById('targetClientName');
    if (targetNameDisplay) {
        targetNameDisplay.innerText = "توزيع العميل: " + client.Name || client.name;
    }
    
    const myModal = new bootstrap.Modal(document.getElementById('distributeModal'));
    myModal.show();
}

/**
 * إرسال طلب التوزيع للسيرفر (Link with SQL)
 */
function assignToEmployee(empName) {
    if (!selectedClientId) {
        alert("عذراً، لم يتم تحديد العميل بشكل صحيح.");
        return;
    }

    // إظهار لودر بسيط أو تغيير شكل الزرار
    console.log(`📡 جاري توزيع العميل رقم ${selectedClientId} إلى ${empName}...`);

    // إنشاء فورم وهمي لإرسال البيانات كـ POST طلب عادي (أسهل وأضمن طريقة للربط مع app.js الحالي)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/assign-client';

    const clientInput = document.createElement('input');
    clientInput.type = 'hidden';
    clientInput.name = 'clientId';
    clientInput.value = selectedClientId;

    const empInput = document.createElement('input');
    empInput.type = 'hidden';
    empInput.name = 'employeeName';
    empInput.value = empName;

    form.appendChild(clientInput);
    form.appendChild(empInput);
    document.body.appendChild(form);
    
    // تنفيذ الإرسال
    form.submit();
}

/**
 * وظيفة البحث السريع داخل قائمة الانتظار
 */
function filterWaitingList() {
    const input = document.getElementById('waitingSearch');
    if (!input) return;
    
    const filter = input.value.toLowerCase();
    const rows = document.querySelectorAll('.waiting-table tbody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
}