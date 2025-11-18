import { useState } from 'react'
import './App.css'

function App() {
  const [userId, setUserId] = useState('')
  const [userData, setUserData] = useState(null)
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
        )}
      </div>
    </div>
  )
}

export default App
