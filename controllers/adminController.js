const BranchModel = require('../models/branchModel');
const EmployeeModel = require('../models/employeeModel');
const AssetModel = require('../models/assetModel');
const UserModel = require('../models/userModel');
const TicketModel = require('../models/ticketModel');
const AgreementModel = require('../models/agreementModel');
const LogModel = require('../models/logModel');
const NotificationService = require('../services/notificationService');
const PdfService = require('../services/pdfService');
const ExcelService = require('../services/excelService');
const AssetCodeGenerator = require('../services/assetCodeGenerator');
const bcrypt = require('bcryptjs');

module.exports = {
    // ===== DASHBOARD =====
    dashboard: async (req, res) => {
        try {
            const [branchCount, assetCount, employeeCount, emailCount, adCount, openTickets, expiringAgreements] = await Promise.all([
                BranchModel.getCount(), AssetModel.getCount(), EmployeeModel.getCount(),
                EmployeeModel.getEmailCount(), EmployeeModel.getADCount(),
                TicketModel.getOpenCount(), AgreementModel.getExpiringCount()
            ]);
            res.render('admin/dashboard', {
                title: 'Admin Dashboard - CMS', currentPage: 'dashboard',
                branchCount, assetCount, employeeCount, emailCount, adCount, openTickets, expiringAgreements
            });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },

    // ===== BRANCHES =====
    branches: async (req, res) => {
        try {
            const branches = await BranchModel.findAll();
            res.render('admin/branches', { title: 'Branches - CMS', currentPage: 'branches', branches, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    createBranch: async (req, res) => {
        try {
            await BranchModel.create(req.body);
            await NotificationService.logActivity(req.session.user.id, 'Branches', 'Create', `Created branch ${req.body.branch_code}`);
            res.redirect('/admin/branches?success=Branch created successfully');
        } catch (err) { console.error(err); res.redirect('/admin/branches?error=' + encodeURIComponent(err.message)); }
    },
    updateBranch: async (req, res) => {
        try {
            await BranchModel.update(req.params.id, req.body);
            await NotificationService.logActivity(req.session.user.id, 'Branches', 'Update', `Updated branch ID ${req.params.id}`);
            res.redirect('/admin/branches?success=Branch updated successfully');
        } catch (err) { console.error(err); res.redirect('/admin/branches?error=' + encodeURIComponent(err.message)); }
    },
    deleteBranch: async (req, res) => {
        try {
            await BranchModel.delete(req.params.id);
            await NotificationService.logActivity(req.session.user.id, 'Branches', 'Delete', `Deleted branch ID ${req.params.id}`);
            res.redirect('/admin/branches?success=Branch deleted successfully');
        } catch (err) { console.error(err); res.redirect('/admin/branches?error=' + encodeURIComponent(err.message)); }
    },

    // ===== EMPLOYEES =====
    employees: async (req, res) => {
        try {
            const employees = await EmployeeModel.findAll();
            const branches = await BranchModel.findActive();
            const assignedAssets = await AssetModel.getAssignedByEmployee();
            // Build a map: employee_code -> { codes: [...], serials: [...] }
            const employeeAssetsMap = {};
            assignedAssets.forEach(row => {
                if (!employeeAssetsMap[row.employee_code]) {
                    employeeAssetsMap[row.employee_code] = { codes: [], serials: [] };
                }
                employeeAssetsMap[row.employee_code].codes.push(row.asset_code);
                if (row.serial_number) {
                    employeeAssetsMap[row.employee_code].serials.push(row.serial_number);
                }
            });
            res.render('admin/employees', { title: 'Employees - CMS', currentPage: 'employees', employees, branches, employeeAssetsMap, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    createEmployee: async (req, res) => {
        try {
            await EmployeeModel.create(req.body);
            await NotificationService.logActivity(req.session.user.id, 'Employees', 'Create', `Created employee ${req.body.employee_code}`);
            res.redirect('/admin/employees?success=Employee created successfully');
        } catch (err) { console.error(err); res.redirect('/admin/employees?error=' + encodeURIComponent(err.message)); }
    },
    updateEmployee: async (req, res) => {
        try {
            await EmployeeModel.update(req.params.id, req.body);
            await NotificationService.logActivity(req.session.user.id, 'Employees', 'Update', `Updated employee ID ${req.params.id}`);
            res.redirect('/admin/employees?success=Employee updated successfully');
        } catch (err) { console.error(err); res.redirect('/admin/employees?error=' + encodeURIComponent(err.message)); }
    },
    deleteEmployee: async (req, res) => {
        try {
            await EmployeeModel.delete(req.params.id);
            await NotificationService.logActivity(req.session.user.id, 'Employees', 'Delete', `Deleted employee ID ${req.params.id}`);
            res.redirect('/admin/employees?success=Employee deleted successfully');
        } catch (err) { console.error(err); res.redirect('/admin/employees?error=' + encodeURIComponent(err.message)); }
    },

    // ===== ASSETS =====
    assets: async (req, res) => {
        try {
            const view = req.query.view || 'dashboard';
            const assets = await AssetModel.findAll();
            const items = await AssetModel.getItems();
            const makes = await AssetModel.getMakes();
            const models = await AssetModel.getModels();
            const branches = await BranchModel.findActive();
            const employees = await EmployeeModel.findActive();
            const categories = await AssetModel.getCategories();
            let categoryCounts = [];
            let categorySummary = [];
            if (view === 'dashboard') {
                categoryCounts = await AssetModel.getCountByCategory();
                categorySummary = await AssetModel.getCategorySummary();
            }
            res.render('admin/assets', {
                title: 'Assets - CMS',
                currentPage: view === 'catalogue' ? 'asset-catalogue' : view === 'employee' ? 'employee-assets' : view === 'stock' ? 'stock' : view === 'dashboard' ? 'asset-dashboard' : 'branch-assets',
                assets, items, makes, models, branches, employees, categories, categoryCounts, categorySummary, view,
                success: req.query.success, error: req.query.error
            });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    createAsset: async (req, res) => {
        try {
            // Auto-generate asset code if not manually specified
            if (!req.body.asset_code || req.body.asset_code === 'auto') {
                // Get item info for code generation
                const items = await AssetModel.getItems();
                const item = items.find(i => i.id == req.body.item_id);
                const branches = await BranchModel.findAll();
                const branch = branches.find(b => b.branch_code === req.body.branch_code);
                const codeData = {
                    item_code: item ? item.item_code : '',
                    serial_number: req.body.serial_number,
                    branch_code: req.body.branch_code,
                    channel_code: branch ? branch.channel_code : 'HO',
                    asset_type: req.body.asset_type,
                    count: req.body.count
                };
                req.body.asset_code = await AssetCodeGenerator.generate(codeData);
            }
            await AssetModel.create(req.body);
            await NotificationService.logActivity(req.session.user.id, 'Assets', 'Create', `Created asset ${req.body.asset_code}`);
            res.redirect('/admin/assets?view=branch&success=Asset created successfully');
        } catch (err) { console.error(err); res.redirect('/admin/assets?error=' + encodeURIComponent(err.message)); }
    },
    updateAsset: async (req, res) => {
        try {
            await AssetModel.update(req.params.id, req.body);
            await NotificationService.logActivity(req.session.user.id, 'Assets', 'Update', `Updated asset ID ${req.params.id}`);
            res.redirect('/admin/assets?success=Asset updated successfully');
        } catch (err) { console.error(err); res.redirect('/admin/assets?error=' + encodeURIComponent(err.message)); }
    },
    deleteAsset: async (req, res) => {
        try {
            await AssetModel.delete(req.params.id);
            await NotificationService.logActivity(req.session.user.id, 'Assets', 'Delete', `Deleted asset ID ${req.params.id}`);
            res.redirect('/admin/assets?success=Asset deleted successfully');
        } catch (err) { console.error(err); res.redirect('/admin/assets?error=' + encodeURIComponent(err.message)); }
    },
    createCategory: async (req, res) => {
        try {
            await AssetModel.createCategory(req.body);
            res.redirect('/admin/assets?view=catalogue&success=Category created successfully');
        } catch (err) { res.redirect('/admin/assets?view=catalogue&error=' + encodeURIComponent(err.message)); }
    },
    createItem: async (req, res) => {
        try {
            await AssetModel.createItem(req.body);
            res.redirect('/admin/assets?view=catalogue&success=Subcategory created successfully');
        } catch (err) { res.redirect('/admin/assets?view=catalogue&error=' + encodeURIComponent(err.message)); }
    },
    createMake: async (req, res) => {
        try {
            await AssetModel.createMake(req.body.make_name);
            res.redirect('/admin/assets?view=catalogue&success=Make created successfully');
        } catch (err) { res.redirect('/admin/assets?view=catalogue&error=' + encodeURIComponent(err.message)); }
    },
    createModel: async (req, res) => {
        try {
            await AssetModel.createModel(req.body);
            res.redirect('/admin/assets?view=catalogue&success=Model created successfully');
        } catch (err) { res.redirect('/admin/assets?view=catalogue&error=' + encodeURIComponent(err.message)); }
    },
    assignAsset: async (req, res) => {
        try {
            await AssetModel.assignAsset(req.body);
            await NotificationService.logActivity(req.session.user.id, 'Assets', 'Assign', `Assigned asset ${req.body.asset_id} to ${req.body.employee_code}`);
            res.redirect('/admin/assets?view=employee&success=Asset assigned successfully');
        } catch (err) { res.redirect('/admin/assets?view=employee&error=' + encodeURIComponent(err.message)); }
    },
    transferAsset: async (req, res) => {
        try {
            req.body.transferred_by = req.session.user.employee_name;
            await AssetModel.transferAsset(req.body);
            await NotificationService.logActivity(req.session.user.id, 'Assets', 'Transfer', `Transferred asset ${req.body.asset_id} from ${req.body.from_branch} to ${req.body.to_branch}`);
            res.redirect('/admin/assets?success=Asset transferred successfully');
        } catch (err) { res.redirect('/admin/assets?error=' + encodeURIComponent(err.message)); }
    },

    // ===== USERS =====
    users: async (req, res) => {
        try {
            const users = await UserModel.findAll();
            const roles = await UserModel.getRoles();
            res.render('admin/users', { title: 'Users - CMS', currentPage: 'users', users, roles, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    createUser: async (req, res) => {
        try {
            req.body.password = await bcrypt.hash(req.body.password, 10);
            await UserModel.create(req.body);
            await NotificationService.logActivity(req.session.user.id, 'Users', 'Create', `Created user ${req.body.employee_code}`);
            res.redirect('/admin/users?success=User created successfully');
        } catch (err) { console.error(err); res.redirect('/admin/users?error=' + encodeURIComponent(err.message)); }
    },
    updateUser: async (req, res) => {
        try {
            await UserModel.update(req.params.id, req.body);
            if (req.body.password) {
                const hashed = await bcrypt.hash(req.body.password, 10);
                await UserModel.updatePassword(req.params.id, hashed);
            }
            await NotificationService.logActivity(req.session.user.id, 'Users', 'Update', `Updated user ID ${req.params.id}`);
            res.redirect('/admin/users?success=User updated successfully');
        } catch (err) { console.error(err); res.redirect('/admin/users?error=' + encodeURIComponent(err.message)); }
    },
    deleteUser: async (req, res) => {
        try {
            await UserModel.delete(req.params.id);
            await NotificationService.logActivity(req.session.user.id, 'Users', 'Delete', `Deleted user ID ${req.params.id}`);
            res.redirect('/admin/users?success=User deleted successfully');
        } catch (err) { console.error(err); res.redirect('/admin/users?error=' + encodeURIComponent(err.message)); }
    },

    // ===== REPORTS =====
    reports: async (req, res) => {
        try {
            const items = await AssetModel.getItems();
            const makes = await AssetModel.getMakes();
            const models = await AssetModel.getModels();
            const branches = await BranchModel.findActive();
            const categories = await AssetModel.getCategories();
            const assets = await AssetModel.findFiltered(req.query);
            res.render('admin/reports', {
                title: 'Reports - CMS', currentPage: 'reports',
                items, makes, models, branches, categories, assets, filters: req.query
            });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    exportPdf: async (req, res) => {
        try {
            const assets = await AssetModel.findFiltered(req.query);
            PdfService.generateAssetReport(assets, res);
        } catch (err) { console.error(err); res.status(500).send('Export Error'); }
    },
    exportExcel: async (req, res) => {
        try {
            const assets = await AssetModel.findFiltered(req.query);
            await ExcelService.generateAssetReport(assets, res);
        } catch (err) { console.error(err); res.status(500).send('Export Error'); }
    },

    // ===== ASSISTANCE =====
    tickets: async (req, res) => {
        try {
            const tickets = await TicketModel.findOpen();
            const employees = await EmployeeModel.findActive();
            const branches = await BranchModel.findActive();
            res.render('admin/assistance/tickets', { title: 'Assistance Tickets - CMS', currentPage: 'tickets', tickets, employees, branches, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    createTicket: async (req, res) => {
        try {
            const { type } = req.body;
            const ticket_code = await TicketModel.generateCode(type);
            const result = await TicketModel.create({
                ticket_code, type,
                created_by: req.session.user.id,
                status: 'open'
            });

            if (type === 'onboarding') {
                // Create the new employee first
                const empData = {
                    employee_code: (req.body.employee_code || '').trim(),
                    employee_name: (req.body.employee_name || '').trim(),
                    designation: (req.body.designation || '').trim(),
                    department: (req.body.department || '').trim(),
                    reporting_to: (req.body.reporting_to || '').trim(),
                    contact_number: (req.body.contact_number || '').trim(),
                    date_of_birth: req.body.date_of_birth || null,
                    branch_code: req.body.branch_code || null,
                    email_status: 'not_created',
                    ad_account_status: 'not_created',
                    status: 'active'
                };
                await EmployeeModel.create(empData);

                // Save ticket detail with all onboarding info
                await TicketModel.addDetail({
                    ticket_id: result.insertId,
                    employee_code: empData.employee_code,
                    employee_name: empData.employee_name,
                    designation: empData.designation,
                    department: empData.department,
                    reporting_to: empData.reporting_to,
                    contact_number: empData.contact_number,
                    date_of_birth: empData.date_of_birth,
                    branch_code: empData.branch_code,
                    email_required: req.body.email_required ? 1 : 0,
                    laptop_required: req.body.laptop_required ? 1 : 0
                });
            } else {
                // Offboarding — just store the employee code (trimmed for Excel paste)
                const empCode = (req.body.employee_code || '').trim();
                await TicketModel.addDetail({
                    ticket_id: result.insertId,
                    employee_code: empCode
                });
            }

            await NotificationService.logActivity(req.session.user.id, 'Assistance', 'Create', `Created ${type} ticket ${ticket_code}`);
            res.redirect('/admin/assistance/tickets?success=Ticket ' + ticket_code + ' created successfully');
        } catch (err) { console.error(err); res.redirect('/admin/assistance/tickets?error=' + encodeURIComponent(err.message)); }
    },
    viewTicket: async (req, res) => {
        try {
            const ticket = await TicketModel.findByCode(req.params.code);
            if (!ticket) return res.redirect('/admin/assistance/tickets?error=Ticket not found');
            const details = await TicketModel.getDetails(ticket.id);
            const branches = await BranchModel.findActive();
            const stockAssets = await AssetModel.findStock();
            res.render('admin/assistance/ticket-detail', {
                title: 'Ticket ' + ticket.ticket_code + ' - CMS', currentPage: 'tickets',
                ticket, details, branches, stockAssets,
                success: req.query.success, error: req.query.error
            });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    processTicket: async (req, res) => {
        try {
            const { ticket_id, ticket_code, status, detail_id, email_id, ad_status, employee_code } = req.body;

            // Update ticket detail if provided
            if (detail_id) {
                await TicketModel.updateDetail(detail_id, {
                    email_id: email_id || null,
                    laptop_serial: req.body.laptop_serial || null,
                    remarks: req.body.remarks || null
                });
            }

            // Update employee email_id if email was provided
            if (email_id && employee_code) {
                const db = require('../config/db');
                await db.query(`UPDATE employees SET email_id = ?, email_status = 'active' WHERE employee_code = ?`, [email_id, employee_code]);
            }

            // Update AD account status if provided
            if (ad_status && employee_code) {
                const db = require('../config/db');
                await db.query(`UPDATE employees SET ad_account_status = ? WHERE employee_code = ?`, [ad_status, employee_code]);
            }

            // Update ticket status
            if (status) {
                await TicketModel.updateStatus(ticket_id, status);
            }

            await NotificationService.logActivity(req.session.user.id, 'Assistance', 'Process', `Processed ticket ${ticket_code || ticket_id}`);
            res.redirect('/admin/assistance/tickets/' + (ticket_code || '') + '?success=Ticket updated successfully');
        } catch (err) { console.error(err); res.redirect('/admin/assistance/tickets?error=' + encodeURIComponent(err.message)); }
    },
    ticketHistory: async (req, res) => {
        try {
            const tickets = await TicketModel.findAll();
            res.render('admin/assistance/history', { title: 'Ticket History - CMS', currentPage: 'history', tickets });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },

    // ===== AGREEMENTS =====
    agreements: async (req, res) => {
        try {
            const agreements = await AgreementModel.findAll();
            const branches = await BranchModel.findActive();
            res.render('admin/agreements', { title: 'Agreements - CMS', currentPage: 'agreements', agreements, branches, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    createAgreement: async (req, res) => {
        try {
            await AgreementModel.create(req.body);
            await NotificationService.logActivity(req.session.user.id, 'Agreements', 'Create', `Created agreement for branch ${req.body.branch_code}`);
            res.redirect('/admin/agreements?success=Agreement created successfully');
        } catch (err) { res.redirect('/admin/agreements?error=' + encodeURIComponent(err.message)); }
    },
    updateAgreement: async (req, res) => {
        try {
            await AgreementModel.update(req.params.id, req.body);
            res.redirect('/admin/agreements?success=Agreement updated successfully');
        } catch (err) { res.redirect('/admin/agreements?error=' + encodeURIComponent(err.message)); }
    },
    deleteAgreement: async (req, res) => {
        try {
            await AgreementModel.delete(req.params.id);
            res.redirect('/admin/agreements?success=Agreement deleted successfully');
        } catch (err) { res.redirect('/admin/agreements?error=' + encodeURIComponent(err.message)); }
    }
};
