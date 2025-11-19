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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userOffset, setUserOffset] = useState(0)
  const [hasMoreUsers, setHasMoreUsers] = useState(true)
  const [conversationTitle, setConversationTitle] = useState('')
  const [showChartNoteModal, setShowChartNoteModal] = useState(false)
  const [formTemplates, setFormTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [formAnswers, setFormAnswers] = useState({})
  const [creatingChartNote, setCreatingChartNote] = useState(false)
  const [showChartNotesPane, setShowChartNotesPane] = useState(false)
  const [chartNotes, setChartNotes] = useState([])
  const [loadingChartNotes, setLoadingChartNotes] = useState(false)
  const [chartNotesOffset, setChartNotesOffset] = useState(0)
  const [chartNoteTargetUser, setChartNoteTargetUser] = useState(null)
  const [chartNoteUsers, setChartNoteUsers] = useState([])
  const [chartNoteUserSearchQuery, setChartNoteUserSearchQuery] = useState('')
  const [chartNoteUserOffset, setChartNoteUserOffset] = useState(0)
  const [hasMoreChartNoteUsers, setHasMoreChartNoteUsers] = useState(true)
  const [loadingChartNoteUsers, setLoadingChartNoteUsers] = useState(false)

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

  const fetchUsers = async (offset = 0, keywords = '', append = false) => {
    setLoadingUsers(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (offset > 0) params.append('offset', offset.toString())
      if (keywords) params.append('keywords', keywords)

      const url = `http://localhost:3001/api/users${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      if (data.users) {
        if (append) {
          setAvailableUsers(prev => [...prev, ...data.users])
        } else {
          setAvailableUsers(data.users)
        }
        // If we got less than 10 users (typical page size), there are no more
        setHasMoreUsers(data.users.length >= 10)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleCreateConversation = async () => {
    setShowCreateModal(true)
    setUserSearchQuery('')
    setUserOffset(0)
    setAvailableUsers([])
    setHasMoreUsers(true)
    setConversationTitle('')
    await fetchUsers(0, '')
  }

  const handleUserSearch = async (searchQuery) => {
    setUserSearchQuery(searchQuery)
    setUserOffset(0)
    setAvailableUsers([])
    setHasMoreUsers(true)
    await fetchUsers(0, searchQuery)
  }

  const handleLoadMoreUsers = async () => {
    const newOffset = userOffset + 10
    setUserOffset(newOffset)
    await fetchUsers(newOffset, userSearchQuery, true)
  }

  const handleSelectUser = async (selectedUser) => {
    if (!userData) {
      setError('Please look up a user first')
      return
    }

    setCreatingConversation(true)
    setError(null)

    try {
      const requestBody = {
        clinicianId: userData.id,
        patientId: selectedUser.id,
      }

      // Add name if provided
      if (conversationTitle.trim()) {
        requestBody.name = conversationTitle.trim()
      }

      const response = await fetch('http://localhost:3001/api/create-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create conversation')
      }

      if (data.createConversation && data.createConversation.conversation) {
        const newConversation = data.createConversation.conversation

        // Add the new conversation to the list
        setConversations(prev => [newConversation, ...prev])

        // Close the modal
        setShowCreateModal(false)
        setAvailableUsers([])

        // Optionally, open the new conversation
        handleConversationClick(newConversation)
      }
    } catch (err) {
      console.error('Error creating conversation:', err)
      setError(err.message)
    } finally {
      setCreatingConversation(false)
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setAvailableUsers([])
    setUserSearchQuery('')
    setUserOffset(0)
    setHasMoreUsers(true)
    setConversationTitle('')
    setError(null)
  }

  const handleCreateChartNote = async () => {
    setShowChartNoteModal(true)
    setChartNoteTargetUser(null)
    setSelectedTemplate(null)
    setFormAnswers({})
    setChartNoteUsers([])
    setChartNoteUserSearchQuery('')
    setChartNoteUserOffset(0)
    setHasMoreChartNoteUsers(true)
    setError(null)

    // Fetch initial users
    fetchChartNoteUsers(0, '')
  }

  const fetchChartNoteUsers = async (offset = 0, keywords = '') => {
    setLoadingChartNoteUsers(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (keywords) params.append('keywords', keywords)
      params.append('offset', offset.toString())

      const response = await fetch(`http://localhost:3001/api/users?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      const users = data.users || []

      if (offset === 0) {
        setChartNoteUsers(users)
      } else {
        setChartNoteUsers(prev => [...prev, ...users])
      }

      setChartNoteUserOffset(offset)
      setHasMoreChartNoteUsers(users.length === 10)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message)
    } finally {
      setLoadingChartNoteUsers(false)
    }
  }

  const handleChartNoteUserSearch = (e) => {
    e.preventDefault()
    fetchChartNoteUsers(0, chartNoteUserSearchQuery)
  }

  const handleLoadMoreChartNoteUsers = () => {
    const newOffset = chartNoteUserOffset + 10
    fetchChartNoteUsers(newOffset, chartNoteUserSearchQuery)
  }

  const handleChartNoteUserSelect = async (user) => {
    setChartNoteTargetUser(user)
    setLoadingTemplates(true)
    setError(null)

    try {
      // Fetch charting templates only (use_for_charting = true)
      const response = await fetch('http://localhost:3001/api/form-templates?keywords=charting')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch form templates')
      }

      // Filter to only show templates with use_for_charting = true
      const chartingTemplates = data.customModuleForms?.filter(t => t.use_for_charting) || []
      setFormTemplates(chartingTemplates)
    } catch (err) {
      console.error('Error fetching form templates:', err)
      setError(err.message)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleCloseChartNoteModal = () => {
    setShowChartNoteModal(false)
    setChartNoteTargetUser(null)
    setSelectedTemplate(null)
    setFormAnswers({})
    setFormTemplates([])
    setChartNoteUsers([])
    setChartNoteUserSearchQuery('')
    setChartNoteUserOffset(0)
    setHasMoreChartNoteUsers(true)
    setError(null)
  }

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    // Initialize form answers with empty values
    const initialAnswers = {}
    template.custom_modules?.forEach(module => {
      if (module.mod_type !== 'label') {
        initialAnswers[module.id] = ''
      }
    })
    setFormAnswers(initialAnswers)
  }

  const handleFormFieldChange = (moduleId, value) => {
    setFormAnswers(prev => ({
      ...prev,
      [moduleId]: value
    }))
  }

  const handleSubmitChartNote = async (e) => {
    e.preventDefault()

    if (!chartNoteTargetUser || !selectedTemplate) {
      return
    }

    setCreatingChartNote(true)
    setError(null)

    try {
      // Convert formAnswers object to array format expected by API
      const formAnswersArray = Object.entries(formAnswers)
        .filter(([_, value]) => value !== '') // Only include non-empty answers
        .map(([custom_module_id, answer]) => ({
          custom_module_id,
          answer: String(answer) // Ensure answer is a string
        }))

      const response = await fetch('http://localhost:3001/api/create-chart-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: chartNoteTargetUser.id,
          formId: selectedTemplate.id,
          formAnswers: formAnswersArray,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chart note')
      }

      if (data.createFormAnswerGroup && data.createFormAnswerGroup.form_answer_group) {
        // Success! Close the modal
        alert(`Chart note created successfully! ID: ${data.createFormAnswerGroup.form_answer_group.id}`)
        handleCloseChartNoteModal()

        // Refresh chart notes list if the pane is open
        if (showChartNotesPane) {
          fetchChartNotes(0, false)
        }
      }
    } catch (err) {
      console.error('Error creating chart note:', err)
      setError(err.message)
    } finally {
      setCreatingChartNote(false)
    }
  }

  const fetchChartNotes = async (offset = 0, append = false) => {
    if (!userData) return

    setLoadingChartNotes(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:3001/api/chart-notes?fillerId=${userData.id}&offset=${offset}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch chart notes')
      }

      const notes = data.formAnswerGroups || []

      if (append) {
        setChartNotes(prev => [...prev, ...notes])
      } else {
        setChartNotes(notes)
      }

      setChartNotesOffset(offset)
    } catch (err) {
      console.error('Error fetching chart notes:', err)
      setError(err.message)
    } finally {
      setLoadingChartNotes(false)
    }
  }

  const handleShowChartNotes = () => {
    setShowChartNotesPane(true)
    setSelectedConversation(null)
    fetchChartNotes(0, false)
  }

  const handleLoadMoreChartNotes = () => {
    const newOffset = chartNotesOffset + 10
    fetchChartNotes(newOffset, true)
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
              {/* Tabs for switching between Conversations and Chart Notes */}
              <div className="tabs-container">
                <button
                  className={`tab-button ${!showChartNotesPane ? 'active' : ''}`}
                  onClick={() => {
                    setShowChartNotesPane(false)
                    setSelectedConversation(null)
                  }}
                >
                  Conversations
                </button>
                <button
                  className={`tab-button ${showChartNotesPane ? 'active' : ''}`}
                  onClick={handleShowChartNotes}
                  disabled={!userData}
                >
                  Chart Notes
                </button>
              </div>

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
              ) : showChartNotesPane ? (
                <>
                  {/* Chart Notes Pane */}
                  <div className="conversations-header">
                    <h2>Chart Notes</h2>
                    <div className="conversations-header-actions">
                      {chartNotes.length > 0 && (
                        <div className="conversation-count">
                          Total: {chartNotes.length}
                        </div>
                      )}
                      <button
                        onClick={handleCreateChartNote}
                        className="create-conversation-button"
                        disabled={!userData}
                      >
                        + New Chart Note
                      </button>
                    </div>
                  </div>

                  {loadingChartNotes && chartNotes.length === 0 ? (
                    <div className="loading-messages">Loading chart notes...</div>
                  ) : chartNotes.length > 0 ? (
                    <>
                      <div className="conversations-list">
                        {chartNotes.map((note) => (
                          <div key={note.id} className="conversation-item chart-note-item">
                            <div className="conversation-header">
                              <h3 className="conversation-name">
                                {note.name || 'Untitled Chart Note'}
                              </h3>
                              <span className="conversation-id">ID: {note.id}</span>
                            </div>

                            <div className="chart-note-details">
                              <div className="detail-row">
                                <strong>Patient:</strong>
                                <span>
                                  {note.user?.first_name} {note.user?.last_name}
                                  {note.user?.id && ` (ID: ${note.user.id})`}
                                </span>
                              </div>
                              <div className="detail-row">
                                <strong>Template:</strong>
                                <span>{note.custom_module_form?.name || 'N/A'}</span>
                              </div>
                              <div className="detail-row">
                                <strong>Created:</strong>
                                <span>{new Date(note.created_at).toLocaleString()}</span>
                              </div>
                              <div className="detail-row">
                                <strong>Status:</strong>
                                <span className={note.finished ? 'status-finished' : 'status-draft'}>
                                  {note.finished ? 'Finished' : 'Draft'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="load-more-container">
                        <button
                          onClick={handleLoadMoreChartNotes}
                          className="pagination-button"
                          disabled={loadingChartNotes}
                        >
                          {loadingChartNotes ? 'Loading...' : 'Load More'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="no-conversations">
                      No chart notes found for this user.
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Conversations Pane */}
                  <div className="conversations-header">
                    <h2>Conversations</h2>
                    <div className="conversations-header-actions">
                      {conversations.length > 0 && (
                        <div className="conversation-count">
                          Total: {conversations.length}
                        </div>
                      )}
                      <button
                        onClick={handleCreateConversation}
                        className="create-conversation-button"
                        disabled={!userData}
                      >
                        + New Conversation
                      </button>
                    </div>
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

        {/* Create Conversation Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Conversation</h2>
                <button onClick={handleCloseModal} className="modal-close-button">
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="conversation-title-container">
                  <label htmlFor="conversation-title" className="conversation-title-label">
                    Conversation Title (Optional)
                  </label>
                  <input
                    id="conversation-title"
                    type="text"
                    placeholder="Enter a title for this conversation..."
                    value={conversationTitle}
                    onChange={(e) => setConversationTitle(e.target.value)}
                    className="conversation-title-input"
                    disabled={loadingUsers || creatingConversation}
                  />
                </div>

                <div className="user-search-container">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="user-search-input"
                    disabled={loadingUsers}
                  />
                </div>

                {loadingUsers && availableUsers.length === 0 ? (
                  <div className="loading-users">Loading users...</div>
                ) : (
                  <>
                    {availableUsers.length === 0 ? (
                      <p className="no-users-message">
                        {userSearchQuery ? 'No users found matching your search.' : 'No users available.'}
                      </p>
                    ) : (
                      <>
                        <p className="modal-description">
                          Select a user to start a conversation with:
                        </p>
                        <div className="users-list">
                          {availableUsers.map((user) => (
                            <div
                              key={user.id}
                              className="user-item"
                              onClick={() => !creatingConversation && handleSelectUser(user)}
                              style={{ cursor: creatingConversation ? 'not-allowed' : 'pointer' }}
                            >
                              <div className="user-info">
                                <div className="user-name">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="user-details-small">
                                  <span className="user-id">ID: {user.id}</span>
                                  {user.email && <span className="user-email">{user.email}</span>}
                                </div>
                              </div>
                              {creatingConversation ? (
                                <span className="creating-indicator">Creating...</span>
                              ) : (
                                <span className="select-arrow">→</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {hasMoreUsers && (
                          <div className="load-more-container">
                            <button
                              onClick={handleLoadMoreUsers}
                              className="load-more-button"
                              disabled={loadingUsers}
                            >
                              {loadingUsers ? 'Loading...' : 'Load More'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Chart Note Modal */}
        {showChartNoteModal && (
          <div className="modal-overlay" onClick={handleCloseChartNoteModal}>
            <div className="modal-content chart-note-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create Chart Note</h2>
                <button onClick={handleCloseChartNoteModal} className="modal-close-button">
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {!chartNoteTargetUser ? (
                  <>
                    {/* Step 1: Select Target User */}
                    <p className="modal-description">Select a patient for this chart note:</p>

                    <form onSubmit={handleChartNoteUserSearch} className="user-search-form">
                      <input
                        type="text"
                        value={chartNoteUserSearchQuery}
                        onChange={(e) => setChartNoteUserSearchQuery(e.target.value)}
                        placeholder="Search by name..."
                        className="user-search-input"
                      />
                      <button type="submit" className="search-button-small">
                        Search
                      </button>
                    </form>

                    {loadingChartNoteUsers && chartNoteUsers.length === 0 ? (
                      <div className="loading-users">Loading users...</div>
                    ) : chartNoteUsers.length > 0 ? (
                      <>
                        <div className="users-list">
                          {chartNoteUsers.map((user) => (
                            <div
                              key={user.id}
                              className="user-item"
                              onClick={() => handleChartNoteUserSelect(user)}
                            >
                              <div className="user-info">
                                <div className="user-name">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="user-id">ID: {user.id}</div>
                              </div>
                              <span className="select-arrow">→</span>
                            </div>
                          ))}
                        </div>

                        {hasMoreChartNoteUsers && (
                          <div className="load-more-container">
                            <button
                              type="button"
                              onClick={handleLoadMoreChartNoteUsers}
                              className="pagination-button"
                              disabled={loadingChartNoteUsers}
                            >
                              {loadingChartNoteUsers ? 'Loading...' : 'Load More'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="no-users-message">No users found.</p>
                    )}
                  </>
                ) : loadingTemplates ? (
                  <div className="loading-users">Loading templates...</div>
                ) : !selectedTemplate ? (
                  <>
                    {/* Step 2: Select Template */}
                    <div className="selected-user-info">
                      <strong>Patient:</strong> {chartNoteTargetUser.first_name} {chartNoteTargetUser.last_name} (ID: {chartNoteTargetUser.id})
                      <button
                        type="button"
                        onClick={() => setChartNoteTargetUser(null)}
                        className="change-user-button"
                      >
                        Change Patient
                      </button>
                    </div>

                    {formTemplates.length === 0 ? (
                      <p className="no-users-message">No charting templates available.</p>
                    ) : (
                      <>
                        <p className="modal-description">Select a template:</p>
                        <div className="templates-list">
                          {formTemplates.map((template) => (
                            <div
                              key={template.id}
                              className="template-item"
                              onClick={() => handleTemplateSelect(template)}
                            >
                              <div className="template-info">
                                <div className="template-name">{template.name}</div>
                                <div className="template-details">
                                  {template.custom_modules?.length || 0} fields
                                </div>
                              </div>
                              <span className="select-arrow">→</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleSubmitChartNote} className="chart-note-form">
                    <div className="form-header">
                      <h3>{selectedTemplate.name}</h3>
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate(null)}
                        className="back-button"
                      >
                        ← Back to Templates
                      </button>
                    </div>

                    <div className="form-fields">
                      {selectedTemplate.custom_modules?.map((module) => {
                        if (module.mod_type === 'label') {
                          return (
                            <div key={module.id} className="form-field-label">
                              <strong>{module.label}</strong>
                            </div>
                          )
                        }

                        const value = formAnswers[module.id] || ''

                        return (
                          <div key={module.id} className="form-field">
                            <label htmlFor={`field-${module.id}`} className="field-label">
                              {module.label}
                              {module.required && <span className="required-indicator">*</span>}
                            </label>

                            {module.mod_type === 'text' && (
                              <input
                                id={`field-${module.id}`}
                                type="text"
                                value={value}
                                onChange={(e) => handleFormFieldChange(module.id, e.target.value)}
                                className="field-input"
                                required={module.required}
                                placeholder={module.options || ''}
                              />
                            )}

                            {module.mod_type === 'textarea' && (
                              <textarea
                                id={`field-${module.id}`}
                                value={value}
                                onChange={(e) => handleFormFieldChange(module.id, e.target.value)}
                                className="field-textarea"
                                required={module.required}
                                rows={4}
                              />
                            )}

                            {module.mod_type === 'number' && (
                              <input
                                id={`field-${module.id}`}
                                type="number"
                                value={value}
                                onChange={(e) => handleFormFieldChange(module.id, e.target.value)}
                                className="field-input"
                                required={module.required}
                              />
                            )}

                            {module.mod_type === 'date' && (
                              <input
                                id={`field-${module.id}`}
                                type="date"
                                value={value}
                                onChange={(e) => handleFormFieldChange(module.id, e.target.value)}
                                className="field-input"
                                required={module.required}
                              />
                            )}

                            {module.mod_type === 'time' && (
                              <input
                                id={`field-${module.id}`}
                                type="time"
                                value={value}
                                onChange={(e) => handleFormFieldChange(module.id, e.target.value)}
                                className="field-input"
                                required={module.required}
                              />
                            )}

                            {(module.mod_type === 'dropdown' || module.mod_type === 'radio') && (
                              <select
                                id={`field-${module.id}`}
                                value={value}
                                onChange={(e) => handleFormFieldChange(module.id, e.target.value)}
                                className="field-select"
                                required={module.required}
                              >
                                <option value="">Select an option...</option>
                                {module.options?.split('\n').map((option, idx) => (
                                  <option key={idx} value={option.trim()}>
                                    {option.trim()}
                                  </option>
                                ))}
                              </select>
                            )}

                            {module.mod_type === 'checkbox' && (
                              <div className="checkbox-group">
                                {module.options?.split('\n').map((option, idx) => (
                                  <label key={idx} className="checkbox-label">
                                    <input
                                      type="checkbox"
                                      value={option.trim()}
                                      checked={value.includes(option.trim())}
                                      onChange={(e) => {
                                        const optionValue = option.trim()
                                        const currentValues = value ? value.split(', ') : []
                                        const newValues = e.target.checked
                                          ? [...currentValues, optionValue]
                                          : currentValues.filter(v => v !== optionValue)
                                        handleFormFieldChange(module.id, newValues.join(', '))
                                      }}
                                    />
                                    {option.trim()}
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="submit-button"
                        disabled={creatingChartNote}
                      >
                        {creatingChartNote ? 'Creating...' : 'Create Chart Note'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

