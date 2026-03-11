/**
 * Migration script to update the existing CMS database.
 * - Adds 'categories' table
 * - Adds 'category_id' column to 'items' table
 * - Changes asset_type ENUM from 'NON_IT' to 'ADMIN' in items and assets tables
 * - Updates employee ENUM values for email_status and ad_account_status
 * - Seeds predefined categories
 */
const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'cms',
    password: 'cms@cfcici*',
    database: 'cms'
};

async function migrate() {
    let conn;
    try {
        conn = await mysql.createConnection(DB_CONFIG);
        console.log('Connected to MySQL for migration.\n');

        // 1. Create categories table
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category_name VARCHAR(100) NOT NULL,
                category_code VARCHAR(20) NOT NULL UNIQUE,
                asset_type ENUM('IT', 'ADMIN') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ categories table created/verified.');

        // 2. Add category_id column to items table (if not exists)
        try {
            await conn.execute(`ALTER TABLE items ADD COLUMN category_id INT AFTER item_code`);
            console.log('✔ Added category_id column to items.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ category_id column already exists on items.');
            } else { throw e; }
        }

        // 3. Update asset_type ENUM in items: add ADMIN value
        try {
            await conn.execute(`ALTER TABLE items MODIFY COLUMN asset_type ENUM('IT', 'NON_IT', 'ADMIN') NOT NULL`);
            // Convert existing NON_IT to ADMIN
            await conn.execute(`UPDATE items SET asset_type = 'ADMIN' WHERE asset_type = 'NON_IT'`);
            // Remove NON_IT from enum
            await conn.execute(`ALTER TABLE items MODIFY COLUMN asset_type ENUM('IT', 'ADMIN') NOT NULL`);
            console.log('✔ Updated items.asset_type: NON_IT → ADMIN.');
        } catch (e) {
            console.log('ℹ items.asset_type already updated or migration skipped:', e.message);
        }

        // 4. Update asset_type ENUM in assets: add ADMIN value
        try {
            await conn.execute(`ALTER TABLE assets MODIFY COLUMN asset_type ENUM('IT', 'NON_IT', 'ADMIN') NOT NULL`);
            // Convert existing NON_IT to ADMIN
            await conn.execute(`UPDATE assets SET asset_type = 'ADMIN' WHERE asset_type = 'NON_IT'`);
            // Remove NON_IT from enum
            await conn.execute(`ALTER TABLE assets MODIFY COLUMN asset_type ENUM('IT', 'ADMIN') NOT NULL`);
            console.log('✔ Updated assets.asset_type: NON_IT → ADMIN.');
        } catch (e) {
            console.log('ℹ assets.asset_type already updated or migration skipped:', e.message);
        }

        // 5. Update employee ENUM values
        try {
            await conn.execute(`ALTER TABLE employees MODIFY COLUMN email_status ENUM('active', 'not_created', 'lockout', 'closed') DEFAULT 'not_created'`);
            console.log('✔ Updated employees.email_status ENUM.');
        } catch (e) {
            console.log('ℹ email_status:', e.message);
        }
        try {
            await conn.execute(`ALTER TABLE employees MODIFY COLUMN ad_account_status ENUM('active', 'not_created', 'disabled') DEFAULT 'not_created'`);
            console.log('✔ Updated employees.ad_account_status ENUM.');
        } catch (e) {
            console.log('ℹ ad_account_status:', e.message);
        }

        // 6. Add FK for items.category_id → categories.id (if not exists)
        try {
            await conn.execute(`ALTER TABLE items ADD FOREIGN KEY (category_id) REFERENCES categories(id)`);
            console.log('✔ Added FK for items.category_id.');
        } catch (e) {
            if (e.code === 'ER_DUP_KEY' || e.message.includes('Duplicate') || e.message.includes('already exists')) {
                console.log('ℹ FK already exists for items.category_id.');
            } else {
                console.log('ℹ FK:', e.message);
            }
        }

        // 7. Seed categories
        const itCategories = [
            ['Computing', 'COMP'], ['Networking', 'NET'], ['Servers', 'SRV'], ['Storage', 'STR'],
            ['Peripherals', 'PER'], ['Security', 'SEC'], ['Communication', 'COM'], ['Power', 'PWR']
        ];
        const adminCategories = [
            ['Furniture & Fixtures', 'FF'], ['Signages', 'SGN'], ['Safety Equipment', 'SAF'], ['Electrical Fittings', 'ELF']
        ];
        for (const [name, code] of itCategories) {
            await conn.execute(`INSERT IGNORE INTO categories (category_name, category_code, asset_type) VALUES (?, ?, 'IT')`, [name, code]);
        }
        for (const [name, code] of adminCategories) {
            await conn.execute(`INSERT IGNORE INTO categories (category_name, category_code, asset_type) VALUES (?, ?, 'ADMIN')`, [name, code]);
        }
        console.log('✔ Categories seeded.');

        console.log('\n========================================');
        console.log('  Migration completed successfully!');
        console.log('========================================\n');

    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        if (conn) await conn.end();
    }
}

migrate();
