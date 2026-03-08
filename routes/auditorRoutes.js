const express = require('express');
const router = express.Router();
const auditorCtrl = require('../controllers/auditorController');
const { isAuthenticated, authorizeRole } = require('../middleware/authMiddleware');

router.use(isAuthenticated, authorizeRole(4));

router.get('/dashboard', auditorCtrl.dashboard);
router.get('/branches', auditorCtrl.branches);
router.get('/employees', auditorCtrl.employees);
router.get('/assets', auditorCtrl.assets);
router.get('/history', auditorCtrl.history);

module.exports = router;
