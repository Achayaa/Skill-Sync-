import React, { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const userId = user._id || user.id;
      const socketInstance = connectSocket(userId);
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setConnected(false);
      });

      return () => {
        disconnectSocket();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  const joinMatch = (matchId) => {
    if (socket) {
      socket.emit('joinMatch', matchId);
    }
  };

  const sendMessage = (matchId, receiverId, content) => {
    if (socket) {
      socket.emit('sendMessage', { matchId, receiverId, content });
    }
  };

  const markAsRead = (messageId) => {
    if (socket) {
      socket.emit('markAsRead', messageId);
    }
  };

  const setTyping = (matchId, isTyping) => {
    if (socket) {
      socket.emit('typing', { matchId, isTyping });
    }
  };

  const value = {
    socket,
    connected,
    joinMatch,
    sendMessage,
    markAsRead,
    setTyping,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

