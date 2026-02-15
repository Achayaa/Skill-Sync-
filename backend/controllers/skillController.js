const Skill = require('../models/Skill');
const User = require('../models/User');

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
exports.getSkills = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skills = await Skill.find(query).sort({ name: 1 });

    res.json({ success: true, count: skills.length, skills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create skill
// @route   POST /api/skills
// @access  Private
exports.createSkill = async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json({ success: true, skill });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Skill already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add skill to user's offered skills
// @route   POST /api/skills/offered
// @access  Private
exports.addOfferedSkill = async (req, res) => {
  try {
    const { skillId, proficiencyLevel } = req.body;

    const user = await User.findById(req.user.id);
    const skillExists = user.skillsOffered.find(
      s => s.skill.toString() === skillId
    );

    if (skillExists) {
      return res.status(400).json({ success: false, message: 'Skill already added' });
    }

    user.skillsOffered.push({ skill: skillId, proficiencyLevel: proficiencyLevel || 'intermediate' });
    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .populate('skillsOffered.skill', 'name category icon');

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove skill from user's offered skills
// @route   DELETE /api/skills/offered/:skillId
// @access  Private
exports.removeOfferedSkill = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.skillsOffered = user.skillsOffered.filter(
      s => s.skill.toString() !== req.params.skillId
    );
    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .populate('skillsOffered.skill', 'name category icon');

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add skill to user's requested skills
// @route   POST /api/skills/requested
// @access  Private
exports.addRequestedSkill = async (req, res) => {
  try {
    const { skillId, desiredLevel } = req.body;

    const user = await User.findById(req.user.id);
    const skillExists = user.skillsRequested.find(
      s => s.skill.toString() === skillId
    );

    if (skillExists) {
      return res.status(400).json({ success: false, message: 'Skill already added' });
    }

    user.skillsRequested.push({ skill: skillId, desiredLevel: desiredLevel || 'beginner' });
    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .populate('skillsRequested.skill', 'name category icon');

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove skill from user's requested skills
// @route   DELETE /api/skills/requested/:skillId
// @access  Private
exports.removeRequestedSkill = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.skillsRequested = user.skillsRequested.filter(
      s => s.skill.toString() !== req.params.skillId
    );
    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .populate('skillsRequested.skill', 'name category icon');

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

