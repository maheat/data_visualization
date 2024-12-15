import './config.mjs';
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import hbs from 'hbs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

app.set('view engine', 'hbs'); // Set hbs as the view engine
app.set('views', path.join(__dirname, 'views')); // Set the views directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (for form submissions)
app.use(express.json()); // Parse JSON bodies

hbs.registerHelper('keys', (obj) => {
  return Object.keys(obj);
});
// Register the `json` helper
hbs.registerHelper('json', (context) => {
  return JSON.stringify(context, null, 2);
});
mongoose.connect(process.env.DSN)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Middleware for sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for local development
    httpOnly: true,
    sameSite: 'strict',
  }
}));

// Middleware to make user data available in views
app.use((req, res, next) => {
  if (req.session.user) {
      res.locals.user = req.session.user; // Pass session user to views
  }
  next();
});


// Static files and routing
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', authRoutes);
app.use('/', dataRoutes); // Routes will be prefixed with '/data'

// Root route to serve a homepage or redirect to login
app.get('/', (req, res) => {
//   res.send('Welcome to the Interactive Data Exploration Tool!');
  res.redirect('/login');
});

// Authentication Middleware
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Protecting the dashboard route
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('homepage');
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(process.env.PORT || 31706, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 31706}`);
});
;
