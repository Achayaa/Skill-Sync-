const express = require('express');
const router = express.Router();
const {
  getSkills,
  createSkill,
  addOfferedSkill,
  removeOfferedSkill,
  addRequestedSkill,
  removeRequestedSkill,
} = require('../controllers/skillController');
const { protect } = require('../middleware/auth');
const { validate, skillValidation } = require('../utils/validators');

router.get('/', getSkills);
router.post('/', protect, validate(skillValidation), createSkill);
router.post('/offered', protect, addOfferedSkill);
router.delete('/offered/:skillId', protect, removeOfferedSkill);
router.post('/requested', protect, addRequestedSkill);
router.delete('/requested/:skillId', protect, removeRequestedSkill);

module.exports = router;

