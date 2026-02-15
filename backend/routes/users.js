const express = require('express');
const router = express.Router();
const { getUser, updateProfile, getUsers, getProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getUsers);
router.get('/profile', protect, getProfile);
router.get('/:id', protect, getUser);
router.put('/profile', protect, updateProfile);

module.exports = router;

