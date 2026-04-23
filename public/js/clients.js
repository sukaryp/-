/**
 * نظام السفير لخدمات السيارات - إدارة العملاء
 * Developed by: ProCoding (Belal Hesham)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. إدارة الوقت الحقيقي من السيرفر
    initClientsClock();

    // 2. تفعيل البحث الذكي في الجدول
    initTableSearch();
});

/**
 * تحديث الساعة الحية في الهيدر
 */
function initClientsClock() {
    const serverTimeInput = document.getElementById('server-start-time');
    const clockDisplay = document.getElementById('live-clock');

    if (!serverTimeInput || !clockDisplay) return;

    let currentTime = new Date(serverTimeInput.value);

    setInterval(() => {
        currentTime.setSeconds(currentTime.getSeconds() + 1);
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        clockDisplay.innerText = currentTime.toLocaleTimeString('ar-EG', timeOptions);
    }, 1000);
}

/**
 * عرض تفاصيل العميل في مودال احترافي
 * @param {string} clientData - بيانات العميل بصيغة JSON
 */
function showDetails(clientData) {
    // التأكد من تحويل البيانات لـ Object
    const client = typeof clientData === 'string' ? JSON.parse(clientData) : clientData;
    const body = document.getElementById('modalBody');
    
    // تنسيق تاريخ الإضافة
    const dateFormatted = client.createdAt ? new Date(client.createdAt).toLocaleString('ar-EG') : 'غير مسجل';

    body.innerHTML = `
        <div class="list-group list-group-flush text-end">
            <div class="list-group-item bg-dark text-white rounded-4 mb-3 p-3 shadow-sm border-0">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge ${client.Status === 'waiting' ? 'bg-warning text-dark' : 'bg-success'}">
                        ${client.Status === 'waiting' ? 'قيد التوزيع' : 'عميل موزع'}
                    </span>
                    <small class="opacity-75"><i class="fas fa-calendar-alt ms-1"></i> ${dateFormatted}</small>
                </div>
                <div class="small mb-1">
                    <i class="fas fa-user-shield text-danger me-2"></i> الموظف المسؤول: 
                    <strong class="text-warning">${client.AssignedTo || 'في انتظار التوزيع'}</strong>
                </div>
                <div class="small">
                    <i class="fas fa-plus-circle text-danger me-2"></i> سجل بواسطة: 
                    <span class="text-info">${client.AddedBy || 'المدير'}</span>
                </div>
            </div>

            <div class="row g-0">
                <div class="col-12 list-group-item border-0">
                    <strong class="text-danger"><i class="fas fa-user me-2"></i> الاسم بالكامل:</strong> 
                    <span class="text-dark fw-bold">${client.name}</span>
                </div>
                <div class="col-12 list-group-item border-0">
                    <strong class="text-danger"><i class="fas fa-phone me-2"></i> رقم التواصل:</strong> 
                    <span class="text-dark fw-bold" dir="ltr">${client.phone}</span>
                </div>
                <div class="col-12 list-group-item border-0">
                    <strong class="text-danger"><i class="fas fa-car me-2"></i> تفاصيل السيارة:</strong> 
                    <span class="text-dark fw-bold">${client.car || '---'} ${client.model ? '(' + client.model + ')' : ''}</span>
                </div>
                <div class="col-6 list-group-item border-0">
                    <strong class="text-danger"><i class="fas fa-tag me-2"></i> الفئة:</strong> 
                    <span class="text-dark">${client.type || '---'}</span>
                </div>
                <div class="col-6 list-group-item border-0">
                    <strong class="text-danger"><i class="fas fa-money-bill-wave me-2"></i> الميزانية:</strong> 
                    <span class="text-success fw-bold">${client.budget || '0'} ج.م</span>
                </div>
                <div class="col-6 list-group-item border-0">
                    <strong class="text-danger"><i class="fas fa-credit-card me-2"></i> الدفع:</strong> 
                    <span class="text-dark">${client.payment || '---'}</span>
                </div>
                <div class="col-6 list-group-item border-0">
                    <strong class="text-danger"><i class="fas fa-share-alt me-2"></i> المصدر:</strong> 
                    <span class="badge bg-light text-dark border">${client.source || 'غير محدد'}</span>
                </div>
            </div>
            
            <div class="list-group-item bg-light rounded-4 mt-3 border-0">
                <strong class="text-danger d-block mb-1"><i class="fas fa-sticky-note me-2"></i> ملاحظات العميل:</strong>
                <p class="mt-1 mb-0 text-muted small italic">${client.notes || 'لا توجد ملاحظات إضافية مسجلة.'}</p>
            </div>
        </div>

        <div class="mt-4 row g-2">
             <div class="col-6">
                <button type="button" class="btn btn-outline-danger w-100 rounded-pill" onclick="alert('قريباً: تعديل بيانات العميل')">
                    <i class="fas fa-edit me-1"></i> تعديل
                </button>
             </div>
             <div class="col-6">
                <button type="button" class="btn btn-secondary w-100 rounded-pill" data-bs-dismiss="modal">إغلاق</button>
             </div>
        </div>
    `;
    
    // تشغيل المودال
    const modalElement = document.getElementById('detailsModal');
    const myModal = new bootstrap.Modal(modalElement);
    myModal.show();
}

/**
 * نظام البحث السريع في الجدول (Filter)
 */
function initTableSearch() {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;

    // التأكد من عدم تكرار حقل البحث
    if (document.getElementById('tableSearch')) return;

    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'p-3 bg-white border-bottom';
    searchWrapper.innerHTML = `
        <div class="position-relative">
            <i class="fas fa-search position-absolute top-50 translate-middle-y ms-3 text-muted"></i>
            <input type="text" id="tableSearch" 
                   class="form-control shadow-sm border-0 ps-5" 
                   placeholder="ابحث بالاسم، الرقم، أو السيارة..." 
                   style="border-radius: 12px; background: #f8f9fa;">
        </div>
    `;
    
    tableContainer.insertBefore(searchWrapper, tableContainer.firstChild);
    
    const searchInput = document.getElementById('tableSearch');
    
    searchInput.addEventListener('keyup', function() {
        const value = this.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(value) ? '' : 'none';
        });
    });
}