const db = require('../config/db');

const AgreementModel = {
    findAll: async () => {
        const [rows] = await db.query(
            `SELECT ag.*, b.branch_name FROM agreements ag LEFT JOIN branches b ON ag.branch_code = b.branch_code ORDER BY ag.end_date`
        );
        return rows;
    },
    findById: async (id) => {
        const [rows] = await db.query(
            `SELECT ag.*, b.branch_name FROM agreements ag LEFT JOIN branches b ON ag.branch_code = b.branch_code WHERE ag.id = ?`, [id]
        );
        return rows[0];
    },
    findExpiring: async (days = 30) => {
        const [rows] = await db.query(
            `SELECT ag.*, b.branch_name FROM agreements ag LEFT JOIN branches b ON ag.branch_code = b.branch_code
             WHERE ag.status = 'active' AND ag.end_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND ag.end_date >= CURDATE()
             ORDER BY ag.end_date`, [days]
        );
        return rows;
    },
    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO agreements (branch_code, agreement_type, vendor, start_date, end_date, billing_account, circuit_id, amount, status, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.branch_code, data.agreement_type, data.vendor, data.start_date, data.end_date, data.billing_account, data.circuit_id, data.amount, data.status || 'active', data.remarks]
        );
        return result;
    },
    update: async (id, data) => {
        const [result] = await db.query(
            `UPDATE agreements SET branch_code = ?, agreement_type = ?, vendor = ?, start_date = ?, end_date = ?, billing_account = ?, circuit_id = ?, amount = ?, status = ?, remarks = ? WHERE id = ?`,
            [data.branch_code, data.agreement_type, data.vendor, data.start_date, data.end_date, data.billing_account, data.circuit_id, data.amount, data.status, data.remarks, id]
        );
        return result;
    },
    delete: async (id) => {
        const [result] = await db.query(`DELETE FROM agreements WHERE id = ?`, [id]);
        return result;
    },
    getCount: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM agreements WHERE status = 'active'`);
        return rows[0].count;
    },
    getExpiringCount: async (days = 30) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM agreements WHERE status = 'active' AND end_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND end_date >= CURDATE()`, [days]
        );
        return rows[0].count;
    }
};

module.exports = AgreementModel;
