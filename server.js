require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Healthie API configuration
// Use staging API for sandbox keys (starting with gh_sbox_)
const HEALTHIE_API_KEY = process.env.HEALTHIE_API_KEY;
const isSandboxKey = HEALTHIE_API_KEY && HEALTHIE_API_KEY.startsWith('gh_sbox_');
const HEALTHIE_API_URL = isSandboxKey
  ? 'https://staging-api.gethealthie.com/graphql'
  : 'https://api.gethealthie.com/graphql';

// GraphQL query to fetch user information
const getUserQuery = (userId) => `
  query {
    user(id: "${userId}") {
      id
      first_name
      last_name
      email
      phone_number
      dob
      gender
      location {
        line1
        line2
        city
        state
        zip
      }
    }
    conversations(user_id: "${userId}") {
      id
      name
      created_at
      updated_at
      last_message_content
      owner {
        id
        first_name
        last_name
      }
    }
  }
`;

// API endpoint to get user information
app.post('/api/user', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!HEALTHIE_API_KEY) {
      return res.status(500).json({ error: 'Healthie API key not configured' });
    }

    const response = await axios.post(
      HEALTHIE_API_URL,
      {
        query: getUserQuery(userId)
      },
      {
        headers: {
          'Authorization': `Bearer ${HEALTHIE_API_KEY}`,
          'AuthorizationSource': 'API',
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      return res.status(400).json({ 
        error: 'Error fetching user data', 
        details: response.data.errors 
      });
    }

    res.json(response.data.data);
  } catch (error) {
    console.error('Error fetching user data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch user data',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Healthie API URL: ${HEALTHIE_API_URL}`);
  console.log(`Healthie API Key configured: ${HEALTHIE_API_KEY ? 'Yes' : 'No'}`);
  console.log(`Environment: ${isSandboxKey ? 'Sandbox/Staging' : 'Production'}`);
});

