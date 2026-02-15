const Session = require('../models/Session');
const Match = require('../models/Match');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const creditController = require('./creditController');

// @desc    Create a session
// @route   POST /api/sessions
// @access  Private
exports.createSession = async (req, res) => {
  try {
    const { matchId, scheduledDate, duration, meetingLink } = req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Verify user is part of the match
    const isUser1 = match.user1.toString() === req.user.id;
    const isUser2 = match.user2.toString() === req.user.id;
    if (!isUser1 && !isUser2) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Determine teacher and learner
    const teacher = isUser1 ? match.user1 : match.user2;
    const learner = isUser1 ? match.user2 : match.user1;

    // Check if learner has enough credits (1 credit per hour)
    const creditsNeeded = Math.ceil(duration / 60);
    const learnerUser = await User.findById(learner);
    if (learnerUser.skillCredits < creditsNeeded) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. You need ${creditsNeeded} credits for this session.`,
      });
    }

    // Create session
    const session = await Session.create({
      match: matchId,
      teacher,
      learner,
      skill: match.skillOffered,
      scheduledDate,
      duration,
      creditsSpent: creditsNeeded,
      meetingLink: meetingLink || '',
      status: 'scheduled',
    });

    // Deduct credits from learner
    await creditController.deductCredits(learner, creditsNeeded, `Session scheduled: ${session._id}`, session._id);

    // Update match status to active if not already
    if (match.status !== 'active') {
      match.status = 'active';
      await match.save();
    }

    const populatedSession = await Session.findById(session._id)
      .populate('teacher', 'name email avatar')
      .populate('learner', 'name email avatar')
      .populate('skill', 'name category icon')
      .populate('match');

    res.status(201).json({ success: true, session: populatedSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's sessions
// @route   GET /api/sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    const { status, role } = req.query;
    const query = {
      $or: [
        { teacher: req.user.id },
        { learner: req.user.id },
      ],
    };

    if (status) {
      query.status = status;
    }

    if (role === 'teacher') {
      query.teacher = req.user.id;
      delete query.$or;
    } else if (role === 'learner') {
      query.learner = req.user.id;
      delete query.$or;
    }

    const sessions = await Session.find(query)
      .populate('teacher', 'name email avatar')
      .populate('learner', 'name email avatar')
      .populate('skill', 'name category icon')
      .populate('match')
      .sort({ scheduledDate: -1 });

    res.json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's sessions (alias for /api/session/my-sessions)
// @route   GET /api/session/my-sessions
// @access  Private
exports.getMySessions = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      $or: [
        { teacher: req.user.id },
        { learner: req.user.id },
      ],
    };

    if (status) {
      query.status = status;
    }

    const sessions = await Session.find(query)
      .populate('teacher', 'name email avatar')
      .populate('learner', 'name email avatar')
      .populate('skill', 'name category icon')
      .populate('match')
      .sort({ scheduledDate: -1 });

    res.json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private
exports.updateSession = async (req, res) => {
  try {
    const { status, feedback, notes } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check authorization
    if (session.teacher.toString() !== req.user.id && session.learner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (status) {
      session.status = status;

      // If completed, transfer credits to teacher
      if (status === 'completed' && session.status !== 'completed') {
        await creditController.addCredits(
          session.teacher,
          session.creditsSpent,
          `Session completed: ${session._id}`,
          session._id
        );

        // Update user stats
        const teacher = await User.findById(session.teacher);
        const learner = await User.findById(session.learner);
        teacher.totalSessionsTaught += 1;
        learner.totalSessionsLearned += 1;
        await teacher.save();
        await learner.save();
      }
    }

    if (feedback) {
      const isTeacher = session.teacher.toString() === req.user.id;
      if (isTeacher) {
        session.feedback.fromTeacher = {
          ...feedback,
          submittedAt: new Date(),
        };
      } else {
        session.feedback.fromLearner = {
          ...feedback,
          submittedAt: new Date(),
        };

        // Update teacher rating if learner provided feedback
        if (feedback.rating) {
          const teacher = await User.findById(session.teacher);
          const currentRating = teacher.rating.asTeacher;
          const newCount = currentRating.count + 1;
          const newAverage = ((currentRating.average * currentRating.count) + feedback.rating) / newCount;
          teacher.rating.asTeacher = {
            average: newAverage,
            count: newCount,
          };
          await teacher.save();
        }
      }
    }

    if (notes) {
      session.notes = notes;
    }

    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate('teacher', 'name email avatar')
      .populate('learner', 'name email avatar')
      .populate('skill', 'name category icon')
      .populate('match');

    res.json({ success: true, session: populatedSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get session by ID
// @route   GET /api/sessions/:id
// @access  Private
exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('teacher', 'name email avatar')
      .populate('learner', 'name email avatar')
      .populate('skill', 'name category icon')
      .populate('match');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check authorization
    if (session.teacher.toString() !== req.user.id && session.learner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit session review
// @route   POST /api/session/review
// @access  Private
exports.submitReview = async (req, res) => {
  try {
    const { sessionId, rating, comments } = req.body;

    if (!sessionId || !rating) {
      return res.status(400).json({ success: false, message: 'Session ID and rating are required' });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check authorization
    if (session.teacher.toString() !== req.user.id && session.learner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed sessions' });
    }

    const isTeacher = session.teacher.toString() === req.user.id;

    if (isTeacher) {
      session.feedback.fromTeacher = {
        rating: parseInt(rating),
        comments: comments || '',
        submittedAt: new Date(),
      };
    } else {
      session.feedback.fromLearner = {
        rating: parseInt(rating),
        comments: comments || '',
        submittedAt: new Date(),
      };

      // Update teacher rating if learner provided feedback
      if (rating) {
        const teacher = await User.findById(session.teacher);
        const currentRating = teacher.rating.asTeacher;
        const newCount = currentRating.count + 1;
        const newAverage = ((currentRating.average * currentRating.count) + parseInt(rating)) / newCount;
        teacher.rating.asTeacher = {
          average: newAverage,
          count: newCount,
        };
        await teacher.save();
      }
    }

    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate('teacher', 'name email avatar')
      .populate('learner', 'name email avatar')
      .populate('skill', 'name category icon')
      .populate('match');

    res.json({ success: true, session: populatedSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

