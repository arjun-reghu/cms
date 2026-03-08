const db = require('../config/db');

const BranchModel = {
    findAll: async () => {
        const [rows] = await db.query(`SELECT * FROM branches ORDER BY branch_code`);
        return rows;
    },
    findActive: async () => {
        const [rows] = await db.query(`SELECT * FROM branches WHERE status = 'active' ORDER BY branch_code`);
        return rows;
    },
    findById: async (id) => {
        const [rows] = await db.query(`SELECT * FROM branches WHERE id = ?`, [id]);
        return rows[0];
    },
    findByCode: async (code) => {
        const [rows] = await db.query(`SELECT * FROM branches WHERE branch_code = ?`, [code]);
        return rows[0];
    },
    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO branches (channel_code, branch_code, branch_name, address, pincode, contact_number, isp, ip_address, circuit_id, billing_account, isp_lc, branch_opening_date, agreement_start_date, agreement_end_date, internet_activated_date, disconnected_date, kseb_consumer_no, updates, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.channel_code, data.branch_code, data.branch_name, data.address, data.pincode, data.contact_number, data.isp, data.ip_address, data.circuit_id, data.billing_account, data.isp_lc, data.branch_opening_date || null, data.agreement_start_date || null, data.agreement_end_date || null, data.internet_activated_date || null, data.disconnected_date || null, data.kseb_consumer_no, data.updates, data.status || 'active']
        );
        return result;
    },
    update: async (id, data) => {
        const [result] = await db.query(
            `UPDATE branches SET channel_code = ?, branch_name = ?, address = ?, pincode = ?, contact_number = ?, isp = ?, ip_address = ?, circuit_id = ?, billing_account = ?, isp_lc = ?, branch_opening_date = ?, agreement_start_date = ?, agreement_end_date = ?, internet_activated_date = ?, disconnected_date = ?, kseb_consumer_no = ?, updates = ?, status = ? WHERE id = ?`,
            [data.channel_code, data.branch_name, data.address, data.pincode, data.contact_number, data.isp, data.ip_address, data.circuit_id, data.billing_account, data.isp_lc, data.branch_opening_date || null, data.agreement_start_date || null, data.agreement_end_date || null, data.internet_activated_date || null, data.disconnected_date || null, data.kseb_consumer_no, data.updates, data.status, id]
        );
        return result;
    },
    delete: async (id) => {
        const [result] = await db.query(`DELETE FROM branches WHERE id = ?`, [id]);
        return result;
    },
    getCount: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM branches WHERE status = 'active'`);
        return rows[0].count;
    }
};

module.exports = BranchModel;
