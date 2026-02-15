# Skill Sync Platform

A skill-exchange web platform where users can offer skills they know, request skills they want to learn, get AI-based matching with suitable peers, earn and spend Skill Credits, track learning progress, and chat securely within the platform.

## Features

- **Skill Management**: Users can add skills they offer and skills they want to learn
- **AI-Powered Matching**: Custom algorithm matches users based on skill compatibility, ratings, and experience
- **Skill Credits System**: Earn credits by teaching, spend credits to learn (new users start with 5 credits)
- **Real-time Chat**: Socket.io-powered instant messaging between matched users
- **Session Scheduling**: Schedule learning sessions with calendar integration
- **Progress Tracking**: Dashboard with statistics, session history, and learning progress
- **Ratings & Reviews**: Build reputation through quality teaching and learning

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18
- React Router for navigation
- Socket.io-client for real-time features
- Vite as build tool
- Axios for API calls

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skill-sync
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

4. Start the backend server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
skill-sync/
├── backend/
│   ├── config/          # Database and JWT configuration
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth and upload middleware
│   ├── services/        # Business logic (matching, notifications)
│   ├── socket/          # Socket.io handlers
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context providers
│   │   ├── services/    # API and socket services
│   │   ├── hooks/       # Custom hooks
│   │   ├── utils/       # Helper functions
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (with search/filter)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile

### Skills
- `GET /api/skills` - Get all skills
- `POST /api/skills` - Create a new skill
- `POST /api/skills/offered` - Add skill to user's offered skills
- `DELETE /api/skills/offered/:skillId` - Remove offered skill
- `POST /api/skills/requested` - Add skill to user's requested skills
- `DELETE /api/skills/requested/:skillId` - Remove requested skill

### Matches
- `GET /api/matches/potential` - Get potential matches
- `GET /api/matches` - Get user's matches
- `POST /api/matches` - Create a match
- `PUT /api/matches/:id` - Update match status

### Sessions
- `GET /api/sessions` - Get user's sessions
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create a session
- `PUT /api/sessions/:id` - Update session

### Credits
- `GET /api/credits/balance` - Get credit balance
- `GET /api/credits/transactions` - Get transaction history

## Socket.io Events

### Client to Server
- `join` - Join with user ID
- `joinMatch` - Join a match room
- `sendMessage` - Send a message
- `typing` - Send typing indicator
- `markAsRead` - Mark message as read

### Server to Client
- `newMessage` - New message received
- `typing` - User is typing
- `messageRead` - Message was read
- `userOnline` - User came online
- `userOffline` - User went offline

## Matching Algorithm

The matching algorithm considers:
- Skill compatibility (mutual exchange opportunity)
- User ratings (as teacher)
- Teaching experience (total sessions taught)
- Credit availability
- Activity level

Match scores range from 0-100, with only matches scoring 30+ being shown.

## Credit System

- New users start with 5 credits
- 1 credit = 1 hour of learning
- Credits are earned when teaching a session
- Credits are spent when scheduling a learning session
- Credits are transferred from learner to teacher upon session completion

## Development

### Running in Development Mode

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## Environment Variables

### Backend
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT expiration time
- `NODE_ENV` - Environment (development/production)
- `CLIENT_URL` - Frontend URL for CORS

### Frontend
- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.io server URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on the repository.

