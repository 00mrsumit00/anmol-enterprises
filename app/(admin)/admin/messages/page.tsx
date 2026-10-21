'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Search,
  Send,
  Phone,
  MoreVertical,
  ExternalLink,
  CheckCheck,
  Check,
  Clock,
  User,
  ShoppingBag,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  isB2B: boolean
  businessName: string | null
}

interface OrderContext {
  id: string
  status: string
  totalAmount: number
  createdAt: string
}

interface Conversation {
  id: string
  customerId: string
  status: 'OPEN' | 'RESOLVED'
  orderId: string | null
  lastMessageAt: string
  lastMessagePreview: string | null
  unreadForAdmin: number
  unreadForCustomer: number
  customer: Customer
  order?: OrderContext | null
}

interface ChatMessage {
  id: string
  conversationId: string
  senderRole: 'CUSTOMER' | 'ADMIN'
  senderId: string
  body: string
  orderId: string | null
  readAt: string | null
  createdAt: string
}

export default function AdminMessagesPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const socket = useSocket()

  const [activeTab, setActiveTab] = useState<'1-ON-1' | 'COMMUNITY'>('1-ON-1')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({})
  const [menuOpen, setMenuOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch list of conversations
  const {
    data: convData,
    isLoading: convsLoading,
    refetch: refetchConvs,
  } = useQuery({
    queryKey: ['admin-conversations', searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/chat/conversations?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load conversations')
      return res.json() as Promise<{ conversations: Conversation[] }>
    },
    refetchInterval: 15000,
  })

  const conversations = convData?.conversations || []

  // Auto-select first conversation on initial load if none selected
  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id)
    }
  }, [conversations, selectedConvId])

  // Fetch messages for active conversation
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['admin-conversation-messages', selectedConvId],
    queryFn: async () => {
      if (!selectedConvId) return null
      const res = await fetch(`/api/admin/chat/${selectedConvId}/messages`)
      if (!res.ok) throw new Error('Failed to load messages')
      return res.json() as Promise<{ conversation: Conversation; messages: ChatMessage[] }>
    },
    enabled: !!selectedConvId,
    refetchInterval: 6000,
  })

  const activeConv = messagesData?.conversation || conversations.find((c) => c.id === selectedConvId)
  const messages = messagesData?.messages || []

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time socket event handling
  useEffect(() => {
    if (!socket) return

    // Socket joins admin room automatically in AdminLayout
    const handleNewMessage = (payload: { message: ChatMessage; conversationId: string }) => {
      // Refresh current conversation messages if active
      if (payload.conversationId === selectedConvId) {
        queryClient.invalidateQueries({ queryKey: ['admin-conversation-messages', selectedConvId] })
      }
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] })
    }

    const handlePresenceUpdate = (payload: { userId: string; online: boolean }) => {
      setOnlineUsers((prev) => ({ ...prev, [payload.userId]: payload.online }))
    }

    socket.on('chat:message', handleNewMessage)
    socket.on('presence:update', handlePresenceUpdate)

    // Check presence of all customers in list
    if (conversations.length > 0) {
      const uids = conversations.map((c) => c.customerId)
      socket.emit('presence:check', uids, (statusMap: Record<string, boolean>) => {
        if (statusMap) setOnlineUsers(statusMap)
      })
    }

    return () => {
      socket.off('chat:message', handleNewMessage)
      socket.off('presence:update', handlePresenceUpdate)
    }
  }, [socket, selectedConvId, conversations, queryClient])

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedConvId) throw new Error('No conversation selected')
      const res = await fetch(`/api/admin/chat/${selectedConvId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: text,
          clientMessageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to send reply')
      }
      return res.json()
    },
    onSuccess: () => {
      setReplyText('')
      queryClient.invalidateQueries({ queryKey: ['admin-conversation-messages', selectedConvId] })
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error sending reply', 'error')
    },
  })

  // Update status (OPEN / RESOLVED)
  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'OPEN' | 'RESOLVED') => {
      if (!selectedConvId) return
      const res = await fetch(`/api/admin/chat/${selectedConvId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: (_, newStatus) => {
      showToast(`Conversation marked as ${newStatus}`, 'success')
      setMenuOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-conversation-messages', selectedConvId] })
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] })
    },
  })

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || sendReplyMutation.isPending) return
    sendReplyMutation.mutate(replyText.trim())
  }

  // Format timestamp helper
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
      return ''
    }
  }

  const isCustomerOnline = activeConv?.customerId ? !!onlineUsers[activeConv.customerId] : false

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[600px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {/* ─── LEFT PANE: Conversation List ────────────────────────────────────────── */}
      <div className="w-80 md:w-96 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
        {/* Pane Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Messages
            </h1>

            {/* Toggle 1-ON-1 / COMMUNITY pill */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('1-ON-1')}
                className={`px-2.5 py-1 rounded-md transition ${
                  activeTab === '1-ON-1'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1-ON-1
              </button>
              <button
                onClick={() => setActiveTab('COMMUNITY')}
                className={`px-2.5 py-1 rounded-md transition ${
                  activeTab === 'COMMUNITY'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                BROADCAST
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats by name or phone..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5 text-xs">
            {(['ALL', 'OPEN', 'RESOLVED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-full font-medium transition ${
                  statusFilter === st
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
            <button
              onClick={() => {
                refetchConvs()
                if (selectedConvId) refetchMessages()
              }}
              title="Refresh"
              className="ml-auto p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {convsLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No conversations found.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === selectedConvId
              const online = !!onlineUsers[conv.customerId]
              const initial = conv.customer?.name ? conv.customer.name.charAt(0).toUpperCase() : 'C'

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-orange-50/70 dark:bg-orange-950/20 border-l-4 border-orange-500'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Avatar + Online Dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white font-bold flex items-center justify-center text-base shadow-xs">
                      {initial}
                    </div>
                    {online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    )}
                  </div>

                  {/* Conv Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {conv.customer?.name || 'Customer'}
                      </h4>
                      <span className="text-[11px] text-slate-400 flex-shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    {/* Customer Subtitle / Type */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {conv.customer?.isB2B ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          B2B
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Retail
                        </span>
                      )}
                      {conv.status === 'RESOLVED' && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          • Resolved
                        </span>
                      )}
                    </div>

                    {/* Message Preview + Unread Count */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate pr-2">
                        {conv.lastMessagePreview || 'No messages yet'}
                      </p>
                      {conv.unreadForAdmin > 0 && (
                        <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold bg-orange-500 text-white shadow-xs">
                          {conv.unreadForAdmin}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT PANE: Chat View & Message Thread ─────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {activeConv ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center">
                    {activeConv.customer?.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  {isCustomerOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {activeConv.customer?.name || 'Customer'}
                    </h3>
                    {isCustomerOnline ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ONLINE
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">OFFLINE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{activeConv.customer?.phone || 'No phone'}</span>
                    {activeConv.orderId && (
                      <Link
                        href={`/admin/orders?search=${activeConv.orderId}`}
                        className="inline-flex items-center gap-1 text-orange-600 hover:underline font-medium"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Order #{activeConv.orderId.slice(-6)}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Instant Call + Menu */}
              <div className="flex items-center gap-2">
                {activeConv.customer?.phone && (
                  <a
                    href={`tel:${activeConv.customer.phone}`}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={`Call +91 ${activeConv.customer.phone}`}
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </a>
                )}

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 text-sm z-20">
                      <button
                        onClick={() => updateStatusMutation.mutate(activeConv.status === 'OPEN' ? 'RESOLVED' : 'OPEN')}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      >
                        {activeConv.status === 'OPEN' ? 'Mark as Resolved' : 'Reopen Conversation'}
                      </button>
                      <Link
                        href={`/admin/business-accounts?search=${encodeURIComponent(activeConv.customer?.phone || activeConv.customer?.name || '')}`}
                        className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        onClick={() => setMenuOpen(false)}
                      >
                        View Customer Profile
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Thread Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-900/40">
              {messagesLoading && messages.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading conversation...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 mx-auto flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    No messages in this chat yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Send a reply below to start the conversation with {activeConv.customer?.name}.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.senderRole === 'ADMIN'

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] md:max-w-[65%] rounded-2xl p-3.5 shadow-xs ${
                          isAdmin
                            ? 'bg-orange-500 text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                        }`}
                      >
                        {/* Admin badge if sent by staff */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-100 mb-1">
                            <ShieldCheck className="w-3 h-3" />
                            {msg.senderId || 'Support Admin'}
                          </div>
                        )}

                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.body}
                        </p>

                        <div
                          className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] ${
                            isAdmin ? 'text-orange-100' : 'text-slate-400'
                          }`}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {isAdmin && (
                            msg.readAt ? (
                              <CheckCheck className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-orange-200" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Footer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a reply to customer... (Marathi, Hindi & English supported)"
                maxLength={2000}
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || sendReplyMutation.isPending}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
              Select a conversation to start chatting
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              All messages from your customers appear here in real-time and are mirrored to your Google Sheet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
