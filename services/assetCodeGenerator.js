/**
 * Asset Code Generator
 * Two types:
 * 1. Admin (non-IT): channelcode/branchcode/subcategorycode/count
 * 2. IT:             branchcode/subcategorycode/serialnumber/count
 */

const db = require('../config/db');

const AssetCodeGenerator = {
    generate: async (data) => {
        const { item_code, serial_number, branch_code, channel_code, asset_type } = data;

        if (asset_type === 'ADMIN') {
            // Admin assets: channelcode/branchcode/subcategorycode/count
            const count = await AssetCodeGenerator.getNextAdminCount(channel_code, branch_code, item_code);
            const countStr = count.toString().padStart(2, '0');
            return `${channel_code || 'HO'}/${branch_code}/${item_code}/${countStr}`;
        } else {
            // IT assets: branchcode/subcategorycode/serialnumber/count
            if (serial_number) {
                const count = await AssetCodeGenerator.getNextITCount(branch_code, item_code, serial_number);
                return `${branch_code}/${item_code}/${serial_number}/${count}`;
            } else {
                const count = await AssetCodeGenerator.getNextITCountNoSerial(branch_code, item_code);
                const countStr = count.toString().padStart(2, '0');
                return `${branch_code}/${item_code}/${countStr}`;
            }
        }
    },

    getNextITCount: async (branchCode, itemCode, serialNumber) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM assets a
             JOIN items i ON a.item_id = i.id
             WHERE a.branch_code = ? AND i.item_code = ? AND a.serial_number = ?`,
            [branchCode, itemCode, serialNumber]
        );
        return rows[0].count + 1;
    },

    getNextITCountNoSerial: async (branchCode, itemCode) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM assets a
             JOIN items i ON a.item_id = i.id
             WHERE a.branch_code = ? AND i.item_code = ?`,
            [branchCode, itemCode]
        );
        return rows[0].count + 1;
    },

    getNextAdminCount: async (channelCode, branchCode, itemCode) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM assets a
             JOIN items i ON a.item_id = i.id
             JOIN branches b ON a.branch_code = b.branch_code
             WHERE b.channel_code = ? AND a.branch_code = ? AND i.item_code = ?`,
            [channelCode || 'HO', branchCode, itemCode]
        );
        return rows[0].count + 1;
    }
};

module.exports = AssetCodeGenerator;
