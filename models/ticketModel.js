const db = require('../config/db');

const TicketModel = {
    findAll: async () => {
        const [rows] = await db.query(
            `SELECT t.*, u.employee_name as created_by_name FROM tickets t LEFT JOIN users u ON t.created_by = u.id ORDER BY t.created_at DESC`
        );
        return rows;
    },
    findOpen: async () => {
        const [rows] = await db.query(
            `SELECT t.*, u.employee_name as created_by_name FROM tickets t LEFT JOIN users u ON t.created_by = u.id WHERE t.status IN ('open', 'in_progress') ORDER BY t.created_at DESC`
        );
        return rows;
    },
    findById: async (id) => {
        const [rows] = await db.query(
            `SELECT t.*, u.employee_name as created_by_name FROM tickets t LEFT JOIN users u ON t.created_by = u.id WHERE t.id = ?`, [id]
        );
        return rows[0];
    },
    findByCode: async (code) => {
        const [rows] = await db.query(
            `SELECT t.*, u.employee_name as created_by_name FROM tickets t LEFT JOIN users u ON t.created_by = u.id WHERE t.ticket_code = ?`, [code]
        );
        return rows[0];
    },
    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO tickets (ticket_code, type, created_by, status) VALUES (?, ?, ?, ?)`,
            [data.ticket_code, data.type, data.created_by, data.status || 'open']
        );
        return result;
    },
    updateStatus: async (id, status) => {
        if (status === 'closed') {
            const [result] = await db.query(`UPDATE tickets SET status = ?, closed_at = NOW() WHERE id = ?`, [status, id]);
            return result;
        }
        const [result] = await db.query(`UPDATE tickets SET status = ? WHERE id = ?`, [status, id]);
        return result;
    },
    delete: async (id) => {
        const [result] = await db.query(`DELETE FROM tickets WHERE id = ?`, [id]);
        return result;
    },
    // Ticket Details
    getDetails: async (ticketId) => {
        const [rows] = await db.query(
            `SELECT td.*, e.employee_name as emp_name, e.email_id as emp_email, e.email_status as emp_email_status, e.ad_account_status as emp_ad_status
             FROM ticket_details td
             LEFT JOIN employees e ON td.employee_code = e.employee_code
             WHERE td.ticket_id = ?`, [ticketId]
        );
        return rows;
    },
    addDetail: async (data) => {
        const [result] = await db.query(
            `INSERT INTO ticket_details (ticket_id, employee_code, email_required, email_id, laptop_required, laptop_serial, bag_model, accessories, remarks, employee_name, designation, department, reporting_to, contact_number, date_of_birth, branch_code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.ticket_id, data.employee_code, data.email_required || 0, data.email_id || null, data.laptop_required || 0, data.laptop_serial || null, data.bag_model || null, data.accessories || null, data.remarks || null,
            data.employee_name || null, data.designation || null, data.department || null, data.reporting_to || null, data.contact_number || null, data.date_of_birth || null, data.branch_code || null]
        );
        return result;
    },
    updateDetail: async (id, data) => {
        const [result] = await db.query(
            `UPDATE ticket_details SET email_id = ?, laptop_serial = ?, bag_model = ?, accessories = ?, remarks = ? WHERE id = ?`,
            [data.email_id || null, data.laptop_serial || null, data.bag_model || null, data.accessories || null, data.remarks || null, id]
        );
        return result;
    },
    // Counts
    getOpenCount: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM tickets WHERE status IN ('open', 'in_progress')`);
        return rows[0].count;
    },
    getClosedCount: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'`);
        return rows[0].count;
    },
    getOpenByType: async (type) => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM tickets WHERE type = ? AND status IN ('open', 'in_progress')`, [type]);
        return rows[0].count;
    },
    generateCode: async (type) => {
        const prefix = type === 'onboarding' ? 'ONB' : 'OFB';
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM tickets WHERE type = ?`, [type]);
        const num = (rows[0].count + 1).toString().padStart(4, '0');
        return `${prefix}-${num}`;
    }
};

module.exports = TicketModel;
