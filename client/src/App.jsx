import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [userId, setUserId] = useState('')
  const [userData, setUserData] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [conversationMessages, setConversationMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)

  const wsRef = useRef(null)
  const channelIdRef = useRef(null)
  const messagesEndRef = useRef(null)

  const CONVERSATIONS_PER_PAGE = 2

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
    setCurrentPage(0)
    setSelectedConversation(null)
    setConversationMessages([])

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

  const handleConversationClick = async (conversation) => {
    setSelectedConversation(conversation)
    setLoadingMessages(true)
    setConversationMessages([])

    try {
      const response = await fetch('http://localhost:3001/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId: conversation.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversation data')
      }

      if (data.conversation && data.conversation.notes) {
        setConversationMessages(data.conversation.notes)
      }
    } catch (err) {
      console.error('Error fetching conversation:', err)
      setError(err.message)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
    setConversationMessages([])
    setNewMessage('')
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim()) {
      return
    }

    setSendingMessage(true)

    try {
      const response = await fetch('http://localhost:3001/api/create-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage.trim(),
          userId: userData.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      if (data.createNote && data.createNote.note) {
        // Note: Don't add the message here - the WebSocket subscription will handle it
        setNewMessage('')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err.message)
    } finally {
      setSendingMessage(false)
    }
  }

  // Polling effect - check for new messages every 3 seconds
  useEffect(() => {
    if (!selectedConversation) {
      return
    }

    console.log('🔄 Starting polling for conversation:', selectedConversation.id)

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:3001/api/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: selectedConversation.id
          })
        })

        const data = await response.json()

        if (data.conversation && data.conversation.notes) {
          const newMessages = data.conversation.notes

          setConversationMessages(prevMessages => {
            // Check if there are any new messages
            const prevIds = new Set(prevMessages.map(msg => msg.id))
            const hasNewMessages = newMessages.some(msg => !prevIds.has(msg.id))

            if (hasNewMessages) {
              console.log('✨ New messages detected via polling!')
              return newMessages
            }

            return prevMessages
          })
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 3000) // Poll every 3 seconds

    return () => {
      console.log('🛑 Stopping polling for conversation:', selectedConversation.id)
      clearInterval(pollInterval)
    }
  }, [selectedConversation])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversationMessages])

  // WebSocket subscription effect (keeping for future use, but not critical)
  useEffect(() => {
    if (!selectedConversation) {
      // Clean up WebSocket when no conversation is selected
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
        channelIdRef.current = null
        setWsConnected(false)
      }
      return
    }

    // Fetch WebSocket URL from backend and set up connection
    const setupWebSocket = async () => {
      try {
        // Get WebSocket URL with API key from backend
        const response = await fetch('http://localhost:3001/api/websocket-url')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get WebSocket URL')
        }

        const wsUrl = data.wsUrl

        // Generate a unique channel ID
        const channelId = Math.round(Date.now() + Math.random() * 100000).toString(16)
        channelIdRef.current = channelId

        console.log('🔌 Creating WebSocket connection...')
        console.log('WebSocket URL (without token):', wsUrl.split('?')[0])
        console.log('Channel ID:', channelId)
        console.log('Conversation ID:', selectedConversation.id)

        // Create WebSocket connection
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

    // Set up message handler BEFORE connection opens
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        // Log ALL messages including pings for debugging
        console.log('WebSocket RAW message:', JSON.stringify(message, null, 2))

        // Check for errors or rejections
        if (message.type === 'reject_subscription') {
          console.error('❌ Subscription rejected:', message)
        }

        if (message.message && typeof message.message === 'object' && message.message.errors) {
          console.error('❌ GraphQL errors:', message.message.errors)
        }

        // Handle welcome message
        if (message.type === 'welcome') {
          console.log('✅ Received welcome message! Subscribing to channel...')
          console.log('Channel ID:', channelId)

          // Subscribe to the channel
          const subscribeMessage = {
            command: 'subscribe',
            identifier: JSON.stringify({
              channel: 'GraphqlChannel',
              channelId: channelId
            })
          }
          console.log('Sending subscribe command:', JSON.stringify(subscribeMessage, null, 2))
          ws.send(JSON.stringify(subscribeMessage))
        }

        // Handle subscription confirmation
        if (message.type === 'confirm_subscription') {
          console.log('✅ Subscription confirmed! Setting up noteAddedSubscription...')
          console.log('Conversation ID:', selectedConversation.id)

          // Try the exact format from Healthie docs - JSON stringified with query and variables
          const subscriptionData = JSON.stringify({
            query: `subscription onNoteAddedSubscription($id: String) {
  noteAddedSubscription(conversationId: $id) {
    id
    content
    created_at
    updated_at
    creator {
      id
      first_name
      last_name
    }
  }
}`,
            variables: {
              id: selectedConversation.id
            }
          })

          console.log('Sending GraphQL subscription data:', subscriptionData)

          const messageCommand = {
            command: 'message',
            identifier: JSON.stringify({
              channel: 'GraphqlChannel',
              channelId: channelId
            }),
            data: subscriptionData
          }

          console.log('Full message command:', JSON.stringify(messageCommand, null, 2))
          ws.send(JSON.stringify(messageCommand))
        }

        // Handle subscription data (new notes)
        // Check multiple possible message structures
        let noteData = null

        // Check if this is a subscription data message (has identifier and message properties)
        if (message.identifier && message.message) {
          console.log('📨 Potential subscription data message detected!')
          console.log('Identifier:', message.identifier)
          console.log('Message:', JSON.stringify(message.message, null, 2))

          // Structure 1: message.message.result.data.noteAddedSubscription
          if (message.message.result && message.message.result.data) {
            noteData = message.message.result.data.noteAddedSubscription
            console.log('✅ Found noteData in message.message.result.data.noteAddedSubscription')
          }
        }

        if (noteData) {
          console.log('🎉 New note received via WebSocket:', noteData)
          // Add the new note to the conversation messages
          setConversationMessages(prevMessages => {
            // Check if message already exists to avoid duplicates
            const exists = prevMessages.some(msg => msg.id === noteData.id)
            if (exists) {
              console.log('Note already exists, skipping:', noteData.id)
              return prevMessages
            }
            console.log('Adding new note to conversation:', noteData.id)
            return [...prevMessages, noteData]
          })
        }
      } catch (err) {
        console.error('❌ Error parsing WebSocket message:', err, event.data)
      }
    }

        ws.onopen = () => {
          console.log('✅ WebSocket connected! Waiting for welcome message...')
          setWsConnected(true)
        }

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          setWsConnected(false)
        }

        ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason)
          setWsConnected(false)
        }

        // Cleanup on unmount or conversation change
        return () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close()
          }
        }
      } catch (err) {
        console.error('❌ Error setting up WebSocket:', err)
        setError(err.message)
        setWsConnected(false)
      }
    }

    setupWebSocket()

    // Cleanup function
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [selectedConversation])

  const totalPages = Math.ceil(conversations.length / CONVERSATIONS_PER_PAGE)
  const startIndex = currentPage * CONVERSATIONS_PER_PAGE
  const endIndex = startIndex + CONVERSATIONS_PER_PAGE
  const currentConversations = conversations.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
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
              {selectedConversation ? (
                <>
                  <div className="conversation-detail-header">
                    <div className="header-top">
                      <button onClick={handleBackToList} className="back-button">
                        ← Back to Conversations
                      </button>
                      <div className={`ws-status ${wsConnected ? 'connected' : 'disconnected'}`}>
                        <span className="ws-indicator"></span>
                        {wsConnected ? 'Live' : 'Connecting...'}
                      </div>
                    </div>
                    <h2>{selectedConversation.name || 'Untitled Conversation'}</h2>
                  </div>

                  {loadingMessages ? (
                    <div className="loading-messages">Loading messages...</div>
                  ) : (
                    <>
                      <div className="messages-container">
                        {conversationMessages.length > 0 ? (
                          <>
                            {conversationMessages.map((message) => {
                              const isCurrentUser = message.creator?.id === userData.id
                              return (
                                <div
                                  key={message.id}
                                  className={`message ${isCurrentUser ? 'message-sent' : 'message-received'}`}
                                >
                                  <div className="message-header">
                                    <span className="message-sender">
                                      {message.creator?.first_name} {message.creator?.last_name}
                                    </span>
                                    <span className="message-time">
                                      {new Date(message.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="message-content">
                                    {message.content || '(No content)'}
                                  </div>
                                </div>
                              )
                            })}
                            <div ref={messagesEndRef} />
                          </>
                        ) : (
                          <div className="no-messages">No messages in this conversation</div>
                        )}
                      </div>

                      <form onSubmit={handleSendMessage} className="message-input-form">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="message-input"
                          disabled={sendingMessage}
                        />
                        <button
                          type="submit"
                          disabled={sendingMessage || !newMessage.trim()}
                          className="send-button"
                        >
                          {sendingMessage ? 'Sending...' : 'Send'}
                        </button>
                      </form>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="conversations-header">
                    <h2>Conversations</h2>
                    {conversations.length > 0 && (
                      <div className="conversation-count">
                        Total: {conversations.length}
                      </div>
                    )}
                  </div>

                  {conversations && conversations.length > 0 ? (
                    <>
                      <div className="conversations-list">
                        {currentConversations.map((conversation) => {
                          const otherParticipants = conversation.invitees
                            ?.filter(invitee => invitee.id !== userData.id) || []
                          const messageCount = conversation.notes?.length || 0

                          return (
                            <div
                              key={conversation.id}
                              className="conversation-item"
                              onClick={() => handleConversationClick(conversation)}
                            >
                              <div className="conversation-header">
                                <h3 className="conversation-name">
                                  {conversation.name || 'Untitled Conversation'}
                                </h3>
                                <span className="conversation-id">ID: {conversation.id}</span>
                              </div>

                              {otherParticipants.length > 0 && (
                                <div className="conversation-participants">
                                  <strong>Participants:</strong>
                                  {otherParticipants.map((participant) => (
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
                          )
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="pagination-controls">
                          <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 0}
                            className="pagination-button"
                          >
                            ← Previous
                          </button>
                          <span className="pagination-info">
                            Page {currentPage + 1} of {totalPages}
                          </span>
                          <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages - 1}
                            className="pagination-button"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-conversations">
                      No conversations found for this user.
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App

