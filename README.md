# Healthie User Lookup App

A Node.js application with a React frontend that uses the Healthie API to look up and display user information.

## Features

- Search for users by ID
- Display user information including:
  - Name
  - Email
  - Phone number
  - Date of birth
  - Gender
  - Address

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
```

### 3. Get your Healthie API Key

1. Log in to your Healthie account
2. Go to Settings > API & Webhooks
3. Generate or copy your API key
4. Paste it in the `.env` file

## Running the Application

### Development Mode

You'll need two terminal windows:

**Terminal 1 - Backend Server:**
```bash
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
3. Click "Search" to fetch and display the user information

## API Endpoints

### Backend API

- `GET /api/health` - Health check endpoint
- `POST /api/user` - Fetch user information
  - Request body: `{ "userId": "user_id_here" }`
  - Returns user data from Healthie API

## Project Structure

```
.
├── server.js           # Express backend server
├── .env               # Environment variables (create this)
├── .env.example       # Example environment variables
├── package.json       # Backend dependencies
└── client/            # React frontend
    ├── src/
    │   ├── App.jsx    # Main React component
    │   ├── App.css    # Styles
    │   └── main.jsx   # React entry point
    └── package.json   # Frontend dependencies
```

## Technologies Used

### Backend
- Node.js
- Express
- Axios (for Healthie API calls)
- CORS
- dotenv

### Frontend
- React
- Vite
- CSS3

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

