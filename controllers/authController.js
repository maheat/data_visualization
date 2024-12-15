//authController
import bcrypt from 'bcryptjs';
import User from '../models/user.js';

// Register a new user
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.render('register', { message: 'All fields are required.' });
    }

    if (username.length < 8 || password.length < 8) {
      return res.render('register', { message: 'Username and password must be at least 8 characters long.' });
    }

    // Check if the email is already registered
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.render('register', { message: 'Email is already in use. Please try another.' });
    }

    // Check if the username is already taken
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.render('register', { message: 'Username is already taken. Please choose another.' });
    }

    // Hash password securely
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create and save the new user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await user.save();

    // Save additional user details in the session
    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name || 'No name provided', // Optional: default value
      lastLogin: user.lastLogin || 'Unknown',
    };

    res.redirect('/dashboard');
  } catch (error) {
    if (error.code === 11000 && error.keyPattern.email) {
      // Handle duplicate email error from MongoDB
      return res.render('register', { message: 'Email is already in use. Please try another.' });
    }

    console.error('Error during registration:', error);
    res.status(500).render('register', { message: 'Registration failed. Please try again.' });
  }
};

// Login an existing user
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.render('login', { message: 'Username and password are required.' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.render('login', { message: 'Invalid username or password.' });
    }

    // Compare the provided password with the hashed password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.render('login', { message: 'Invalid username or password.' });
    }

    // Save full user information in session
    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name || 'No name provided', // Optional: default value
      lastLogin: user.lastLogin || 'Unknown',
    };

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).render('login', { message: 'Login failed. Please try again.' });
  }
};

// Logout a user
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).render('dashboard', { message: 'Failed to log out. Please try again.' });
    }
    res.redirect('/login');
  });
};
