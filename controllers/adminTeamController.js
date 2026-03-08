const BranchModel = require('../models/branchModel');
const AssetModel = require('../models/assetModel');
const AgreementModel = require('../models/agreementModel');
const NotificationService = require('../services/notificationService');

module.exports = {
    dashboard: async (req, res) => {
        try {
            const [branchCount, nonITCount, expiringCount, expiringAgreements] = await Promise.all([
                BranchModel.getCount(),
                (async () => { const a = await AssetModel.findByType('NON_IT'); return a.length; })(),
                AgreementModel.getExpiringCount(),
                AgreementModel.findExpiring()
            ]);
            res.render('admin-team/dashboard', { title: 'Admin Team Dashboard - CMS', currentPage: 'dashboard', branchCount, nonITCount, expiringCount, expiringAgreements });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    branches: async (req, res) => {
        try {
            const branches = await BranchModel.findAll();
            res.render('admin-team/branches', { title: 'Branches - CMS', currentPage: 'branches', branches, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    updateBranch: async (req, res) => {
        try {
            await BranchModel.update(req.params.id, req.body);
            await NotificationService.logActivity(req.session.user.id, 'Branches', 'Update', `AdminTeam updated branch ID ${req.params.id}`);
            res.redirect('/admin-team/branches?success=Branch updated');
        } catch (err) { res.redirect('/admin-team/branches?error=' + encodeURIComponent(err.message)); }
    },
    assets: async (req, res) => {
        try {
            const assets = await AssetModel.findByType('NON_IT');
            const items = await AssetModel.getItemsByType('NON_IT');
            const makes = await AssetModel.getMakes();
            const models = await AssetModel.getModels();
            const branches = await BranchModel.findActive();
            res.render('admin-team/assets', {
                title: 'Non-IT Assets - CMS', currentPage: 'branch-assets',
                assets, items, makes, models, branches, success: req.query.success, error: req.query.error
            });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    createAsset: async (req, res) => {
        try {
            req.body.asset_type = 'NON_IT';
            await AssetModel.create(req.body);
            await NotificationService.logActivity(req.session.user.id, 'Assets', 'Create', `AdminTeam created non-IT asset ${req.body.asset_code}`);
            res.redirect('/admin-team/assets?success=Asset created');
        } catch (err) { res.redirect('/admin-team/assets?error=' + encodeURIComponent(err.message)); }
    },
    updateAsset: async (req, res) => {
        try { await AssetModel.update(req.params.id, req.body); res.redirect('/admin-team/assets?success=Asset updated'); }
        catch (err) { res.redirect('/admin-team/assets?error=' + encodeURIComponent(err.message)); }
    },
    deleteAsset: async (req, res) => {
        try { await AssetModel.delete(req.params.id); res.redirect('/admin-team/assets?success=Asset deleted'); }
        catch (err) { res.redirect('/admin-team/assets?error=' + encodeURIComponent(err.message)); }
    },
    transferAsset: async (req, res) => {
        try {
            req.body.transferred_by = req.session.user.employee_name;
            await AssetModel.transferAsset(req.body);
            res.redirect('/admin-team/assets?success=Asset transferred');
        } catch (err) { res.redirect('/admin-team/assets?error=' + encodeURIComponent(err.message)); }
    },
    agreements: async (req, res) => {
        try {
            const agreements = await AgreementModel.findAll();
            const branches = await BranchModel.findActive();
            res.render('admin-team/agreements', { title: 'Agreements - CMS', currentPage: 'agreements', agreements, branches, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    createAgreement: async (req, res) => {
        try { await AgreementModel.create(req.body); res.redirect('/admin-team/agreements?success=Agreement created'); }
        catch (err) { res.redirect('/admin-team/agreements?error=' + encodeURIComponent(err.message)); }
    },
    updateAgreement: async (req, res) => {
        try { await AgreementModel.update(req.params.id, req.body); res.redirect('/admin-team/agreements?success=Agreement updated'); }
        catch (err) { res.redirect('/admin-team/agreements?error=' + encodeURIComponent(err.message)); }
    },
    deleteAgreement: async (req, res) => {
        try { await AgreementModel.delete(req.params.id); res.redirect('/admin-team/agreements?success=Agreement deleted'); }
        catch (err) { res.redirect('/admin-team/agreements?error=' + encodeURIComponent(err.message)); }
    }
};
