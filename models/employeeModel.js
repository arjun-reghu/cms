const db = require('../config/db');

const EmployeeModel = {
    findAll: async () => {
        const [rows] = await db.query(
            `SELECT e.*, b.branch_name FROM employees e LEFT JOIN branches b ON e.branch_code = b.branch_code ORDER BY e.employee_code`
        );
        return rows;
    },
    findActive: async () => {
        const [rows] = await db.query(
            `SELECT e.*, b.branch_name FROM employees e LEFT JOIN branches b ON e.branch_code = b.branch_code WHERE e.status = 'active' ORDER BY e.employee_code`
        );
        return rows;
    },
    findById: async (id) => {
        const [rows] = await db.query(
            `SELECT e.*, b.branch_name FROM employees e LEFT JOIN branches b ON e.branch_code = b.branch_code WHERE e.id = ?`, [id]
        );
        return rows[0];
    },
    findByCode: async (code) => {
        const [rows] = await db.query(
            `SELECT e.*, b.branch_name FROM employees e LEFT JOIN branches b ON e.branch_code = b.branch_code WHERE e.employee_code = ?`, [code]
        );
        return rows[0];
    },
    findByBranch: async (branchCode) => {
        const [rows] = await db.query(
            `SELECT * FROM employees WHERE branch_code = ? ORDER BY employee_name`, [branchCode]
        );
        return rows;
    },
    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO employees (employee_code, employee_name, designation, department, reporting_to, contact_number, date_of_birth, branch_code, email_id, email_status, ad_account_status, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.employee_code, data.employee_name, data.designation, data.department, data.reporting_to, data.contact_number, data.date_of_birth || null, data.branch_code, data.email_id, data.email_status || 'not_created', data.ad_account_status || 'not_created', data.status || 'active']
        );
        return result;
    },
    update: async (id, data) => {
        const [result] = await db.query(
            `UPDATE employees SET employee_name = ?, designation = ?, department = ?, reporting_to = ?, contact_number = ?, date_of_birth = ?, branch_code = ?, email_id = ?, email_status = ?, ad_account_status = ?, status = ? WHERE id = ?`,
            [data.employee_name, data.designation, data.department, data.reporting_to, data.contact_number, data.date_of_birth || null, data.branch_code, data.email_id, data.email_status, data.ad_account_status, data.status, id]
        );
        return result;
    },
    delete: async (id) => {
        const [result] = await db.query(`DELETE FROM employees WHERE id = ?`, [id]);
        return result;
    },
    getCount: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM employees WHERE status = 'active'`);
        return rows[0].count;
    },
    getEmailCount: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM employees WHERE email_status = 'active'`);
        return rows[0].count;
    },
    getADCount: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM employees WHERE ad_account_status = 'active'`);
        return rows[0].count;
    }
};

module.exports = EmployeeModel;
