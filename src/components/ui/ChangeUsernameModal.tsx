import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

const RESTRICTED_WORDS = ['owner', 'admin', 'dev', 'developer']

export function ChangeUsernameModal() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const changeUsername = useMutation(api.users.changeUsername)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    const lower = username.toLowerCase()
    if (RESTRICTED_WORDS.some((word) => lower.includes(word))) {
      setError('Username contains a restricted word')
      return
    }
    if (username.includes('[')) {
      setError('Username cannot contain "["')
      return
    }

    setLoading(true)
    try {
      await changeUsername({ newUsername: username.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change username')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">Username Change Required</h2>
        <p className="text-gray-600 text-sm mb-4">
          Your current username contains a restricted word (owner, admin, dev, developer, or "[").
          Please choose a new username to continue playing.
        </p>

        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="New username"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mb-4"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || username.trim().length < 3}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? 'Changing...' : 'Change Username'}
          </button>
        </form>
      </div>
    </div>
  )
}
