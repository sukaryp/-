/**
 * نظام السفير - إدارة الموظفين المتطور
 * Developed by: ProCoding (Belal Hesham)
 * Features: View, Edit, Delete, Live Clock
 */

document.addEventListener('DOMContentLoaded', () => {
    initClock();
});

/**
 * تشغيل الساعة الحية بناءً على وقت السيرفر
 */
function initClock() {
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
 * عرض تفاصيل الموظف (View)
 */
function viewEmpDetails(data) {
    const emp = JSON.parse(data);
    const modalHtml = `
        <div class="modal fade" id="empDetailModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 25px; overflow: hidden;">
                    <div class="modal-header bg-dark text-white border-0 p-4">
                        <h5 class="modal-title fw-bold">
                            <i class="fas fa-user-shield me-2 text-danger"></i> ملف الموظف التقني
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="text-center mb-4">
                            <div class="bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm mx-auto mb-3" 
                                 style="width: 100px; height: 100px; border: 3px solid #e74c3c;">
                                <i class="fas fa-user-tie fa-3x text-dark"></i>
                            </div>
                            <h4 class="fw-extrabold text-dark mb-1">${emp.name}</h4>
                            <span class="badge bg-light text-danger border border-danger rounded-pill px-3">
                                <i class="fas fa-fingerprint me-1"></i> الرقم القومي: ${emp.nationalId || 'غير مسجل'}
                            </span>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="p-3 bg-light rounded-4 border-start border-danger border-4">
                                    <label class="small text-muted fw-bold d-block mb-1">اسم المستخدم</label>
                                    <span class="fw-bold text-dark">${emp.username}</span>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="p-3 bg-light rounded-4 border-start border-danger border-4">
                                    <label class="small text-muted fw-bold d-block mb-1">كلمة المرور</label>
                                    <span class="fw-bold text-danger">${emp.password}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 p-4 pt-0">
                        <button type="button" class="btn btn-dark w-100 py-3 fw-bold rounded-4 shadow-sm" data-bs-dismiss="modal">إغلاق</button>
                    </div>
                </div>
            </div>
        </div>`;
    renderAndShowModal('empDetailModal', modalHtml);
}

/**
 * فتح مودال التعديل (Edit)
 */
function editEmpDetails(data) {
    const emp = JSON.parse(data);
    const editModalHtml = `
        <div class="modal fade" id="editEmpModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <form action="/update-employee" method="POST" class="modal-content border-0 shadow-lg" style="border-radius: 25px;">
                    <input type="hidden" name="id" value="${emp.id}">
                    <div class="modal-header bg-danger text-white border-0 p-4">
                        <h5 class="modal-title fw-bold"><i class="fas fa-user-edit me-2"></i> تعديل بيانات الموظف</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="mb-3">
                            <label class="form-label fw-bold small text-muted">الاسم الكامل</label>
                            <input type="text" name="name" class="form-control rounded-3 border-0 bg-light" value="${emp.name}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold small text-muted">اسم المستخدم</label>
                            <input type="text" name="username" class="form-control rounded-3 border-0 bg-light" value="${emp.username}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold small text-danger">كلمة المرور</label>
                            <input type="text" name="password" class="form-control rounded-3 border-danger bg-light" value="${emp.password}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold small text-muted">رقم الموبايل</label>
                            <input type="text" name="workPhone" class="form-control rounded-3 border-0 bg-light" value="${emp.workPhone || ''}">
                        </div>
                    </div>
                    <div class="modal-footer border-0 p-4 pt-0">
                        <button type="submit" class="btn btn-dark w-100 py-3 fw-bold rounded-4 shadow-sm">حفظ التعديلات</button>
                    </div>
                </form>
            </div>
        </div>`;
    renderAndShowModal('editEmpModal', editModalHtml);
}

/**
 * حذف موظف (Delete)
 */
function deleteEmployee(id, name) {
    if (confirm(`هل أنت متأكد من حذف الموظف "${name}" نهائياً؟`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/delete-employee';
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'id';
        input.value = id;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
}

/**
 * دالة مساعدة لتنظيف المودالات وعرضها
 */
function renderAndShowModal(modalId, html) {
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        const instance = bootstrap.Modal.getInstance(existingModal);
        if (instance) instance.dispose();
        existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', html);
    const newModal = new bootstrap.Modal(document.getElementById(modalId));
    newModal.show();
}