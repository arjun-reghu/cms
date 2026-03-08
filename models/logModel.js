const db = require('../config/db');

const LogModel = {
    // Activity Logs
    createLog: async (data) => {
        const [result] = await db.query(
            `INSERT INTO activity_logs (user_id, module, action, description) VALUES (?, ?, ?, ?)`,
            [data.user_id, data.module, data.action, data.description]
        );
        return result;
    },
    getLogs: async (limit = 50) => {
        const [rows] = await db.query(
            `SELECT al.*, u.employee_name FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT ?`, [limit]
        );
        return rows;
    },
    getLogsByModule: async (module) => {
        const [rows] = await db.query(
            `SELECT al.*, u.employee_name FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id WHERE al.module = ? ORDER BY al.created_at DESC`, [module]
        );
        return rows;
    },
    // Notifications
    createNotification: async (data) => {
        const [result] = await db.query(
            `INSERT INTO notifications (user_id, title, message, status) VALUES (?, ?, ?, ?)`,
            [data.user_id, data.title, data.message, 'unread']
        );
        return result;
    },
    getNotifications: async (userId) => {
        const [rows] = await db.query(
            `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, [userId]
        );
        return rows;
    },
    getUnreadCount: async (userId) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status = 'unread'`, [userId]
        );
        return rows[0].count;
    },
    markRead: async (id) => {
        await db.query(`UPDATE notifications SET status = 'read' WHERE id = ?`, [id]);
    },
    markAllRead: async (userId) => {
        await db.query(`UPDATE notifications SET status = 'read' WHERE user_id = ?`, [userId]);
    }
};

module.exports = LogModel;
