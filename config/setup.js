const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
    host: 'localhost',
    user: 'cms',
    password: 'cms@cfcici*',
    database: 'cms'
};

async function setup() {
    let connection;
    try {
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('Connected to MySQL database.');

        // ===== Create Tables =====

        // 1. Roles
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_name VARCHAR(50) NOT NULL UNIQUE
            )
        `);
        console.log('✔ roles table created.');

        // 2. Users
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_code VARCHAR(50) NOT NULL UNIQUE,
                employee_name VARCHAR(100) NOT NULL,
                department VARCHAR(100),
                role_id INT NOT NULL,
                password VARCHAR(255) NOT NULL,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id)
            )
        `);
        console.log('✔ users table created.');

        // 3. Branches
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS branches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                channel_code VARCHAR(50),
                branch_code VARCHAR(50) NOT NULL UNIQUE,
                branch_name VARCHAR(150) NOT NULL,
                address TEXT,
                pincode VARCHAR(10),
                contact_number VARCHAR(20),
                isp VARCHAR(100),
                ip_address VARCHAR(50),
                circuit_id VARCHAR(100),
                billing_account VARCHAR(100),
                isp_lc VARCHAR(100),
                branch_opening_date DATE,
                agreement_start_date DATE,
                agreement_end_date DATE,
                internet_activated_date DATE,
                disconnected_date DATE,
                kseb_consumer_no VARCHAR(100),
                updates TEXT,
                status ENUM('active', 'inactive', 'closed') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ branches table created.');

        // 4. Employees
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_code VARCHAR(50) NOT NULL UNIQUE,
                employee_name VARCHAR(100) NOT NULL,
                designation VARCHAR(100),
                department VARCHAR(100),
                reporting_to VARCHAR(100),
                contact_number VARCHAR(20),
                date_of_birth DATE,
                branch_code VARCHAR(50),
                email_id VARCHAR(150),
                email_status ENUM('active', 'not_created', 'lockout', 'closed') DEFAULT 'not_created',
                ad_account_status ENUM('active', 'not_created', 'disabled') DEFAULT 'not_created',
                status ENUM('active', 'resigned', 'terminated') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_code) REFERENCES branches(branch_code) ON UPDATE CASCADE
            )
        `);
        console.log('✔ employees table created.');

        // 5. Categories
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category_name VARCHAR(100) NOT NULL,
                category_code VARCHAR(20) NOT NULL UNIQUE,
                asset_type ENUM('IT', 'ADMIN') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ categories table created.');

        // 6. Items (Subcategories)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                item_name VARCHAR(100) NOT NULL,
                item_code VARCHAR(50) NOT NULL UNIQUE,
                category_id INT,
                asset_type ENUM('IT', 'ADMIN') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        `);
        console.log('✔ items (subcategories) table created.');

        // 6. Makes
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS makes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                make_name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ makes table created.');

        // 7. Models
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS models (
                id INT AUTO_INCREMENT PRIMARY KEY,
                make_id INT NOT NULL,
                model_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (make_id) REFERENCES makes(id) ON DELETE CASCADE
            )
        `);
        console.log('✔ models table created.');

        // 8. Assets
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS assets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asset_code VARCHAR(150) NOT NULL UNIQUE,
                branch_code VARCHAR(50),
                item_id INT,
                make_id INT,
                model_id INT,
                serial_number VARCHAR(100),
                count INT DEFAULT 1,
                asset_type ENUM('IT', 'ADMIN') NOT NULL,
                status ENUM('stock', 'assigned', 'scrap') DEFAULT 'stock',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_code) REFERENCES branches(branch_code) ON UPDATE CASCADE,
                FOREIGN KEY (item_id) REFERENCES items(id),
                FOREIGN KEY (make_id) REFERENCES makes(id),
                FOREIGN KEY (model_id) REFERENCES models(id)
            )
        `);
        console.log('✔ assets table created.');

        // 9. Asset History
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS asset_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asset_id INT NOT NULL,
                employee_code VARCHAR(50),
                assigned_date DATE,
                returned_date DATE,
                remarks TEXT,
                FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_code) REFERENCES employees(employee_code) ON UPDATE CASCADE
            )
        `);
        console.log('✔ asset_history table created.');

        // 10. Asset Transfer History
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS asset_transfer_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asset_id INT NOT NULL,
                from_branch VARCHAR(50),
                to_branch VARCHAR(50),
                transferred_by VARCHAR(100),
                transfer_date DATE,
                remarks TEXT,
                FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
            )
        `);
        console.log('✔ asset_transfer_history table created.');

        // 11. Tickets
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_code VARCHAR(50) NOT NULL UNIQUE,
                type ENUM('onboarding', 'offboarding') NOT NULL,
                created_by INT,
                status ENUM('open', 'in_progress', 'closed') DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);
        console.log('✔ tickets table created.');

        // 12. Ticket Details
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS ticket_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                employee_code VARCHAR(50),
                email_required TINYINT(1) DEFAULT 0,
                email_id VARCHAR(150),
                laptop_required TINYINT(1) DEFAULT 0,
                laptop_serial VARCHAR(100),
                bag_model VARCHAR(100),
                accessories TEXT,
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
            )
        `);
        console.log('✔ ticket_details table created.');

        // 13. Agreements
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS agreements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                branch_code VARCHAR(50),
                agreement_type VARCHAR(100),
                vendor VARCHAR(150),
                start_date DATE,
                end_date DATE,
                billing_account VARCHAR(100),
                circuit_id VARCHAR(100),
                amount DECIMAL(12, 2),
                status ENUM('active', 'expired', 'terminated') DEFAULT 'active',
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_code) REFERENCES branches(branch_code) ON UPDATE CASCADE
            )
        `);
        console.log('✔ agreements table created.');

        // 14. Activity Logs
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                module VARCHAR(100),
                action VARCHAR(100),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('✔ activity_logs table created.');

        // 15. Notifications
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                title VARCHAR(200),
                message TEXT,
                status ENUM('unread', 'read') DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('✔ notifications table created.');

        // ===== Seed Data =====

        // Insert roles
        const roles = ['Admin', 'HR', 'Technician', 'Auditor', 'AdminTeam'];
        for (const role of roles) {
            await connection.execute(
                `INSERT IGNORE INTO roles (role_name) VALUES (?)`,
                [role]
            );
        }
        console.log('✔ Roles seeded.');

        // Insert admin user (password: admin)
        const hashedPassword = await bcrypt.hash('admin', 10);
        const [existing] = await connection.execute(
            `SELECT id FROM users WHERE employee_code = 'ADMIN'`
        );

        if (existing.length === 0) {
            await connection.execute(
                `INSERT INTO users (employee_code, employee_name, department, role_id, password, status)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['ADMIN', 'System Administrator', 'IT', 1, hashedPassword, 'active']
            );
            console.log('✔ Admin user created (employee_code: ADMIN, password: admin)');
        } else {
            // Update password in case it needs resetting
            await connection.execute(
                `UPDATE users SET password = ? WHERE employee_code = 'ADMIN'`,
                [hashedPassword]
            );
            console.log('✔ Admin user already exists, password reset to "admin".');
        }

        // Seed categories
        const itCategories = [
            ['Computing', 'COMP'],
            ['Networking', 'NET'],
            ['Servers', 'SRV'],
            ['Storage', 'STR'],
            ['Peripherals', 'PER'],
            ['Security', 'SEC'],
            ['Communication', 'COM'],
            ['Power', 'PWR']
        ];
        const adminCategories = [
            ['Furniture & Fixtures', 'FF'],
            ['Signages', 'SGN'],
            ['Safety Equipment', 'SAF'],
            ['Electrical Fittings', 'ELF']
        ];
        for (const [name, code] of itCategories) {
            await connection.execute(
                `INSERT IGNORE INTO categories (category_name, category_code, asset_type) VALUES (?, ?, 'IT')`,
                [name, code]
            );
        }
        for (const [name, code] of adminCategories) {
            await connection.execute(
                `INSERT IGNORE INTO categories (category_name, category_code, asset_type) VALUES (?, ?, 'ADMIN')`,
                [name, code]
            );
        }
        console.log('✔ Categories seeded.');

        console.log('\n========================================');
        console.log('  Database setup completed successfully!');
        console.log('========================================');
        console.log('  Login credentials:');
        console.log('  Employee Code: ADMIN');
        console.log('  Password:      admin');
        console.log('========================================\n');

    } catch (err) {
        console.error('Setup error:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

setup();
