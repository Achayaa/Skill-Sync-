const User = require('../models/User');
const Match = require('../models/Match');

/**
 * Calculate match score between two users
 * @param {Object} user1 - First user
 * @param {Object} user2 - Second user
 * @param {String} skillOffered - Skill ID being offered
 * @param {String} skillRequested - Skill ID being requested
 * @returns {Number} Match score (0-100)
 */
exports.calculateMatchScore = async (user1, user2, skillOffered, skillRequested) => {
  let score = 0;

  // Base compatibility check (50 points)
  const user1OffersSkill = user1.skillsOffered.some(s => s.skill.toString() === skillOffered.toString());
  const user2WantsSkill = user2.skillsRequested.some(s => s.skill.toString() === skillOffered.toString());
  const user2OffersSkill = user2.skillsOffered.some(s => s.skill.toString() === skillRequested.toString());
  const user1WantsSkill = user1.skillsRequested.some(s => s.skill.toString() === skillRequested.toString());

  if (user1OffersSkill && user2WantsSkill && user2OffersSkill && user1WantsSkill) {
    score += 50; // Perfect mutual match
  } else if ((user1OffersSkill && user2WantsSkill) || (user2OffersSkill && user1WantsSkill)) {
    score += 25; // Partial match
  }

  // Rating bonus (20 points)
  const user1Rating = user1.rating.asTeacher.average || 0;
  const user2Rating = user2.rating.asTeacher.average || 0;
  score += (user1Rating + user2Rating) * 2; // Max 20 points (2 users * 5 rating * 2)

  // Experience bonus (15 points)
  const user1Experience = user1.totalSessionsTaught || 0;
  const user2Experience = user2.totalSessionsTaught || 0;
  const totalExperience = user1Experience + user2Experience;
  score += Math.min(15, totalExperience * 0.5); // 0.5 points per session, max 15

  // Credit availability (10 points)
  const user1Credits = user1.skillCredits || 0;
  const user2Credits = user2.skillCredits || 0;
  if (user1Credits >= 1 && user2Credits >= 1) {
    score += 10;
  } else if (user1Credits >= 1 || user2Credits >= 1) {
    score += 5;
  }

  // Activity bonus (5 points)
  const user1Activity = user1.totalSessionsTaught + user1.totalSessionsLearned;
  const user2Activity = user2.totalSessionsTaught + user2.totalSessionsLearned;
  if (user1Activity > 0 && user2Activity > 0) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
};

/**
 * Find potential matches for a user
 * @param {Object} currentUser - Current user object
 * @returns {Array} Array of potential matches with scores
 */
exports.findMatches = async (currentUser) => {
  const matches = [];

  // Get all users except current user
  const allUsers = await User.find({
    _id: { $ne: currentUser._id },
  })
    .populate('skillsOffered.skill')
    .populate('skillsRequested.skill');

  // For each potential match
  for (const otherUser of allUsers) {
    // Check if there's a mutual skill exchange opportunity
    for (const offeredSkill of currentUser.skillsOffered) {
      for (const requestedSkill of currentUser.skillsRequested) {
        // Check if other user wants what current user offers
        const otherWantsOffered = otherUser.skillsRequested.some(
          s => s.skill._id.toString() === offeredSkill.skill._id.toString()
        );

        // Check if other user offers what current user wants
        const otherOffersRequested = otherUser.skillsOffered.some(
          s => s.skill._id.toString() === requestedSkill.skill._id.toString()
        );

        if (otherWantsOffered && otherOffersRequested) {
          // Check if match already exists
          const existingMatch = await Match.findOne({
            $or: [
              { user1: currentUser._id, user2: otherUser._id },
              { user1: otherUser._id, user2: currentUser._id },
            ],
            skillOffered: offeredSkill.skill._id,
            skillRequested: requestedSkill.skill._id,
          });

          if (!existingMatch) {
            // Calculate match score
            const matchScore = await this.calculateMatchScore(
              currentUser,
              otherUser,
              offeredSkill.skill._id,
              requestedSkill.skill._id
            );

            // Only include if score is above threshold (e.g., 30)
            if (matchScore >= 30) {
              matches.push({
                user: {
                  _id: otherUser._id,
                  name: otherUser.name,
                  email: otherUser.email,
                  avatar: otherUser.avatar,
                  bio: otherUser.bio,
                  rating: otherUser.rating,
                  skillCredits: otherUser.skillCredits,
                },
                skillOffered: offeredSkill.skill,
                skillRequested: requestedSkill.skill,
                matchScore,
              });
            }
          }
        }
      }
    }
  }

  // Sort by match score (highest first)
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches;
};

