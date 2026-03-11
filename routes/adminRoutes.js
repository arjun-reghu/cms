const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const { isAuthenticated, authorizeRole } = require('../middleware/authMiddleware');

// All admin routes require auth + Admin role (role_id = 1)
router.use(isAuthenticated, authorizeRole(1));

// Dashboard
router.get('/dashboard', adminCtrl.dashboard);

// Branches
router.get('/branches', adminCtrl.branches);
router.post('/branches', adminCtrl.createBranch);
router.post('/branches/update/:id', adminCtrl.updateBranch);
router.post('/branches/delete/:id', adminCtrl.deleteBranch);

// Employees
router.get('/employees', adminCtrl.employees);
router.post('/employees', adminCtrl.createEmployee);
router.post('/employees/update/:id', adminCtrl.updateEmployee);
router.post('/employees/delete/:id', adminCtrl.deleteEmployee);

// Assets
router.get('/assets', adminCtrl.assets);
router.post('/assets', adminCtrl.createAsset);
router.post('/assets/update/:id', adminCtrl.updateAsset);
router.post('/assets/delete/:id', adminCtrl.deleteAsset);
router.post('/assets/category', adminCtrl.createCategory);
router.post('/assets/item', adminCtrl.createItem);
router.post('/assets/make', adminCtrl.createMake);
router.post('/assets/model', adminCtrl.createModel);
router.post('/assets/assign', adminCtrl.assignAsset);
router.post('/assets/transfer', adminCtrl.transferAsset);

// Users
router.get('/users', adminCtrl.users);
router.post('/users', adminCtrl.createUser);
router.post('/users/update/:id', adminCtrl.updateUser);
router.post('/users/delete/:id', adminCtrl.deleteUser);

// Reports
router.get('/reports', adminCtrl.reports);
router.get('/reports/export/pdf', adminCtrl.exportPdf);
router.get('/reports/export/excel', adminCtrl.exportExcel);

// Assistance
router.get('/assistance/tickets', adminCtrl.tickets);
router.post('/assistance/tickets', adminCtrl.createTicket);
router.get('/assistance/tickets/:code', adminCtrl.viewTicket);
router.post('/assistance/tickets/process', adminCtrl.processTicket);
router.get('/assistance/history', adminCtrl.ticketHistory);

// Agreements
router.get('/agreements', adminCtrl.agreements);
router.post('/agreements', adminCtrl.createAgreement);
router.post('/agreements/update/:id', adminCtrl.updateAgreement);
router.post('/agreements/delete/:id', adminCtrl.deleteAgreement);

module.exports = router;
