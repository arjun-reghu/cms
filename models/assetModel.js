const db = require('../config/db');

const AssetModel = {
    findAll: async () => {
        const [rows] = await db.query(
            `SELECT a.*, i.item_name, i.item_code, mk.make_name, md.model_name, b.branch_name
             FROM assets a
             LEFT JOIN items i ON a.item_id = i.id
             LEFT JOIN makes mk ON a.make_id = mk.id
             LEFT JOIN models md ON a.model_id = md.id
             LEFT JOIN branches b ON a.branch_code = b.branch_code
             ORDER BY a.created_at DESC`
        );
        return rows;
    },
    findByBranch: async (branchCode) => {
        const [rows] = await db.query(
            `SELECT a.*, i.item_name, i.item_code, mk.make_name, md.model_name
             FROM assets a
             LEFT JOIN items i ON a.item_id = i.id
             LEFT JOIN makes mk ON a.make_id = mk.id
             LEFT JOIN models md ON a.model_id = md.id
             WHERE a.branch_code = ? ORDER BY i.item_name`, [branchCode]
        );
        return rows;
    },
    findById: async (id) => {
        const [rows] = await db.query(
            `SELECT a.*, i.item_name, i.item_code, mk.make_name, md.model_name, b.branch_name
             FROM assets a
             LEFT JOIN items i ON a.item_id = i.id
             LEFT JOIN makes mk ON a.make_id = mk.id
             LEFT JOIN models md ON a.model_id = md.id
             LEFT JOIN branches b ON a.branch_code = b.branch_code
             WHERE a.id = ?`, [id]
        );
        return rows[0];
    },
    findByType: async (type) => {
        const [rows] = await db.query(
            `SELECT a.*, i.item_name, i.item_code, mk.make_name, md.model_name, b.branch_name
             FROM assets a
             LEFT JOIN items i ON a.item_id = i.id
             LEFT JOIN makes mk ON a.make_id = mk.id
             LEFT JOIN models md ON a.model_id = md.id
             LEFT JOIN branches b ON a.branch_code = b.branch_code
             WHERE a.asset_type = ? ORDER BY a.created_at DESC`, [type]
        );
        return rows;
    },
    findByStatus: async (status) => {
        const [rows] = await db.query(
            `SELECT a.*, i.item_name, i.item_code, mk.make_name, md.model_name, b.branch_name
             FROM assets a LEFT JOIN items i ON a.item_id = i.id
             LEFT JOIN makes mk ON a.make_id = mk.id LEFT JOIN models md ON a.model_id = md.id
             LEFT JOIN branches b ON a.branch_code = b.branch_code
             WHERE a.status = ? ORDER BY a.created_at DESC`, [status]
        );
        return rows;
    },
    findByEmployee: async (employeeCode) => {
        const [rows] = await db.query(
            `SELECT a.*, i.item_name, mk.make_name, md.model_name, ah.assigned_date
             FROM asset_history ah
             JOIN assets a ON ah.asset_id = a.id
             LEFT JOIN items i ON a.item_id = i.id
             LEFT JOIN makes mk ON a.make_id = mk.id
             LEFT JOIN models md ON a.model_id = md.id
             WHERE ah.employee_code = ? AND ah.returned_date IS NULL`, [employeeCode]
        );
        return rows;
    },
    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO assets (asset_code, branch_code, item_id, make_id, model_id, serial_number, count, asset_type, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.asset_code, data.branch_code, data.item_id, data.make_id, data.model_id || null, data.serial_number, data.count || 1, data.asset_type, data.status || 'stock']
        );
        return result;
    },
    update: async (id, data) => {
        const [result] = await db.query(
            `UPDATE assets SET branch_code = ?, item_id = ?, make_id = ?, model_id = ?, serial_number = ?, count = ?, asset_type = ?, status = ? WHERE id = ?`,
            [data.branch_code, data.item_id, data.make_id, data.model_id || null, data.serial_number, data.count, data.asset_type, data.status, id]
        );
        return result;
    },
    delete: async (id) => {
        const [result] = await db.query(`DELETE FROM assets WHERE id = ?`, [id]);
        return result;
    },
    getCount: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM assets`);
        return rows[0].count;
    },
    getCountByStatus: async (status) => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM assets WHERE status = ?`, [status]);
        return rows[0].count;
    },
    // Items (Catalogue)
    getItems: async () => {
        const [rows] = await db.query(`SELECT * FROM items ORDER BY item_name`);
        return rows;
    },
    getItemsByType: async (type) => {
        const [rows] = await db.query(`SELECT * FROM items WHERE asset_type = ? ORDER BY item_name`, [type]);
        return rows;
    },
    createItem: async (data) => {
        const [result] = await db.query(`INSERT INTO items (item_name, item_code, asset_type) VALUES (?, ?, ?)`, [data.item_name, data.item_code, data.asset_type]);
        return result;
    },
    updateItem: async (id, data) => {
        const [result] = await db.query(`UPDATE items SET item_name = ?, item_code = ?, asset_type = ? WHERE id = ?`, [data.item_name, data.item_code, data.asset_type, id]);
        return result;
    },
    deleteItem: async (id) => {
        const [result] = await db.query(`DELETE FROM items WHERE id = ?`, [id]);
        return result;
    },
    // Makes
    getMakes: async () => {
        const [rows] = await db.query(`SELECT * FROM makes ORDER BY make_name`);
        return rows;
    },
    createMake: async (name) => {
        const [result] = await db.query(`INSERT INTO makes (make_name) VALUES (?)`, [name]);
        return result;
    },
    deleteMake: async (id) => {
        const [result] = await db.query(`DELETE FROM makes WHERE id = ?`, [id]);
        return result;
    },
    // Models
    getModels: async () => {
        const [rows] = await db.query(`SELECT m.*, mk.make_name FROM models m JOIN makes mk ON m.make_id = mk.id ORDER BY mk.make_name, m.model_name`);
        return rows;
    },
    getModelsByMake: async (makeId) => {
        const [rows] = await db.query(`SELECT * FROM models WHERE make_id = ? ORDER BY model_name`, [makeId]);
        return rows;
    },
    createModel: async (data) => {
        const [result] = await db.query(`INSERT INTO models (make_id, model_name) VALUES (?, ?)`, [data.make_id, data.model_name]);
        return result;
    },
    deleteModel: async (id) => {
        const [result] = await db.query(`DELETE FROM models WHERE id = ?`, [id]);
        return result;
    },
    // Asset History
    assignAsset: async (data) => {
        const [result] = await db.query(
            `INSERT INTO asset_history (asset_id, employee_code, assigned_date, remarks) VALUES (?, ?, ?, ?)`,
            [data.asset_id, data.employee_code, data.assigned_date || new Date(), data.remarks]
        );
        await db.query(`UPDATE assets SET status = 'assigned' WHERE id = ?`, [data.asset_id]);
        return result;
    },
    returnAsset: async (historyId, assetId, remarks) => {
        await db.query(`UPDATE asset_history SET returned_date = NOW(), remarks = ? WHERE id = ?`, [remarks, historyId]);
        await db.query(`UPDATE assets SET status = 'stock' WHERE id = ?`, [assetId]);
    },
    getAssetHistory: async (assetId) => {
        const [rows] = await db.query(
            `SELECT ah.*, e.employee_name FROM asset_history ah LEFT JOIN employees e ON ah.employee_code = e.employee_code WHERE ah.asset_id = ? ORDER BY ah.assigned_date DESC`, [assetId]
        );
        return rows;
    },
    // Transfer
    transferAsset: async (data) => {
        await db.query(
            `INSERT INTO asset_transfer_history (asset_id, from_branch, to_branch, transferred_by, transfer_date, remarks) VALUES (?, ?, ?, ?, ?, ?)`,
            [data.asset_id, data.from_branch, data.to_branch, data.transferred_by, data.transfer_date || new Date(), data.remarks]
        );
        await db.query(`UPDATE assets SET branch_code = ? WHERE id = ?`, [data.to_branch, data.asset_id]);
    },
    getTransferHistory: async (assetId) => {
        const [rows] = await db.query(`SELECT * FROM asset_transfer_history WHERE asset_id = ? ORDER BY transfer_date DESC`, [assetId]);
        return rows;
    },
    // Filtered for reports
    findFiltered: async (filters) => {
        let query = `SELECT a.*, i.item_name, i.item_code, mk.make_name, md.model_name, b.branch_name, b.channel_code
             FROM assets a LEFT JOIN items i ON a.item_id = i.id
             LEFT JOIN makes mk ON a.make_id = mk.id LEFT JOIN models md ON a.model_id = md.id
             LEFT JOIN branches b ON a.branch_code = b.branch_code WHERE 1=1`;
        const params = [];
        if (filters.channel_code) { query += ` AND b.channel_code = ?`; params.push(filters.channel_code); }
        if (filters.branch_code) { query += ` AND a.branch_code = ?`; params.push(filters.branch_code); }
        if (filters.asset_type) { query += ` AND a.asset_type = ?`; params.push(filters.asset_type); }
        if (filters.item_id) { query += ` AND a.item_id = ?`; params.push(filters.item_id); }
        if (filters.make_id) { query += ` AND a.make_id = ?`; params.push(filters.make_id); }
        if (filters.model_id) { query += ` AND a.model_id = ?`; params.push(filters.model_id); }
        query += ` ORDER BY a.created_at DESC`;
        const [rows] = await db.query(query, params);
        return rows;
    }
};

module.exports = AssetModel;
