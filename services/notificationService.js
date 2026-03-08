const LogModel = require('../models/logModel');

const NotificationService = {
    notify: async (userId, title, message) => {
        try {
            await LogModel.createNotification({ user_id: userId, title, message });
        } catch (err) {
            console.error('Notification error:', err.message);
        }
    },
    logActivity: async (userId, module, action, description) => {
        try {
            await LogModel.createLog({ user_id: userId, module, action, description });
        } catch (err) {
            console.error('Activity log error:', err.message);
        }
    }
};

module.exports = NotificationService;
