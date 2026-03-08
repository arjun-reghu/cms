const express = require('express');
const router = express.Router();
const techCtrl = require('../controllers/technicianController');
const { isAuthenticated, authorizeRole } = require('../middleware/authMiddleware');

router.use(isAuthenticated, authorizeRole(3));

router.get('/dashboard', techCtrl.dashboard);
router.get('/branches', techCtrl.branches);
router.post('/branches/update/:id', techCtrl.updateBranch);
router.get('/employees', techCtrl.employees);
router.post('/employees/update/:id', techCtrl.updateEmployee);
router.get('/assets', techCtrl.assets);
router.post('/assets', techCtrl.createAsset);
router.post('/assets/update/:id', techCtrl.updateAsset);
router.post('/assets/delete/:id', techCtrl.deleteAsset);
router.post('/assets/assign', techCtrl.assignAsset);
router.post('/assets/transfer', techCtrl.transferAsset);
router.post('/assets/item', techCtrl.createItem);
router.post('/assets/make', techCtrl.createMake);
router.post('/assets/model', techCtrl.createModel);
router.get('/assistance/tickets', techCtrl.tickets);
router.post('/assistance/tickets/process', techCtrl.processTicket);
router.get('/assistance/history', techCtrl.ticketHistory);

module.exports = router;
