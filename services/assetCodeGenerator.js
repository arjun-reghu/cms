/**
 * Asset Code Generator
 * Three types:
 * 1. IT Personal: Item/Make/SerialNumber (e.g., LAP/Dell/ABC12345)
 * 2. IT Branch:   BranchCode/Item/Make/Serial|Count (e.g., BR001/KBD/Logitech/SN1234)
 * 3. Non-IT:      Channel/Branch/ItemCode/Count (e.g., CH01/BR001/CHA/05)
 */

const db = require('../config/db');

const PERSONAL_ITEMS = ['LAP', 'MOB', 'TAB']; // Laptop, Mobile, Tablet item codes

const AssetCodeGenerator = {
    generate: async (data) => {
        const { item_code, make_name, serial_number, branch_code, channel_code, asset_type, count } = data;

        if (asset_type === 'IT') {
            if (PERSONAL_ITEMS.includes(item_code?.toUpperCase())) {
                // IT Personal: Item/Make/SerialNumber
                return `${item_code}/${make_name}/${serial_number}`;
            } else {
                // IT Branch: BranchCode/Item/Make/Serial|Count
                if (serial_number) {
                    return `${branch_code}/${item_code}/${make_name}/${serial_number}`;
                } else {
                    const countStr = (count || 1).toString().padStart(2, '0');
                    return `${branch_code}/${item_code}/${make_name}/${countStr}`;
                }
            }
        } else {
            // Non-IT: Channel/Branch/ItemCode/Count
            const countStr = (count || 1).toString().padStart(2, '0');
            return `${channel_code}/${branch_code}/${item_code}/${countStr}`;
        }
    },

    getNextCount: async (branchCode, itemCode, makeId) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM assets a
             JOIN items i ON a.item_id = i.id
             WHERE a.branch_code = ? AND i.item_code = ? AND a.make_id = ?`,
            [branchCode, itemCode, makeId]
        );
        return rows[0].count + 1;
    },

    getNextNonITCount: async (channelCode, branchCode, itemCode) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM assets a
             JOIN items i ON a.item_id = i.id
             JOIN branches b ON a.branch_code = b.branch_code
             WHERE b.channel_code = ? AND a.branch_code = ? AND i.item_code = ?`,
            [channelCode, branchCode, itemCode]
        );
        return rows[0].count + 1;
    }
};

module.exports = AssetCodeGenerator;
