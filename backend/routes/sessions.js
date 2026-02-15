const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessions,
  updateSession,
  getSession,
  getMySessions,
  submitReview,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');
const { validate, sessionValidation } = require('../utils/validators');

router.get('/', protect, getSessions);
router.get('/my-sessions', protect, getMySessions); // Alias for /api/session/my-sessions
router.get('/:id', protect, getSession);
router.post('/', protect, validate(sessionValidation), createSession);
router.post('/create', protect, validate(sessionValidation), createSession); // Alias for /api/session/create
router.post('/review', protect, submitReview); // POST /api/session/review
router.put('/:id', protect, updateSession);

module.exports = router;

