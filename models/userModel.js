const db = require('../config/db');

const UserModel = {
    findAll: async () => {
        const [rows] = await db.query(
            `SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC`
        );
        return rows;
    },
    findById: async (id) => {
        const [rows] = await db.query(
            `SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`, [id]
        );
        return rows[0];
    },
    findByEmployeeCode: async (code) => {
        const [rows] = await db.query(
            `SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.employee_code = ?`, [code]
        );
        return rows[0];
    },
    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO users (employee_code, employee_name, department, role_id, password, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [data.employee_code, data.employee_name, data.department, data.role_id, data.password, data.status || 'active']
        );
        return result;
    },
    update: async (id, data) => {
        const [result] = await db.query(
            `UPDATE users SET employee_name = ?, department = ?, role_id = ?, status = ? WHERE id = ?`,
            [data.employee_name, data.department, data.role_id, data.status, id]
        );
        return result;
    },
    updatePassword: async (id, hashedPassword) => {
        const [result] = await db.query(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, id]);
        return result;
    },
    delete: async (id) => {
        const [result] = await db.query(`DELETE FROM users WHERE id = ?`, [id]);
        return result;
    },
    getRoles: async () => {
        const [rows] = await db.query(`SELECT * FROM roles ORDER BY id`);
        return rows;
    },
    getCount: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM users WHERE status = 'active'`);
        return rows[0].count;
    }
};

module.exports = UserModel;
