import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchesAPI, sessionsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import { formatRelativeTime } from '../utils/helpers';
import './Chat.css';

const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinMatch, sendMessage: sendSocketMessage, connected } = useSocket();
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (matchId) {
      loadMatch();
    } else {
      loadMatches();
    }
  }, [matchId]);

  useEffect(() => {
    if (socket && matchId) {
      joinMatch(matchId);
      
      socket.on('newMessage', (message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      socket.on('typing', (data) => {
        setTyping(data.isTyping);
      });

      return () => {
        socket.off('newMessage');
        socket.off('typing');
      };
    }
  }, [socket, matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMatch = async () => {
    try {
      const response = await matchesAPI.getMatches();
      const foundMatch = response.data.matches.find(m => m._id === matchId);
      if (foundMatch) {
        setMatch(foundMatch);
        // In a real app, you'd load messages from the API
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading match:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const response = await matchesAPI.getMatches({ status: 'active' });
      if (response.data.matches.length > 0) {
        navigate(`/chat/${response.data.matches[0]._id}`);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !match) return;

    const otherUser = match.user1._id === (user?._id || user?.id) ? match.user2 : match.user1;
    sendSocketMessage(match._id, otherUser._id, newMessage);
    
    // Optimistically add message
    setMessages((prev) => [
      ...prev,
      {
        sender: { _id: user._id || user.id, name: user.name },
        receiver: otherUser,
        content: newMessage,
        createdAt: new Date(),
      },
    ]);
    
    setNewMessage('');
    scrollToBottom();
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!match) {
    return (
      <div className="chat-page">
        <p className="empty-state">No active matches. Find matches to start chatting!</p>
      </div>
    );
  }

  const otherUser = match.user1._id === (user?._id || user?.id) ? match.user2 : match.user1;

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-user-info">
          <h2>{otherUser.name}</h2>
          <p>
            Teaching: {match.skillOffered.name} • Learning: {match.skillRequested.name}
          </p>
        </div>
        <div className="chat-status">
          {connected ? <span className="status-online">● Online</span> : <span>Offline</span>}
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="empty-state">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender._id === (user?._id || user?.id);
            return (
              <div
                key={index}
                className={`message ${isOwn ? 'message-own' : 'message-other'}`}
              >
                <div className="message-content">{message.content}</div>
                <div className="message-time">
                  {formatRelativeTime(message.createdAt)}
                </div>
              </div>
            );
          })
        )}
        {typing && <div className="typing-indicator">Typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!connected}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;

