# Healthie Chat Application

A NestJS backend with a React frontend that uses the Healthie API to manage user conversations and messages.

## Features

- **User Lookup** - Search for users by ID via Healthie API
- **Conversation List** - Display all conversations for a user with pagination
- **Message Display** - View all messages in a conversation with a text-message style UI
- **Send Messages** - Send new messages via the input box
- **Real-time Updates** - New messages appear automatically within 3 seconds using polling
- **Auto-scroll** - Conversation automatically scrolls to show new messages as they appear
- **Environment Support** - Supports both production and staging Healthie environments

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Healthie API key

## Setup

### 1. Clone the repository and install dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Configure environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and add your Healthie API key:

```
HEALTHIE_API_KEY=your_healthie_api_key_here
PORT=3001

# Healthie environment: 'staging' or 'production'
# If not set, will auto-detect based on API key prefix (gh_sbox_ = staging)
HEALTHIE_ENV=staging
```

### 3. Get your Healthie API Key

1. Log in to your Healthie account
2. Go to Settings > API & Webhooks
3. Generate or copy your API key
4. Paste it in the `.env` file

## Running the Application

### Development Mode

You'll need two terminal windows:

**Terminal 1 - Backend Server (NestJS):**
```bash
# Development mode with auto-reload
npm run start:dev

# Or build and run production mode
npm run build
npm start
```

The backend server will run on `http://localhost:3001`

**Terminal 2 - Frontend Development Server:**
```bash
cd client
npm run dev
```

The frontend will run on `http://localhost:5173`

### Using the Application

1. Open your browser to `http://localhost:5173`
2. Enter a Healthie user ID in the input field
3. Click "Search" to fetch user information and conversations
4. Click on a conversation to view messages
5. Type a message in the input box and press Enter or click Send to send a message
6. New messages will appear automatically within 3 seconds

## API Endpoints

### Backend API

- `GET /api/health` - Health check endpoint
- `POST /api/user` - Fetch user information and conversations
  - Request body: `{ "userId": "user_id_here" }`
  - Returns user data and conversation list from Healthie API
- `POST /api/conversation` - Fetch conversation messages
  - Request body: `{ "conversationId": "conversation_id_here" }`
  - Returns conversation details and all messages
- `POST /api/create-note` - Create a new message in a conversation
  - Request body: `{ "conversationId": "conversation_id", "content": "message_content", "userId": "user_id" }`
  - Returns the created message
- `GET /api/websocket-url` - Get WebSocket URL for real-time updates
  - Returns WebSocket URL with authentication token

## Project Structure

```
.
├── src/                        # NestJS backend source
│   ├── main.ts                # Application entry point
│   ├── app.module.ts          # Root module
│   ├── dto/                   # Data Transfer Objects
│   │   ├── user-lookup.dto.ts
│   │   ├── conversation.dto.ts
│   │   └── create-note.dto.ts
│   └── healthie/              # Healthie module
│       ├── healthie.module.ts
│       ├── healthie.controller.ts
│       └── healthie.service.ts
├── server.js                  # Legacy Express server (deprecated)
├── tsconfig.json              # TypeScript configuration
├── .env                       # Environment variables (create this)
├── .env.example               # Example environment variables
├── package.json               # Backend dependencies
└── client/                    # React frontend
    ├── src/
    │   ├── App.jsx           # Main React component
    │   ├── App.css           # Styles
    │   └── main.jsx          # React entry point
    └── package.json          # Frontend dependencies
```

## Technologies Used

### Backend
- Node.js
- NestJS (TypeScript framework)
- TypeScript
- Axios (for Healthie API calls)
- @nestjs/config (environment configuration)
- RxJS (reactive programming)

### Frontend
- React
- Vite
- CSS3
- WebSocket (for real-time updates - currently using polling as fallback)

## Troubleshooting

### API Key Issues
- Make sure your `.env` file is in the root directory (not in the client folder)
- Verify your API key is correct and has the necessary permissions
- Check that the server logs show "Healthie API Key configured: Yes"

### CORS Issues
- The backend is configured to allow CORS from all origins
- Make sure the backend is running on port 3001

### User Not Found
- Verify the user ID exists in your Healthie account
- Check the browser console and server logs for error messages

## License

ISC

