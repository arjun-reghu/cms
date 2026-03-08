const express = require('express');
const router = express.Router();
const atCtrl = require('../controllers/adminTeamController');
const { isAuthenticated, authorizeRole } = require('../middleware/authMiddleware');

router.use(isAuthenticated, authorizeRole(5));

router.get('/dashboard', atCtrl.dashboard);
router.get('/branches', atCtrl.branches);
router.post('/branches/update/:id', atCtrl.updateBranch);
router.get('/assets', atCtrl.assets);
router.post('/assets', atCtrl.createAsset);
router.post('/assets/update/:id', atCtrl.updateAsset);
router.post('/assets/delete/:id', atCtrl.deleteAsset);
router.post('/assets/transfer', atCtrl.transferAsset);
router.get('/agreements', atCtrl.agreements);
router.post('/agreements', atCtrl.createAgreement);
router.post('/agreements/update/:id', atCtrl.updateAgreement);
router.post('/agreements/delete/:id', atCtrl.deleteAgreement);

module.exports = router;
