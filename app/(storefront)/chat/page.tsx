'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  Radio,
  Send,
  Phone,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Bell,
  RefreshCw,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'

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

interface BroadcastUpdate {
  id: string
  broadcastId: string
  title: string
  body: string
  author: string
  createdAt: string
  readAt: string | null
}

export default function CustomerChatPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const socket = useSocket()

  const [activeTab, setActiveTab] = useState<'CHAT' | 'UPDATES'>('CHAT')
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Fetch support chat conversation & messages
  const {
    data: convData,
    isLoading: convLoading,
    refetch: refetchChat,
  } = useQuery({
    queryKey: ['customer-chat-conversation'],
    queryFn: async () => {
      const res = await fetch('/api/chat/conversation')
      if (!res.ok) throw new Error('Failed to load conversation')
      return res.json() as Promise<{
        conversation: {
          id: string
          status: string
          orderId: string | null
          messages: ChatMessage[]
        }
      }>
    },
    refetchInterval: 10000,
  })

  const conversation = convData?.conversation
  const messages = conversation?.messages || []

  // 2. Fetch broadcast updates
  const {
    data: updatesData,
    isLoading: updatesLoading,
    refetch: refetchUpdates,
  } = useQuery({
    queryKey: ['customer-updates'],
    queryFn: async () => {
      const res = await fetch('/api/updates')
      if (!res.ok) throw new Error('Failed to load updates')
      return res.json() as Promise<{
        updates: BroadcastUpdate[]
        unreadCount: number
      }>
    },
  })

  const updates = updatesData?.updates || []
  const unreadUpdatesCount = updatesData?.unreadCount || 0

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time socket events
  useEffect(() => {
    if (!socket) return

    const handleChatMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['customer-chat-conversation'] })
      queryClient.invalidateQueries({ queryKey: ['chat-badges'] })
    }

    const handleNewBroadcast = () => {
      queryClient.invalidateQueries({ queryKey: ['customer-updates'] })
      queryClient.invalidateQueries({ queryKey: ['chat-badges'] })
      showToast('New broadcast announcement received!', 'info')
    }

    socket.on('chat:message', handleChatMessage)
    socket.on('broadcast:new', handleNewBroadcast)

    return () => {
      socket.off('chat:message', handleChatMessage)
      socket.off('broadcast:new', handleNewBroadcast)
    }
  }, [socket, queryClient, showToast])

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: text,
          clientMessageId: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to send message')
      }
      return res.json()
    },
    onSuccess: () => {
      setInputText('')
      queryClient.invalidateQueries({ queryKey: ['customer-chat-conversation'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error sending message', 'error')
    },
  })

  // Mark update read mutation
  const markUpdateReadMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const res = await fetch(`/api/updates/${recipientId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-updates'] })
      queryClient.invalidateQueries({ queryKey: ['chat-badges'] })
    },
  })

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || sendMessageMutation.isPending) return
    sendMessageMutation.mutate(inputText.trim())
  }

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
      return ''
    }
  }

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="min-h-[85vh] bg-slate-50 dark:bg-slate-950 py-4 md:py-8 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[750px]">
        {/* ─── Top Header ─────────────────────────────────────────────────────── */}
        <div className="p-4 md:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Anmol Helpdesk & Updates
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h1>
              <p className="text-xs text-slate-400">
                Direct coordination for frozen food orders & delivery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Call Anmol Enterprises Helpline */}
            <a
              href="tel:+918237722744"
              className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1.5 transition hover:bg-emerald-100"
              title="Call Anmol Support"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Call Helpline</span>
            </a>

            <button
              onClick={() => {
                refetchChat()
                refetchUpdates()
              }}
              title="Refresh messages"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Tabs Bar ───────────────────────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 px-4 md:px-6">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`py-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'CHAT'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Support Chat
          </button>

          <button
            onClick={() => setActiveTab('UPDATES')}
            className={`py-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition relative ${
              activeTab === 'UPDATES'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Radio className="w-4 h-4" />
            Announcements & Offers
            {unreadUpdatesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-orange-500 text-white shadow-xs">
                {unreadUpdatesCount}
              </span>
            )}
          </button>
        </div>

        {/* ─── TAB 1: SUPPORT CHAT ────────────────────────────────────────────── */}
        {activeTab === 'CHAT' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30 dark:bg-slate-950/30">
            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5">
              {convLoading ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading conversation...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-500 mx-auto flex items-center justify-center mb-3">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    How can we help you today?
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Message us here regarding your order status, delivery slots, bulk wholesale inquiries, or stock availability. We reply quickly!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCustomer = msg.senderRole === 'CUSTOMER'

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-xs ${
                          isCustomer
                            ? 'bg-orange-500 text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                        }`}
                      >
                        {!isCustomer && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 mb-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Anmol Support
                          </div>
                        )}

                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.body}
                        </p>

                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isCustomer ? 'text-orange-100' : 'text-slate-400'
                          }`}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {isCustomer && (
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

            {/* Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message / query here... (Marathi / Hindi / English)"
                maxLength={2000}
                className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sendMessageMutation.isPending}
                className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}

        {/* ─── TAB 2: ANNOUNCEMENTS & BROADCAST UPDATES ───────────────────────── */}
        {activeTab === 'UPDATES' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
            {updatesLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading announcements...</div>
            ) : updates.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Radio className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  No announcements yet
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Festive discounts, new product arrivals, and delivery schedule notices will be posted here.
                </p>
              </div>
            ) : (
              updates.map((update) => (
                <div
                  key={update.id}
                  onClick={() => {
                    if (!update.readAt) {
                      markUpdateReadMutation.mutate(update.id)
                    }
                  }}
                  className={`p-4 md:p-5 rounded-2xl border transition ${
                    !update.readAt
                      ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {update.title}
                      </h4>
                    </div>

                    {!update.readAt && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {update.body}
                  </p>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                    <span>From: Anmol Enterprises ({update.author})</span>
                    <span>{formatDate(update.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
