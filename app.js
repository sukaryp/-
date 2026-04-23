/**
 * نظام السفير لخدمات السيارات - السيرفر الرئيسي المتطور
 * Developed by: ProCoding (Belal Hesham)
 * Version: 2.1 (Full Activity Tracking & History Support)
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = 3000;

// 1. إعدادات قواعد البيانات (JSON Files)
const EMPLOYEES_DB = path.join(__dirname, 'employees.json');
const CLIENTS_DB = path.join(__dirname, 'clients.json');
const VISITS_DB = path.join(__dirname, 'visits.json');

const initDB = (file, initData = []) => {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(initData, null, 2));
};
initDB(EMPLOYEES_DB);
initDB(CLIENTS_DB);
initDB(VISITS_DB);

// 2. إعدادات القوالب والملفات العامة
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// 3. ترتيب الـ Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 4. إعداد الجلسة (Session)
app.use(session({
    secret: 'alsafir-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// تجعل بيانات المستخدم متاحة في كل صفحات الـ EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// 5. استدعاء وتشغيل ملف اللوجن
const authRoutes = require('./auth');
app.use('/', authRoutes);

// 6. ميدل وير حماية باقي السيستم
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// دوال التعامل مع البيانات
const readDB = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const saveDB = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

// --- المسارات المحمية ---

app.get('/', isAuthenticated, (req, res) => {
    const clients = readDB(CLIENTS_DB);
    res.render('index', {
        clients: clients,
        serverTime: new Date().toISOString()
    });
});

// مسار الداشبورد مع الإحصائيات
// مسار الداشبورد المطور للتقارير
app.get('/dashboard', isAuthenticated, (req, res) => {
    const clients = readDB(CLIENTS_DB) || [];
    const employees = readDB(EMPLOYEES_DB) || [];

    // تجميع آخر 10 حركات تمت في السيستم من كل العملاء
    let allActivity = [];
    clients.forEach(c => {
        if (c.NotesHistory) {
            c.NotesHistory.forEach(log => {
                allActivity.push({
                    clientName: c.name,
                    date: log.date,
                    user: log.user,
                    newStatus: log.status,
                    // بنحاول نجيب الحالة القديمة لو متسجلة في النص
                    oldStatus: log.text.includes('إلى') ? log.text.split('[')[1].split(']')[0] : 'غير محدد'
                });
            });
        }
    });

    // ترتيب النشاط من الأحدث للأقدم
    const recentActivity = allActivity.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    const stats = {
        totalClients: clients.length,
        successfulDeals: clients.filter(c => c.Status === 'deals').length,
        statusTransitions: allActivity.length, // إجمالي الحركات
        totalBudget: clients.reduce((sum, c) => sum + (parseInt(c.budget?.toString().replace(/[^0-9]/g, '')) || 0), 0).toLocaleString('ar-EG'),
        recentActivity: recentActivity,
        chartLabels: ['متابعة', 'انتظار', 'تعاقد', 'مرفوض'],
        chartData: [
            clients.filter(c => c.Status === 'followup').length,
            clients.filter(c => c.Status === 'waiting').length,
            clients.filter(c => c.Status === 'deals').length,
            clients.filter(c => c.Status === 'rejected').length
        ],
        employeePerformance: employees.filter(e => e.role === 'sales').map(emp => {
            const myClients = clients.filter(c => c.AssignedTo === emp.name);
            const closed = myClients.filter(c => c.Status === 'deals').length;
            const totalValue = myClients
                .filter(c => c.Status === 'deals')
                .reduce((sum, c) => sum + (parseInt(c.budget?.toString().replace(/[^0-9]/g, '')) || 0), 0);

            return {
                name: emp.name,
                clientsCount: myClients.length,
                closedDeals: closed,
                totalValue: totalValue.toLocaleString('ar-EG'),
                ratio: myClients.length > 0 ? ((closed / myClients.length) * 100).toFixed(0) : 0
            };
        })
    };

    res.render('dashboard', { 
        stats: stats, 
        user: req.session.user 
    });
});
const ExcelJS = require('exceljs');

app.get('/export-deals-excel', isAuthenticated, async (req, res) => {
    try {
        const clients = readDB(CLIENTS_DB);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('تقرير الصفقات');

        // 1. تعريف الأعمدة
        worksheet.columns = [
            { header: 'تاريخ التسجيل', key: 'createdAt', width: 20 },
            { header: 'اسم العميل', key: 'name', width: 25 },
            { header: 'رقم الهاتف', key: 'phone', width: 15 },
            { header: 'الموظف المسئول', key: 'assignedTo', width: 20 },
            { header: 'السيارة', key: 'car', width: 20 },
            { header: 'الميزانية', key: 'budget', width: 15 },
            { header: 'الحالة الحالية', key: 'status', width: 15 },
            { header: 'آخر تحديث', key: 'updatedAt', width: 20 },
            { header: 'سجل الملاحظات والحركات', key: 'history', width: 50 }
        ];

        // 2. إضافة البيانات
        clients.forEach(client => {
            // تحويل سجل الملاحظات لنص واحد عشان الخلية في اكسل
            const historyText = client.NotesHistory ? 
                client.NotesHistory.map(h => `[${h.date}] ${h.user}: ${h.text}`).join(' | ') : '';

            worksheet.addRow({
                createdAt: client.CreatedAt || '',
                name: client.name,
                phone: client.phone,
                assignedTo: client.AssignedTo,
                car: client.car,
                budget: client.budget,
                status: client.Status,
                updatedAt: client.UpdatedAt || '',
                history: historyText
            });
        });

        // 3. تنسيق الهيدر (عشان يبقا شكله شيك)
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC5A059' } // لون جولد السفير
        };

        // 4. إرسال الملف للمتصفح
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=AlSafir-Deals-Report.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        res.status(500).send("خطأ في استخراج الملف: " + err.message);
    }
});
// إدارة الزيارات
app.get('/visits', isAuthenticated, (req, res) => {
    try {
        const employees = readDB(EMPLOYEES_DB);
        res.render('new_visit', {
            serverTime: new Date().toLocaleDateString('ar-EG'),
            employees: employees
        });
    } catch (err) {
        res.send("خطأ في تحميل صفحة الزيارات: " + err.message);
    }
});

app.post('/print-visit', isAuthenticated, (req, res) => {
    try {
        const visits = readDB(VISITS_DB);
        const visitData = {
            id: Date.now(),
            name: req.body.name,
            car: req.body.car,
            source: req.body.source,
            purpose: req.body.purpose,
            assignedTo: req.body.assignedTo,
            date: new Date().toLocaleDateString('ar-EG'),
            time: new Date().toLocaleTimeString('ar-EG')
        };
        visits.push(visitData);
        saveDB(VISITS_DB, visits);
        res.render('visit_form', { client: visitData, serverTime: visitData.date });
    } catch (err) {
        res.status(500).send("خطأ في حفظ الزيارة: " + err.message);
    }
});

// إدارة الموظفين
app.get('/employees', isAuthenticated, (req, res) => {
    try {
        const employees = readDB(EMPLOYEES_DB);
        res.render('employees', {
            serverTime: new Date().toISOString(),
            employees: employees,
            error: null
        });
    } catch (err) {
        res.render('employees', { serverTime: new Date().toISOString(), employees: [], error: "فشل في قراءة بيانات الموظفين" });
    }
});

app.post('/add-employee', isAuthenticated, (req, res) => {
    try {
        const employees = readDB(EMPLOYEES_DB);
        const { name, username, password, role, workPhone, startTime, endTime, workDays, nationalId } = req.body;

        const newEmployee = {
            id: Date.now(),
            name,
            username,
            password,
            role: role || 'sales',
            workPhone,
            startTime,
            endTime,
            workDays,
            nationalId,
            currentClients: 0
        };

        employees.push(newEmployee);
        saveDB(EMPLOYEES_DB, employees);
        res.redirect('/employees');
    } catch (err) {
        res.status(500).send("خطأ في إضافة الموظف: " + err.message);
    }
});

// قائمة الانتظار
app.get('/waiting-list', isAuthenticated, (req, res) => {
    try {
        let allClients = readDB(CLIENTS_DB);
        let waitingClients = allClients.filter(c => c.Status === 'waiting' || !c.Status);
        const employees = readDB(EMPLOYEES_DB);
        const user = req.session.user;

        if (user.role === 'sales') {
            waitingClients = waitingClients.filter(c => c.AssignedTo === user.name);
        }

        res.render('waiting_list', {
            clients: waitingClients,
            employees: employees
        });
    } catch (err) {
        res.status(500).send("خطأ في تحميل قائمة الانتظار: " + err.message);
    }
});

// إضافة عميل جديد مع تسجيل أول حركة في السجل
app.post('/add-client', isAuthenticated, (req, res) => {
    try {
        const { name, phone, assignedTo, carModel, budget } = req.body;
        const clients = readDB(CLIENTS_DB);

        const newClient = {
            id: Date.now(),
            name,
            phone,
            AssignedTo: assignedTo || "غير موزع",
            car: carModel || "غير محدد",
            budget: budget || "0",
            Status: 'waiting',
            reminderDate: null,
            CreatedAt: new Date().toLocaleString('ar-EG'),
            NotesHistory: [
                {
                    text: "تم تسجيل العميل في النظام",
                    date: new Date().toLocaleString('ar-EG'),
                    user: req.session.user.name,
                    status: 'waiting'
                }
            ]
        };

        clients.push(newClient);
        saveDB(CLIENTS_DB, clients);
        res.redirect('/waiting-list');
    } catch (err) {
        res.status(500).send("خطأ في إضافة العميل: " + err.message);
    }
});

// توزيع العميل مع توثيق اسم الموزع
app.post('/assign-client', isAuthenticated, (req, res) => {
    try {
        const { clientId, employeeName } = req.body;
        let clients = readDB(CLIENTS_DB);
        const idx = clients.findIndex(c => c.id.toString() === clientId.toString());

        if (idx !== -1) {
            clients[idx].AssignedTo = employeeName;
            // توثيق عملية التوزيع
            clients[idx].NotesHistory.push({
                text: `تم توزيع العميل على الموظف: ${employeeName}`,
                date: new Date().toLocaleString('ar-EG'),
                user: req.session.user.name,
                status: clients[idx].Status
            });

            saveDB(CLIENTS_DB, clients);
            res.redirect('/waiting-list');
        } else {
            res.status(404).send("العميل غير موجود");
        }
    } catch (err) {
        res.status(500).send("خطأ في التوزيع: " + err.message);
    }
});

// لوحة الصفقات (الكانبان)
app.get('/deals', isAuthenticated, (req, res) => {
    try {
        const user = req.session.user;
        let allClients = readDB(CLIENTS_DB);
        let dealClients = allClients.filter(c => c.Status !== 'waiting');

        if (user.role === 'sales') {
            dealClients = dealClients.filter(c => c.AssignedTo === user.name);
        }

        res.render('deals', {
            clients: dealClients,
            serverTime: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).send("خطأ في تحميل اللوحة: " + err.message);
    }
});

// التحديث المحوري (تتبع النقل بين الحالات والملاحظات)
app.post('/update-client-status', isAuthenticated, (req, res) => {
    try {
        const { clientId, newStatus, employeeNotes, reminderDate } = req.body;
        let clients = readDB(CLIENTS_DB);
        
        const idx = clients.findIndex(c => c.id.toString() === clientId.toString());

        if (idx !== -1) {
            const oldStatus = clients[idx].Status;
            
            // تحديث السجل التاريخي
            if (!clients[idx].NotesHistory) clients[idx].NotesHistory = [];
            
            let actionText = (oldStatus !== newStatus) 
                ? `تغيير الحالة من [${oldStatus}] إلى [${newStatus}]` 
                : "إضافة ملاحظة فنية";

            clients[idx].NotesHistory.push({
                text: employeeNotes || actionText,
                date: new Date().toLocaleString('ar-EG'),
                user: req.session.user.name, // اسم الموظف الحالي
                status: newStatus
            });

            // تحديث البيانات الأساسية
            clients[idx].Status = newStatus;
            clients[idx].reminderDate = reminderDate || clients[idx].reminderDate || null;
            clients[idx].UpdatedAt = new Date().toLocaleString('ar-EG');

            saveDB(CLIENTS_DB, clients);
            res.redirect('/deals');
        } else {
            res.status(404).send("العميل غير موجود");
        }
    } catch (err) {
        res.status(500).send("خطأ في التحديث: " + err.message);
    }
});

// عرض كل العملاء
app.get('/clients', isAuthenticated, (req, res) => {
    try {
        const clients = readDB(CLIENTS_DB);
        const employees = readDB(EMPLOYEES_DB);
        
        res.render('clients', {
            clients: clients,
            employees: employees,
            user: req.session.user,
            serverTime: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).send("خطأ في تحميل صفحة العملاء: " + err.message);
    }
});

// مسارات إدارة الموظفين (حذف وتعديل)
app.post('/delete-employee', isAuthenticated, (req, res) => {
    let employees = readDB(EMPLOYEES_DB);
    employees = employees.filter(e => e.id.toString() !== req.body.id.toString());
    saveDB(EMPLOYEES_DB, employees);
    res.redirect('/employees');
});

app.post('/update-employee', isAuthenticated, (req, res) => {
    const { id, name, username, password, workPhone } = req.body;
    let employees = readDB(EMPLOYEES_DB);
    const idx = employees.findIndex(e => e.id.toString() === id.toString());
    if (idx !== -1) {
        employees[idx] = { ...employees[idx], name, username, password, workPhone };
        saveDB(EMPLOYEES_DB, employees);
    }
    res.redirect('/employees');
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`
    =================================================
    🚀 Alsafir CRM Server v2.1 is Running!
    🔗 URL: http://localhost:${PORT}
    🛠  Developer: Belal Hesham (ProCoding)
    📊 Tracking System: ENABLED
    =================================================
    `);
});