const db = require('../config/db');

const AssetModel = {
    // ===== ASSETS =====
    findAll: async () => {
        const [rows] = await db.query(
            `SELECT a.*, i.item_name, i.item_code, i.category_id, m.make_name, mo.model_name, b.branch_name, b.channel_code,
             c.category_name, c.category_code
             FROM assets a
             LEFT JOIN items i ON a.item_id = i.id
             LEFT JOIN categories c ON i.category_id = c.id
             LEFT JOIN makes m ON a.make_id = m.id
             LEFT JOIN models mo ON a.model_id = mo.id
             LEFT JOIN branches b ON a.branch_code = b.branch_code
             ORDER BY a.created_at DESC`
        );
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(
            `SELECT a.*, i.item_name, i.item_code, m.make_name, mo.model_name
             FROM assets a
             LEFT JOIN items i ON a.item_id = i.id
             LEFT JOIN makes m ON a.make_id = m.id
             LEFT JOIN models mo ON a.model_id = mo.id
             WHERE a.id = ?`, [id]
        );
        return rows[0];
    },

    findFiltered: async (filters) => {
        let sql = `SELECT a.*, i.item_name, i.item_code, i.category_id, m.make_name, mo.model_name, b.branch_name, b.channel_code,
                    c.category_name, c.category_code
                    FROM assets a
                    LEFT JOIN items i ON a.item_id = i.id
                    LEFT JOIN categories c ON i.category_id = c.id
                    LEFT JOIN makes m ON a.make_id = m.id
                    LEFT JOIN models mo ON a.model_id = mo.id
                    LEFT JOIN branches b ON a.branch_code = b.branch_code WHERE 1=1`;
        const params = [];
        if (filters.channel_code) { sql += ' AND b.channel_code = ?'; params.push(filters.channel_code); }
        if (filters.branch_code) { sql += ' AND a.branch_code = ?'; params.push(filters.branch_code); }
        if (filters.category_id) { sql += ' AND i.category_id = ?'; params.push(filters.category_id); }
        if (filters.item_id) { sql += ' AND a.item_id = ?'; params.push(filters.item_id); }
        if (filters.make_id) { sql += ' AND a.make_id = ?'; params.push(filters.make_id); }
        if (filters.status) { sql += ' AND a.status = ?'; params.push(filters.status); }
        if (filters.asset_type) { sql += ' AND a.asset_type = ?'; params.push(filters.asset_type); }
        sql += ' ORDER BY a.created_at DESC';
        const [rows] = await db.query(sql, params);
        return rows;
    },

    getCount: async () => {
        const [rows] = await db.query('SELECT COUNT(*) as count FROM assets');
        return rows[0].count;
    },

    getCountByCategory: async () => {
        const [rows] = await db.query(
            `SELECT c.category_name, c.category_code, c.asset_type, i.item_name, i.item_code,
             COUNT(a.id) as total_count
             FROM categories c
             LEFT JOIN items i ON i.category_id = c.id
             LEFT JOIN assets a ON a.item_id = i.id
             GROUP BY c.id, c.category_name, c.category_code, c.asset_type, i.id, i.item_name, i.item_code
             HAVING COUNT(a.id) > 0
             ORDER BY c.asset_type, c.category_name, i.item_name`
        );
        return rows;
    },

    getCategorySummary: async () => {
        const [rows] = await db.query(
            `SELECT c.category_name, c.category_code, c.asset_type, COUNT(a.id) as total_count
             FROM categories c
             LEFT JOIN items i ON i.category_id = c.id
             LEFT JOIN assets a ON a.item_id = i.id
             GROUP BY c.id, c.category_name, c.category_code, c.asset_type
             ORDER BY c.asset_type, c.category_name`
        );
        return rows;
    },

    create: async (data) => {
        const [result] = await db.query(
            `INSERT INTO assets (asset_code, branch_code, item_id, make_id, model_id, serial_number, count, asset_type, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.asset_code, data.branch_code || null, data.item_id || null, data.make_id || null,
            data.model_id || null, data.serial_number || null, data.count || 1, data.asset_type, data.status || 'stock']
        );
        return result;
    },

    update: async (id, data) => {
        await db.query(
            `UPDATE assets SET branch_code=?, item_id=?, make_id=?, model_id=?, serial_number=?, count=?, asset_type=?, status=? WHERE id=?`,
            [data.branch_code || null, data.item_id || null, data.make_id || null,
            data.model_id || null, data.serial_number || null, data.count || 1, data.asset_type, data.status, id]
        );
    },

    delete: async (id) => {
        await db.query('DELETE FROM assets WHERE id = ?', [id]);
    },

    // ===== CATEGORIES =====
    getCategories: async () => {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY asset_type, category_name');
        return rows;
    },

    createCategory: async (data) => {
        await db.query(
            'INSERT INTO categories (category_name, category_code, asset_type) VALUES (?, ?, ?)',
            [data.category_name, data.category_code, data.asset_type]
        );
    },

    // ===== ITEMS (Subcategories) =====
    getItems: async () => {
        const [rows] = await db.query(
            `SELECT i.*, c.category_name, c.category_code 
             FROM items i 
             LEFT JOIN categories c ON i.category_id = c.id
             ORDER BY i.asset_type, c.category_name, i.item_name`
        );
        return rows;
    },

    createItem: async (data) => {
        // Auto-generate item_code from category code + sequential number
        let itemCode = data.item_code;
        if (data.category_id && !data.item_code) {
            const [cat] = await db.query('SELECT category_code FROM categories WHERE id = ?', [data.category_id]);
            if (cat.length > 0) {
                const catCode = cat[0].category_code;
                const [existing] = await db.query(
                    'SELECT COUNT(*) as cnt FROM items WHERE category_id = ?', [data.category_id]
                );
                const nextNum = (existing[0].cnt + 1).toString().padStart(4, '0');
                itemCode = catCode + nextNum;
            }
        }
        await db.query(
            'INSERT INTO items (item_name, item_code, category_id, asset_type) VALUES (?, ?, ?, ?)',
            [data.item_name, itemCode, data.category_id || null, data.asset_type]
        );
    },

    // ===== MAKES =====
    getMakes: async () => {
        const [rows] = await db.query('SELECT * FROM makes ORDER BY make_name');
        return rows;
    },

    createMake: async (name) => {
        await db.query('INSERT INTO makes (make_name) VALUES (?)', [name]);
    },

    // ===== MODELS =====
    getModels: async () => {
        const [rows] = await db.query(
            `SELECT mo.*, m.make_name FROM models mo JOIN makes m ON mo.make_id = m.id ORDER BY m.make_name, mo.model_name`
        );
        return rows;
    },

    createModel: async (data) => {
        await db.query('INSERT INTO models (make_id, model_name) VALUES (?, ?)', [data.make_id, data.model_name]);
    },

    // ===== ASSET HISTORY =====
    getHistory: async (assetId) => {
        const [rows] = await db.query(
            `SELECT ah.*, e.employee_name FROM asset_history ah
             LEFT JOIN employees e ON ah.employee_code = e.employee_code
             WHERE ah.asset_id = ? ORDER BY ah.assigned_date DESC`, [assetId]
        );
        return rows;
    },

    assignAsset: async (data) => {
        await db.query(
            'INSERT INTO asset_history (asset_id, employee_code, assigned_date, remarks) VALUES (?, ?, ?, ?)',
            [data.asset_id, data.employee_code, data.assigned_date, data.remarks]
        );
        await db.query('UPDATE assets SET status = ? WHERE id = ?', ['assigned', data.asset_id]);
    },

    // ===== TRANSFERS =====
    transferAsset: async (data) => {
        await db.query(
            `INSERT INTO asset_transfer_history (asset_id, from_branch, to_branch, transferred_by, transfer_date, remarks)
             VALUES (?, ?, ?, ?, CURDATE(), ?)`,
            [data.asset_id, data.from_branch, data.to_branch, data.transferred_by, data.remarks]
        );
        await db.query('UPDATE assets SET branch_code = ? WHERE id = ?', [data.to_branch, data.asset_id]);
    },

    getTransferHistory: async (assetId) => {
        const [rows] = await db.query(
            'SELECT * FROM asset_transfer_history WHERE asset_id = ? ORDER BY transfer_date DESC', [assetId]
        );
        return rows;
    },

    // Get all stock (available) assets
    findStock: async () => {
        const [rows] = await db.query(
            `SELECT a.id, a.asset_code, a.serial_number, a.branch_code, a.asset_type,
             i.item_name, i.item_code, m.make_name, mo.model_name, b.branch_name
             FROM assets a
             LEFT JOIN items i ON a.item_id = i.id
             LEFT JOIN makes m ON a.make_id = m.id
             LEFT JOIN models mo ON a.model_id = mo.id
             LEFT JOIN branches b ON a.branch_code = b.branch_code
             WHERE a.status = 'stock'
             ORDER BY i.item_name, a.asset_code`
        );
        return rows;
    },

    // Get all assigned assets grouped by employee
    getAssignedByEmployee: async () => {
        const [rows] = await db.query(
            `SELECT ah.employee_code, a.asset_code, a.serial_number
             FROM asset_history ah
             JOIN assets a ON ah.asset_id = a.id
             WHERE a.status = 'assigned'
             ORDER BY ah.employee_code, a.asset_code`
        );
        return rows;
    }
};

module.exports = AssetModel;
