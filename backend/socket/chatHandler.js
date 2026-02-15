const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');

// Store online users
const onlineUsers = new Map();

module.exports = (socket, io) => {
  console.log(`User connected: ${socket.id}`);

  // User joins with their user ID
  socket.on('join', async (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    
    // Update user online status
    await User.findByIdAndUpdate(userId, { online: true });

    // Join user's personal room
    socket.join(`user_${userId}`);

    // Emit online status to all connections
    io.emit('userOnline', userId);
  });

  // User joins a match room
  socket.on('joinMatch', async (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`User ${socket.userId} joined match ${matchId}`);
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      const { matchId, receiverId, content } = data;

      // Verify match exists and user is part of it
      const match = await Match.findById(matchId);
      if (!match) {
        socket.emit('error', { message: 'Match not found' });
        return;
      }

      if (match.user1.toString() !== socket.userId && match.user2.toString() !== socket.userId) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      // Create message
      const message = await Message.create({
        match: matchId,
        sender: socket.userId,
        receiver: receiverId,
        content,
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name avatar')
        .populate('receiver', 'name avatar');

      // Emit to match room
      io.to(`match_${matchId}`).emit('newMessage', populatedMessage);

      // Emit to receiver's personal room if not in match room
      io.to(`user_${receiverId}`).emit('newMessage', populatedMessage);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { matchId, isTyping } = data;
    socket.to(`match_${matchId}`).emit('typing', {
      userId: socket.userId,
      isTyping,
    });
  });

  // Handle read receipts
  socket.on('markAsRead', async (messageId) => {
    try {
      const message = await Message.findById(messageId);
      if (message && message.receiver.toString() === socket.userId) {
        message.read = true;
        message.readAt = new Date();
        await message.save();

        // Notify sender
        io.to(`user_${message.sender}`).emit('messageRead', {
          messageId,
          readAt: message.readAt,
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, { online: false });

      // Emit offline status
      io.emit('userOffline', socket.userId);
    }
  });
};

