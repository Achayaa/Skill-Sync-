const express = require('express');
const router = express.Router();
const {
  getPotentialMatches,
  createMatch,
  getMatches,
  updateMatch,
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.get('/potential', protect, getPotentialMatches);
router.get('/find', protect, getPotentialMatches); // Alias for /api/match/find
router.get('/', protect, getMatches);
router.post('/', protect, createMatch);
router.put('/:id', protect, updateMatch);

module.exports = router;

