import { useState } from 'react'
import './App.css'

function App() {
  const [userId, setUserId] = useState('')
  const [userData, setUserData] = useState(null)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!userId.trim()) {
      setError('Please enter a user ID')
      return
    }

    setLoading(true)
    setError(null)
    setUserData(null)
    setConversations([])

    try {
      const response = await fetch('http://localhost:3001/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user data')
      }

      if (data.user) {
        setUserData(data.user)
        // Extract conversations from conversationMemberships
        const convos = data.conversationMemberships?.map(membership => membership.convo) || []
        setConversations(convos)
      } else {
        setError('User not found')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Healthie User Lookup</h1>

        <form onSubmit={handleSubmit} className="search-form">
          <div className="input-group">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter User ID"
              className="user-input"
              disabled={loading}
            />
            <button type="submit" disabled={loading} className="search-button">
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {userData && (
          <>
            <div className="user-card">
              <h2>User Information</h2>
              <div className="user-details">
                <div className="detail-row">
                  <span className="label">ID:</span>
                  <span className="value">{userData.id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span className="value">
                    {userData.first_name} {userData.last_name}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{userData.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{userData.phone_number || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date of Birth:</span>
                  <span className="value">{userData.dob || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Gender:</span>
                  <span className="value">{userData.gender || 'N/A'}</span>
                </div>
                {userData.location && (
                  <>
                    <div className="detail-row">
                      <span className="label">Address:</span>
                      <span className="value">
                        {userData.location.line1}
                        {userData.location.line2 && `, ${userData.location.line2}`}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">City, State ZIP:</span>
                      <span className="value">
                        {userData.location.city}, {userData.location.state} {userData.location.zip}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="conversations-card">
              <h2>Conversations</h2>
              {conversations && conversations.length > 0 ? (
                <div className="conversations-list">
                  {conversations.map((conversation) => {
                    // Get other participants (exclude the current user)
                    const otherParticipants = conversation.invitees
                      ?.filter(invitee => invitee.id !== userData.id) || [];

                    const messageCount = conversation.notes?.length || 0;

                    return (
                      <div key={conversation.id} className="conversation-item">
                        <div className="conversation-header">
                          <h3 className="conversation-name">
                            {conversation.name || 'Untitled Conversation'}
                          </h3>
                          <span className="conversation-id">ID: {conversation.id}</span>
                        </div>

                        {otherParticipants.length > 0 && (
                          <div className="conversation-participants">
                            <strong>Participants:</strong>
                            {otherParticipants.map((participant, index) => (
                              <div key={participant.id} className="participant-info">
                                <span className="participant-name">
                                  {participant.first_name} {participant.last_name}
                                </span>
                                <span className="participant-id">(ID: {participant.id})</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="conversation-stats">
                          <span className="message-count">
                            <strong>Messages:</strong> {messageCount}
                          </span>
                        </div>

                        {conversation.last_message_content && (
                          <div className="conversation-last-message">
                            <strong>Last message:</strong> {conversation.last_message_content}
                          </div>
                        )}

                        <div className="conversation-meta">
                          {conversation.owner && (
                            <div className="conversation-owner">
                              <strong>Owner:</strong> {conversation.owner.first_name} {conversation.owner.last_name}
                            </div>
                          )}
                          <div className="conversation-dates">
                            <div>
                              <strong>Created:</strong> {new Date(conversation.created_at).toLocaleString()}
                            </div>
                            <div>
                              <strong>Updated:</strong> {new Date(conversation.updated_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-conversations">
                  No conversations found for this user.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
