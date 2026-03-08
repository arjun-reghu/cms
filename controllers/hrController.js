const EmployeeModel = require('../models/employeeModel');
const TicketModel = require('../models/ticketModel');
const BranchModel = require('../models/branchModel');
const NotificationService = require('../services/notificationService');

module.exports = {
    dashboard: async (req, res) => {
        try {
            const [openTickets, closedTickets, employeeCount] = await Promise.all([
                TicketModel.getOpenCount(), TicketModel.getClosedCount(), EmployeeModel.getCount()
            ]);
            res.render('hr/dashboard', { title: 'HR Dashboard - CMS', currentPage: 'dashboard', openTickets, closedTickets, employeeCount });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    employees: async (req, res) => {
        try {
            const employees = await EmployeeModel.findAll();
            res.render('hr/employees', { title: 'Employees - CMS', currentPage: 'employees', employees });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    tickets: async (req, res) => {
        try {
            const tickets = await TicketModel.findOpen();
            const employees = await EmployeeModel.findActive();
            res.render('hr/assistance/tickets', { title: 'Assistance Tickets - CMS', currentPage: 'tickets', tickets, employees, success: req.query.success, error: req.query.error });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    },
    createTicket: async (req, res) => {
        try {
            const ticketCode = await TicketModel.generateCode(req.body.type);
            const ticketData = { ticket_code: ticketCode, type: req.body.type, created_by: req.session.user.id };
            const result = await TicketModel.create(ticketData);
            if (req.body.employee_code) {
                await TicketModel.addDetail({
                    ticket_id: result.insertId, employee_code: req.body.employee_code,
                    email_required: req.body.email_required ? 1 : 0, laptop_required: req.body.laptop_required ? 1 : 0,
                    bag_model: req.body.bag_model, accessories: req.body.accessories, remarks: req.body.remarks
                });
            }
            await NotificationService.logActivity(req.session.user.id, 'Assistance', 'Create', `Created ${req.body.type} ticket ${ticketCode}`);
            res.redirect('/hr/assistance/tickets?success=Ticket created successfully');
        } catch (err) { console.error(err); res.redirect('/hr/assistance/tickets?error=' + encodeURIComponent(err.message)); }
    },
    ticketHistory: async (req, res) => {
        try {
            const tickets = await TicketModel.findAll();
            res.render('hr/assistance/history', { title: 'Ticket History - CMS', currentPage: 'history', tickets });
        } catch (err) { console.error(err); res.status(500).send('Server Error'); }
    }
};
