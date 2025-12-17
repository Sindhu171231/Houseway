const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

const {
  mockLogin,
  mockGetProfile,
} = require('../controllers/mockAuthController');

const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
} = require('../middleware/validation');

const { authenticate, isOwner } = require('../middleware/auth');
const { uploadSingle, getFileUrl } = require('../middleware/upload');

/**
 * ============================
 *  USER REGISTRATION & LOGIN
 * ============================
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (handles role & subRole)
 * @access  Public for clients/guests, owner approval needed for employees
 */
router.post('/register', (req, res, next) => {
  // Default role if not provided
  if (!req.body.role) req.body.role = 'guest';

  // Employees must have a subRole
  if (req.body.role === 'employee' && !req.body.subRole) {
    return res.status(400).json({
      success: false,
      message: 'SubRole is required for employees',
    });
  }

  // Employees need admin approval
  if (req.body.role === 'employee') {
    req.body.approvedByAdmin = false;
  }

  next();
}, validateRegistration, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (email + password only)
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   POST /api/auth/login-mock
 * @desc    Mock login for testing without MongoDB
 * @access  Public
 */
router.post('/login-mock', validateLogin, mockLogin);

/**
 * ============================
 *  PROFILE & PASSWORD ROUTES
 * ============================
 */

/**
 * @route   GET /api/auth/profile
 * @desc    Get logged-in user's profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   GET /api/auth/profile-mock
 * @desc    Mock profile (for testing)
 * @access  Private
 */
router.get('/profile-mock', authenticate, mockGetProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, validateProfileUpdate, updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, validatePasswordChange, changePassword);

/**
 * ============================
 *  OWNER / ADMIN REGISTRATION ROUTES
 * ============================
 */

/**
 * @route   POST /api/auth/register-employee
 * @desc    Owner registers a new employee directly (auto-approved)
 * @access  Private (Owner only)
 */
router.post('/register-employee', authenticate, isOwner, (req, res, next) => {
  req.body.role = 'employee';
  req.body.approvedByAdmin = true;
  next();
}, validateRegistration, register);

/**
 * @route   POST /api/auth/register-vendor
 * @desc    Owner registers vendor directly
 * @access  Private (Owner only)
 */
router.post('/register-vendor', authenticate, isOwner, (req, res, next) => {
  req.body.role = 'vendor';
  next();
}, validateRegistration, register);

/**
 * @route   POST /api/auth/register-client
 * @desc    Client public registration (legacy support)
 * @access  Public
 */
router.post('/register-client', (req, res, next) => {
  req.body.role = 'client';
  next();
}, validateRegistration, register);

/**
 * @route   POST /api/auth/register-guest
 * @desc    Guest registration (legacy support)
 * @access  Public
 */
router.post('/register-guest', (req, res, next) => {
  req.body.role = 'guest';
  next();
}, validateRegistration, register);

/**
 * ============================
 *  PROFILE IMAGE HANDLING
 * ============================
 */

/**
 * @route   POST /api/auth/upload-profile-photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post('/upload-profile-photo', authenticate, uploadSingle('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Only image files are allowed' });
    }

    const User = require('../models/User');
    const profileImageUrl = getFileUrl(req, `images/${req.file.filename}`);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: profileImageUrl },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profileImage: profileImageUrl,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile photo',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/auth/remove-profile-photo
 * @desc    Remove profile photo
 * @access  Private
 */
router.delete('/remove-profile-photo', authenticate, async (req, res) => {
  try {
    const User = require('../models/User');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { profileImage: 1 } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile photo removed successfully',
      data: { user: user.toSafeObject() },
    });
  } catch (error) {
    console.error('Profile photo removal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove profile photo',
      error: error.message,
    });
  }
});

module.exports = router;
