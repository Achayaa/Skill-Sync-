const Match = require('../models/Match');
const User = require('../models/User');
const matchingService = require('../services/matchingService');

// @desc    Get potential matches
// @route   GET /api/matches/potential
// @access  Private
exports.getPotentialMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)
      .populate('skillsOffered.skill')
      .populate('skillsRequested.skill');

    const matches = await matchingService.findMatches(currentUser);

    res.json({ success: true, count: matches.length, matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a match (initiate)
// @route   POST /api/matches
// @access  Private
exports.createMatch = async (req, res) => {
  try {
    const { userId, skillOffered, skillRequested } = req.body;

    // Check if match already exists
    const existingMatch = await Match.findOne({
      $or: [
        { user1: req.user.id, user2: userId },
        { user1: userId, user2: req.user.id },
      ],
      skillOffered,
      skillRequested,
    });

    if (existingMatch) {
      return res.status(400).json({ success: false, message: 'Match already exists' });
    }

    // Calculate match score
    const user1 = await User.findById(req.user.id);
    const user2 = await User.findById(userId);
    const matchScore = await matchingService.calculateMatchScore(user1, user2, skillOffered, skillRequested);

    const match = await Match.create({
      user1: req.user.id,
      user2: userId,
      skillOffered,
      skillRequested,
      matchScore,
      initiatedBy: req.user.id,
      status: 'pending',
    });

    const populatedMatch = await Match.findById(match._id)
      .populate('user1', 'name email avatar')
      .populate('user2', 'name email avatar')
      .populate('skillOffered', 'name category icon')
      .populate('skillRequested', 'name category icon');

    res.status(201).json({ success: true, match: populatedMatch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's matches
// @route   GET /api/matches
// @access  Private
exports.getMatches = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      $or: [
        { user1: req.user.id },
        { user2: req.user.id },
      ],
    };

    if (status) {
      query.status = status;
    }

    const matches = await Match.find(query)
      .populate('user1', 'name email avatar')
      .populate('user2', 'name email avatar')
      .populate('skillOffered', 'name category icon')
      .populate('skillRequested', 'name category icon')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: matches.length, matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update match status
// @route   PUT /api/matches/:id
// @access  Private
exports.updateMatch = async (req, res) => {
  try {
    const { status } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Check if user is part of the match
    if (match.user1.toString() !== req.user.id && match.user2.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    match.status = status;
    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('user1', 'name email avatar')
      .populate('user2', 'name email avatar')
      .populate('skillOffered', 'name category icon')
      .populate('skillRequested', 'name category icon');

    res.json({ success: true, match: populatedMatch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

