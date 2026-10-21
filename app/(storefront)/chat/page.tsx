'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
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
  MoreVertical,
  Smile,
  Paperclip,
  CheckCircle2,
  Info,
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

const CUSTOMER_SUGGESTION_CHIPS = [
  { icon: '🚚', label: 'Where is my order?', prompt: 'Hello, could you please give me the live status and expected delivery time for my order?' },
  { icon: '⏰', label: "Today's delivery slots", prompt: 'Hi, what are the delivery slots available for Latur today?' },
  { icon: '❄️', label: '-18°C storage advice', prompt: 'How should I store McCain frozen items to maintain crispiness and freshness?' },
  { icon: '💼', label: 'Wholesale / B2B pricing', prompt: 'Hello, I run a restaurant/cafe in Latur and would like to inquire about bulk wholesale supply and carton pricing.' },
  { icon: '🧾', label: 'Need invoice copy', prompt: 'Hi, could you please provide a GST tax invoice copy for my recent purchase?' },
  { icon: '📞', label: 'Request support callback', prompt: 'Please have someone from customer support call me regarding my inquiry.' }
]

export default function CustomerChatPage() {
  const searchParams = useSearchParams()
  const orderIdParam = searchParams.get('orderId')
  const orderNumberParam = searchParams.get('orderNumber')

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

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTab])

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
          orderId: orderIdParam || conversation?.orderId || null,
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

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || sendMessageMutation.isPending) return
    sendMessageMutation.mutate(inputText.trim())
  }

  const handleSelectSuggestion = (prompt: string) => {
    setInputText(prompt)
  }

  const handleSendSuggestionInstantly = (prompt: string) => {
    if (sendMessageMutation.isPending) return
    sendMessageMutation.mutate(prompt)
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
    <div className="min-h-[88vh] bg-slate-100 dark:bg-slate-950 py-2 sm:py-6 px-2 sm:px-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[780px] max-h-[92vh]">
        
        {/* ─── WHATSAPP BRANDED TOP HEADER (#075E54 / #008069) ─────────────── */}
        <div className="bg-[#075E54] dark:bg-[#005c4b] text-white px-4 py-3 flex items-center justify-between shadow-md select-none">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 -ml-1 hover:bg-black/20 rounded-full transition-colors tap-scale"
              aria-label="Back to storefront"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Profile Avatar with Online Status Indicator */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                <Image
                  src="/icons/emblem.png"
                  alt="Anmol Enterprises"
                  width={38}
                  height={38}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full" />
            </div>

            <div className="leading-tight">
              <h1 className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                <span>Anmol Enterprises</span>
                <span className="bg-emerald-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  Verified
                </span>
              </h1>
              <p className="text-[11px] text-emerald-100/90 font-medium">
                online • Official Support Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Call Button */}
            <a
              href="tel:+918237722744"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition tap-scale"
              title="Call Anmol Helpline: +91 8237722744"
            >
              <Phone className="w-4 h-4 fill-current" />
            </a>

            <button
              onClick={() => {
                refetchChat()
                refetchUpdates()
                showToast('Messages refreshed', 'info')
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition tap-scale"
              title="Refresh messages"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── TAB NAVIGATION: CHAT vs UPDATES ───────────────────────────────── */}
        <div className="flex bg-[#054c44] text-white/80 border-t border-white/10 text-xs font-bold tracking-wider uppercase select-none">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 border-b-3 transition-colors ${
              activeTab === 'CHAT'
                ? 'border-white text-white bg-black/10'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('UPDATES')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 border-b-3 transition-colors relative ${
              activeTab === 'UPDATES'
                ? 'border-white text-white bg-black/10'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Broadcasts</span>
            {unreadUpdatesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                {unreadUpdatesCount}
              </span>
            )}
          </button>
        </div>

        {/* ─── TAB 1: WHATSAPP-STYLE SUPPORT CHAT ────────────────────────────── */}
        {activeTab === 'CHAT' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#EFEAE2] dark:bg-[#0b141a] relative">
            
            {/* Subtle WhatsApp-style doodle pattern overlay */}
            <div 
              className="absolute inset-0 opacity-[0.035] dark:opacity-[0.025] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#075e54 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Inquiring Order Context Ribbon if provided */}
            {orderNumberParam && (
              <div className="relative z-10 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/60 px-4 py-2 flex items-center justify-between text-xs text-amber-950 dark:text-amber-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">Inquiry regarding:</span>
                  <span className="font-mono font-black text-amber-800 dark:text-amber-300">#{orderNumberParam}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendSuggestionInstantly(`Inquiring about Order #${orderNumberParam}. Please let me know the status.`)}
                  className="px-2 py-0.5 rounded-full bg-amber-200/70 hover:bg-amber-300 text-amber-900 font-bold text-[10px] transition"
                >
                  Ask Status ➔
                </button>
              </div>
            )}

            {/* End-to-end Encryption Notice Banner (WhatsApp signature) */}
            <div className="relative z-10 px-4 pt-3 flex justify-center">
              <div className="inline-flex items-center gap-1.5 bg-amber-100/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-xl text-[10px] text-amber-900 dark:text-amber-200 shadow-2xs text-center max-w-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Messages are securely logged to official Anmol Enterprises support ledger.</span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 relative z-10">
              {convLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading conversation...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 mx-auto flex items-center justify-center mb-2.5">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    Welcome to Anmol Enterprises Helpdesk
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Ask questions about orders, today&apos;s delivery slots, or wholesale pricing. Use the quick query buttons below or type your message.
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
                        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-xs ${
                          isCustomer
                            ? 'bg-[#E7FFDB] dark:bg-[#005c4b] text-slate-950 dark:text-white rounded-tr-xs border border-emerald-200/60 dark:border-transparent'
                            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-white rounded-tl-xs border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Admin Badge */}
                        {!isCustomer && (
                          <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 mb-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Anmol Support ({msg.senderId})</span>
                          </div>
                        )}

                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                          {msg.body}
                        </p>

                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isCustomer ? 'text-emerald-800/80 dark:text-emerald-200' : 'text-slate-400'
                          }`}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {isCustomer && (
                            msg.readAt ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
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

            {/* ─── QUICK AUTO-SUGGESTION CHIPS (WhatsApp Query Templates) ────── */}
            <div className="relative z-10 px-3 py-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  Quick Query:
                </span>
                {CUSTOMER_SUGGESTION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(chip.prompt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold transition tap-scale shadow-2xs"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── WHATSAPP COMPOSER ─────────────────────────────────────────── */}
            <form
              onSubmit={handleSendMessage}
              className="relative z-10 p-2.5 sm:p-3 bg-[#F0F2F5] dark:bg-[#111b21] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <div className="flex-1 flex items-center bg-white dark:bg-[#2a3942] rounded-full px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                  className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none py-1"
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || sendMessageMutation.isPending}
                className="w-10 h-10 rounded-full bg-[#00A884] hover:bg-[#008f6f] disabled:opacity-40 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Send message"
              >
                {sendMessageMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </form>
          </div>
        )}

        {/* ─── TAB 2: BROADCAST ANNOUNCEMENTS ─────────────────────────────────── */}
        {activeTab === 'UPDATES' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 dark:bg-slate-950">
            {updatesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading broadcasts...</div>
            ) : updates.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Radio className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  No announcements yet
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Festive discounts, new product arrivals, and delivery schedule updates will be published here.
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
                  className={`p-4 rounded-2xl border transition ${
                    !update.readAt
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                        {update.title}
                      </h4>
                    </div>

                    {!update.readAt && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white uppercase">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                    {update.body}
                  </p>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-semibold">
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
