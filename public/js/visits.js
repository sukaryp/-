// جوه ملف visits.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/visit-form/:clientId', (req, res) => {
    const clients = JSON.parse(fs.readFileSync(path.join(__dirname, 'clients.json'), 'utf8'));
    const client = clients.find(c => c.id == req.params.clientId);
    if (!client) return res.send("العميل غير موجود");
    res.render('visit_form', { client, serverTime: new Date().toLocaleDateString('ar-EG') });
});

module.exports = router;