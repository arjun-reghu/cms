// Authentication Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Role-based Access Middleware
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }
        const userRoleId = req.session.user.role_id;
        if (allowedRoles.includes(userRoleId)) {
            return next();
        }
        res.status(403).render('auth/forbidden', {
            message: 'You do not have permission to access this page.'
        });
    };
};

module.exports = { isAuthenticated, authorizeRole };
