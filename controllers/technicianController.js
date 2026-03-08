const BranchModel = require('../models/branchModel');
const EmployeeModel = require('../models/employeeModel');
const AssetModel = require('../models/assetModel');
const TicketModel = require('../models/ticketModel');
const NotificationService = require('../services/notificationService');

module.exports = {
    dashboard: async (req, res) => {
        try {
            const [onboardingOpen, offboardingOpen, branchCount, assetCount] = await Promise.all([
                TicketModel.getOpenByType('onboarding'), TicketModel.getOpenByType('offboarding'),
                BranchModel.getCount(), AssetModel.getCount()
            ]);
            res.render('technician/dashboard', { title: 'Technician Dashboard - CMS', currentPage: 'dashboard', onboardingOpen, offboardingOpen, branchCount, assetCount });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    branches: async (req, res) => {
        try {
            const branches = await BranchModel.findAll();
            res.render('technician/branches', { title: 'Branches - CMS', currentPage: 'branches', branches, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    updateBranch: async (req, res) => {
        try {
            await BranchModel.update(req.params.id, req.body);
            await NotificationService.logActivity(req.session.user.id, 'Branches', 'Update', `Technician updated branch ID ${req.params.id}`);
            res.redirect('/technician/branches?success=Branch updated');
        } catch (err) { res.redirect('/technician/branches?error=' + encodeURIComponent(err.message)); }
    },
    employees: async (req, res) => {
        try {
            const employees = await EmployeeModel.findAll();
            const branches = await BranchModel.findActive();
            res.render('technician/employees', { title: 'Employees - CMS', currentPage: 'employees', employees, branches, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    updateEmployee: async (req, res) => {
        try {
            await EmployeeModel.update(req.params.id, req.body);
            await NotificationService.logActivity(req.session.user.id, 'Employees', 'Update', `Technician updated employee ID ${req.params.id}`);
            res.redirect('/technician/employees?success=Employee updated');
        } catch (err) { res.redirect('/technician/employees?error=' + encodeURIComponent(err.message)); }
    },
    assets: async (req, res) => {
        try {
            const view = req.query.view || 'branch';
            const assets = await AssetModel.findAll();
            const items = await AssetModel.getItems();
            const makes = await AssetModel.getMakes();
            const models = await AssetModel.getModels();
            const branches = await BranchModel.findActive();
            const employees = await EmployeeModel.findActive();
            res.render('technician/assets', {
                title: 'Assets - CMS', currentPage: view === 'catalogue' ? 'asset-catalogue' : view === 'employee' ? 'employee-assets' : view === 'stock' ? 'stock' : 'branch-assets',
                assets, items, makes, models, branches, employees, view, success: req.query.success, error: req.query.error
            });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    createAsset: async (req, res) => {
        try {
            await AssetModel.create(req.body);
            await NotificationService.logActivity(req.session.user.id, 'Assets', 'Create', `Technician created asset ${req.body.asset_code}`);
            res.redirect('/technician/assets?success=Asset created');
        } catch (err) { res.redirect('/technician/assets?error=' + encodeURIComponent(err.message)); }
    },
    updateAsset: async (req, res) => {
        try {
            await AssetModel.update(req.params.id, req.body);
            res.redirect('/technician/assets?success=Asset updated');
        } catch (err) { res.redirect('/technician/assets?error=' + encodeURIComponent(err.message)); }
    },
    deleteAsset: async (req, res) => {
        try {
            await AssetModel.delete(req.params.id);
            res.redirect('/technician/assets?success=Asset deleted');
        } catch (err) { res.redirect('/technician/assets?error=' + encodeURIComponent(err.message)); }
    },
    assignAsset: async (req, res) => {
        try {
            await AssetModel.assignAsset(req.body);
            await NotificationService.logActivity(req.session.user.id, 'Assets', 'Assign', `Assigned asset to ${req.body.employee_code}`);
            res.redirect('/technician/assets?view=employee&success=Asset assigned');
        } catch (err) { res.redirect('/technician/assets?view=employee&error=' + encodeURIComponent(err.message)); }
    },
    transferAsset: async (req, res) => {
        try {
            req.body.transferred_by = req.session.user.employee_name;
            await AssetModel.transferAsset(req.body);
            res.redirect('/technician/assets?success=Asset transferred');
        } catch (err) { res.redirect('/technician/assets?error=' + encodeURIComponent(err.message)); }
    },
    createItem: async (req, res) => {
        try { await AssetModel.createItem(req.body); res.redirect('/technician/assets?view=catalogue&success=Item created'); }
        catch (err) { res.redirect('/technician/assets?view=catalogue&error=' + encodeURIComponent(err.message)); }
    },
    createMake: async (req, res) => {
        try { await AssetModel.createMake(req.body.make_name); res.redirect('/technician/assets?view=catalogue&success=Make created'); }
        catch (err) { res.redirect('/technician/assets?view=catalogue&error=' + encodeURIComponent(err.message)); }
    },
    createModel: async (req, res) => {
        try { await AssetModel.createModel(req.body); res.redirect('/technician/assets?view=catalogue&success=Model created'); }
        catch (err) { res.redirect('/technician/assets?view=catalogue&error=' + encodeURIComponent(err.message)); }
    },
    tickets: async (req, res) => {
        try {
            const tickets = await TicketModel.findOpen();
            const employees = await EmployeeModel.findActive();
            const assets = await AssetModel.findAll();
            res.render('technician/assistance/tickets', { title: 'Process Tickets - CMS', currentPage: 'tickets', tickets, employees, assets, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    processTicket: async (req, res) => {
        try {
            const { ticket_id, status, email_id, laptop_serial, bag_model, accessories, remarks, detail_id } = req.body;
            if (detail_id) {
                await TicketModel.updateDetail(detail_id, { email_id, laptop_serial, bag_model, accessories, remarks });
            }
            if (status) { await TicketModel.updateStatus(ticket_id, status); }
            await NotificationService.logActivity(req.session.user.id, 'Assistance', 'Process', `Processed ticket ID ${ticket_id}`);
            res.redirect('/technician/assistance/tickets?success=Ticket processed');
        } catch (err) { res.redirect('/technician/assistance/tickets?error=' + encodeURIComponent(err.message)); }
    },
    ticketHistory: async (req, res) => {
        try {
            const tickets = await TicketModel.findAll();
            res.render('technician/assistance/history', { title: 'Ticket History - CMS', currentPage: 'history', tickets });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    }
};
