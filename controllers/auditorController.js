const BranchModel = require('../models/branchModel');
const EmployeeModel = require('../models/employeeModel');
const AssetModel = require('../models/assetModel');
const LogModel = require('../models/logModel');

module.exports = {
    dashboard: async (req, res) => {
        try {
            const [branchCount, employeeCount, assetCount] = await Promise.all([
                BranchModel.getCount(), EmployeeModel.getCount(), AssetModel.getCount()
            ]);
            const logs = await LogModel.getLogs(10);
            res.render('auditor/dashboard', { title: 'Auditor Dashboard - CMS', currentPage: 'dashboard', branchCount, employeeCount, assetCount, logs });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    branches: async (req, res) => {
        try {
            const branches = await BranchModel.findAll();
            res.render('auditor/branches', { title: 'Branches - CMS', currentPage: 'branches', branches });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    employees: async (req, res) => {
        try {
            const employees = await EmployeeModel.findAll();
            res.render('auditor/employees', { title: 'Employees - CMS', currentPage: 'employees', employees });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    assets: async (req, res) => {
        try {
            const assets = await AssetModel.findAll();
            res.render('auditor/assets', { title: 'Assets - CMS', currentPage: 'branch-assets', assets });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    history: async (req, res) => {
        try {
            const logs = await LogModel.getLogs(100);
            res.render('auditor/history', { title: 'Audit History - CMS', currentPage: 'history', logs });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    }
};
