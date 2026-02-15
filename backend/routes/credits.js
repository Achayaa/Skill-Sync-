const express = require('express');
const router = express.Router();
const { getTransactions, getBalance } = require('../controllers/creditController');
const { protect } = require('../middleware/auth');

router.get('/balance', protect, getBalance);
router.get('/transactions', protect, getTransactions);

module.exports = router;

