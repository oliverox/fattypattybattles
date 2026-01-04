import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'
import { MULTIPLAYER } from '@/lib/game/constants'

interface ChatUIProps {
  mapId: string
}

const EMOJIS = ['👋', '😊', '😂', '👍', '❤️', '🎮', '🔥', '✨', '💀', '😎', '😡', '😱', '🎉', '💥', '🤯']

export function ChatUI({ mapId }: ChatUIProps) {
  const chatOpen = useGameStore((state) => state.chatOpen)
  const setChatOpen = useGameStore((state) => state.setChatOpen)

  const [message, setMessage] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const messages = useQuery(api.multiplayer.getRecentMessages, { mapId })
  const sendMessage = useMutation(api.multiplayer.sendMessage)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && chatOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, chatOpen])

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && chatOpen) {
        setChatOpen(false)
        setShowEmojis(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [chatOpen, setChatOpen])

  const handleSend = async () => {
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      await sendMessage({ message: message.trim(), mapId })
      setMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji)
    setShowEmojis(false)
    inputRef.current?.focus()
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!chatOpen) {
    // Show recent messages preview when closed
    const recentMessages = messages?.slice(-3) ?? []
    if (recentMessages.length === 0) return null

    return (
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <div className="bg-black/40 rounded-lg p-2 max-w-xs">
          {recentMessages.map((msg) => (
            <div
              key={msg._id}
              className="text-white/70 text-sm truncate"
            >
              <span className="text-cyan-400">{msg.username}:</span> {msg.message}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-80">
      {/* Chat container */}
      <div className="bg-black/80 border border-cyan-500/50 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-cyan-900/50 border-b border-cyan-500/30">
          <span className="text-cyan-400 font-bold text-sm">Chat</span>
          <button
            onClick={() => setChatOpen(false)}
            className="text-white/70 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="h-48 overflow-y-auto p-2 space-y-1">
          {messages?.map((msg) => (
            <div key={msg._id} className="text-sm">
              <span className="text-white/50 text-xs mr-1">
                {formatTime(msg.timestamp)}
              </span>
              <span className="text-cyan-400 font-medium">{msg.username}: </span>
              <span className="text-white">{msg.message}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji picker */}
        {showEmojis && (
          <div className="flex flex-wrap gap-1 p-2 border-t border-cyan-500/30 bg-black/50">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="text-xl hover:bg-white/10 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 p-2 border-t border-cyan-500/30">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className={`text-lg px-2 py-1 rounded transition-colors ${
              showEmojis ? 'bg-cyan-500/30' : 'hover:bg-white/10'
            }`}
          >
            😊
          </button>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MULTIPLAYER.chatMaxLength))}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm placeholder-white/40 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>

        {/* Character count */}
        <div className="text-right text-xs text-white/30 px-2 pb-1">
          {message.length}/{MULTIPLAYER.chatMaxLength}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-white/50 text-xs mt-1 text-center">
        Press ESC to close
      </div>
    </div>
  )
}
