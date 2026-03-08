const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Role ID to dashboard route mapping
const ROLE_DASHBOARDS = {
    1: '/admin/dashboard',
    2: '/hr/dashboard',
    3: '/technician/dashboard',
    4: '/auditor/dashboard',
    5: '/admin-team/dashboard'
};

// GET /login
const getLogin = (req, res) => {
    if (req.session && req.session.user) {
        const dashboardUrl = ROLE_DASHBOARDS[req.session.user.role_id] || '/login';
        return res.redirect(dashboardUrl);
    }
    res.render('auth/login', {
        error: null,
        title: 'Login - CMS'
    });
};

// POST /login
const postLogin = async (req, res) => {
    const { employee_code, password } = req.body;

    try {
        if (!employee_code || !password) {
            return res.render('auth/login', {
                error: 'Please enter both Employee Code and Password.',
                title: 'Login - CMS'
            });
        }

        const [rows] = await db.query(
            `SELECT u.*, r.role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.employee_code = ? AND u.status = 'active'`,
            [employee_code]
        );

        if (rows.length === 0) {
            return res.render('auth/login', {
                error: 'Invalid Employee Code or Password.',
                title: 'Login - CMS'
            });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render('auth/login', {
                error: 'Invalid Employee Code or Password.',
                title: 'Login - CMS'
            });
        }

        // Store user in session
        req.session.user = {
            id: user.id,
            employee_code: user.employee_code,
            employee_name: user.employee_name,
            department: user.department,
            role_id: user.role_id,
            role_name: user.role_name
        };

        const dashboardUrl = ROLE_DASHBOARDS[user.role_id] || '/login';
        res.redirect(dashboardUrl);

    } catch (err) {
        console.error('Login error:', err);
        res.render('auth/login', {
            error: 'An error occurred. Please try again.',
            title: 'Login - CMS'
        });
    }
};

// GET /logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
};

module.exports = { getLogin, postLogin, logout };
