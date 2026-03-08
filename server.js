const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'cms-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Make user available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const hrRoutes = require('./routes/hrRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const auditorRoutes = require('./routes/auditorRoutes');
const adminTeamRoutes = require('./routes/adminTeamRoutes');

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/hr', hrRoutes);
app.use('/technician', technicianRoutes);
app.use('/auditor', auditorRoutes);
app.use('/admin-team', adminTeamRoutes);

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/login');
});

// 404
app.use((req, res) => {
    res.status(404).send(`
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0e17;color:#fff;font-family:Inter,sans-serif;flex-direction:column;">
            <h1 style="font-size:72px;margin:0;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">404</h1>
            <p style="color:#8892b0;margin-top:10px;">Page not found</p>
            <a href="/login" style="margin-top:20px;color:#667eea;text-decoration:none;">← Back to Login</a>
        </div>
    `);
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`CMS Server running on http://localhost:${PORT}`);
});
