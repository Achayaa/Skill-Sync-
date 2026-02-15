const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');

// @desc    Get credit transactions
// @route   GET /api/credits/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await CreditTransaction.find({ user: req.user.id })
      .populate('session', 'scheduledDate skill')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get credit balance
// @route   GET /api/credits/balance
// @access  Private
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('skillCredits');
    res.json({ success: true, balance: user.skillCredits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal function to add credits
exports.addCredits = async (userId, amount, description, sessionId = null) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.skillCredits += amount;
  await user.save();

  await CreditTransaction.create({
    user: userId,
    type: 'earned',
    amount,
    description,
    session: sessionId,
    balanceAfter: user.skillCredits,
  });

  return user.skillCredits;
};

// Internal function to deduct credits
exports.deductCredits = async (userId, amount, description, sessionId = null) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (user.skillCredits < amount) {
    throw new Error('Insufficient credits');
  }

  user.skillCredits -= amount;
  await user.save();

  await CreditTransaction.create({
    user: userId,
    type: 'spent',
    amount,
    description,
    session: sessionId,
    balanceAfter: user.skillCredits,
  });

  return user.skillCredits;
};

