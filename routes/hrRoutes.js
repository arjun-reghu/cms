const express = require('express');
const router = express.Router();
const hrCtrl = require('../controllers/hrController');
const { isAuthenticated, authorizeRole } = require('../middleware/authMiddleware');

router.use(isAuthenticated, authorizeRole(2));

router.get('/dashboard', hrCtrl.dashboard);
router.get('/employees', hrCtrl.employees);
router.get('/assistance/tickets', hrCtrl.tickets);
router.post('/assistance/tickets', hrCtrl.createTicket);
router.get('/assistance/history', hrCtrl.ticketHistory);

module.exports = router;
