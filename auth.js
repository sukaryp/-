const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const EMPLOYEES_DB = path.join(__dirname, 'employees.json');
const readDB = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

// صفحة تسجيل الدخول
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// معالجة بيانات الدخول
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    try {
        const employees = readDB(EMPLOYEES_DB);
        const user = employees.find(emp => emp.username === username && emp.password === password);

        if (user) {
            req.session.user = {
                id: user.id,
                name: user.name,
                role: user.role || 'employee'
            };
            res.redirect('/');
        } else {
            res.render('login', { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
    } catch (err) {
        res.render('login', { error: 'حدث خطأ في النظام' });
    }
});

// تسجيل الخروج
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router;