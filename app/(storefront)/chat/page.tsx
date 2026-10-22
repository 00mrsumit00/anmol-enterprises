'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
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
  Sparkles,
  RefreshCw,
  MoreVertical,
  Plus,
  Package,
  RotateCcw,
  MessageCircle,
  FileText,
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

const QUICK_ACTIONS = [
  {
    id: 'track',
    label: 'Track order',
    icon: Package,
    color: 'text-[#FF6B00]',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'delivery_time',
    label: 'Delivery time',
    icon: Clock,
    color: 'text-[#FF6B00]',
    bgColor: 'bg-orange-50',
    prompt: 'Hi, what are the expected delivery hours for Latur today?',
  },
  {
    id: 'return',
    label: 'Return / Replace',
    icon: RotateCcw,
    color: 'text-[#FF6B00]',
    bgColor: 'bg-orange-50',
    prompt: 'Hi, I need assistance regarding an item return or replacement for my recent order.',
  },
  {
    id: 'other',
    label: 'Other query',
    icon: MessageCircle,
    color: 'text-[#FF6B00]',
    bgColor: 'bg-orange-50',
    prompt: 'Hi Anmol Support, ',
  },
]

function CustomerChatContent() {
  const searchParams = useSearchParams()
  const orderIdParam = searchParams.get('orderId')
  const orderNumberParam = searchParams.get('orderNumber')

  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const socket = useSocket()

  const [activeTab, setActiveTab] = useState<'CHAT' | 'UPDATES'>('CHAT')
  const [inputText, setInputText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [statusRequestedTime, setStatusRequestedTime] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // 2. Fetch user's recent orders for smart tracking
  const { data: userOrders = [] } = useQuery<any[]>({
    queryKey: ['customer-recent-orders-chat'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/orders')
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data) ? data : []
      } catch {
        return []
      }
    },
  })

  // 3. Fetch broadcast updates
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
  }, [messages, activeTab, statusRequestedTime])

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

  const formatCurrentTime = () => {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.id === 'track') {
      const timeNow = formatCurrentTime()
      setStatusRequestedTime(timeNow)

      // Find user's latest active or recent order
      const latestOrder = userOrders[0]
      const orderNumber = orderNumberParam || latestOrder?.orderNumber
      const prompt = orderNumber
        ? `Hello Anmol Support, could you please provide the live status and expected delivery time for my Order #${orderNumber}?`
        : `Hello Anmol Support, could you please provide the live status and expected delivery time for my recent order?`

      sendMessageMutation.mutate(prompt)
      return
    }

    if (action.id === 'other') {
      setInputText(action.prompt || 'Hi Anmol Support, ')
      setTimeout(() => inputRef.current?.focus(), 50)
      return
    }

    if (action.prompt) {
      sendMessageMutation.mutate(action.prompt)
    }
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
    <div className="min-h-[calc(100dvh-4rem)] bg-[#F4F6F8] px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-center font-sans">
      {/* ─── MAIN CHAT CARD CONTAINER (Approved Reference UI) ────────────── */}
      <div className="w-full max-w-lg md:max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col h-[calc(100dvh-8rem)] md:h-[780px] max-h-[850px]">
        
        {/* ─── NAVY SUPPORT APP BAR (#0D2037) ─────────────── */}
        <div className="bg-[#0D2037] text-white px-4 py-3 sm:py-3.5 flex items-center justify-between shadow-sm select-none shrink-0 relative z-20">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors active:scale-95 text-white"
              aria-label="Back to storefront"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Profile Avatar with Emblem Badge */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center overflow-hidden shadow-xs border border-white/20">
                <Image
                  src="/icons/emblem.png"
                  alt="Anmol Support"
                  width={34}
                  height={34}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="leading-tight">
              <h1 className="font-extrabold text-[15px] sm:text-base text-white">
                Anmol Support
              </h1>
              <div className="text-[11px] sm:text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#00D084] inline-block animate-pulse" />
                <span className="text-[#00D084] font-bold">Online</span>
                <span className="text-slate-300 font-normal">Usually replies in a few minutes</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center text-white">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition active:scale-95"
              title="More options"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-40 text-xs font-semibold text-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
                  <a
                    href="tel:+918237722744"
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-orange-50 hover:text-[#FF6B00] transition"
                    onClick={() => setShowMenu(false)}
                  >
                    <Phone className="w-4 h-4 text-[#FF6B00]" />
                    <span>Call Helpline</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      refetchChat()
                      refetchUpdates()
                      setShowMenu(false)
                      showToast('Messages refreshed', 'info')
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition text-left"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                    <span>Refresh Chat</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── TAB NAVIGATION: MESSAGES vs UPDATES (NO Top Order Card) ───────── */}
        <div className="bg-white px-3 sm:px-4 py-2.5 border-b border-slate-100 select-none shrink-0">
          <div className="flex bg-[#F1F3F5] p-1 rounded-2xl text-xs font-bold gap-1">
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl transition-all ${
                activeTab === 'CHAT'
                  ? 'bg-[#0D2037] text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Messages</span>
            </button>

            <button
              onClick={() => setActiveTab('UPDATES')}
              className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-xl transition-all relative ${
                activeTab === 'UPDATES'
                  ? 'bg-[#0D2037] text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Updates</span>
              {unreadUpdatesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white">
                  {unreadUpdatesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ─── TAB 1: SUPPORT CHAT ────────────────────────────── */}
        {activeTab === 'CHAT' && (
          <div className="flex-1 flex flex-col min-h-0 bg-white relative">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 relative z-10 bg-white">
              
              {/* Centered Date Badge with subtle rule line */}
              <div className="relative flex items-center justify-center my-2 select-none">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative bg-[#EAECEF] text-slate-600 text-[11px] font-bold px-3.5 py-0.5 rounded-full tracking-wide">
                  Today
                </div>
              </div>

              {convLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading conversation...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B00] mx-auto flex items-center justify-center mb-2.5 shadow-2xs">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Welcome to Anmol Support
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Ask questions about orders, today&apos;s delivery slots in Latur, or wholesale pricing. Tap quick queries below or message us directly.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCustomer = msg.senderRole === 'CUSTOMER'

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCustomer ? 'justify-end' : 'justify-start items-start gap-2.5'}`}
                    >
                      {!isCustomer && (
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 p-1 shrink-0 flex items-center justify-center shadow-2xs mt-0.5">
                          <Image
                            src="/icons/emblem.png"
                            alt="Support"
                            width={24}
                            height={24}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      <div
                        className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-3 shadow-2xs ${
                          isCustomer
                            ? 'bg-[#DCF8C6] text-[#111B21] rounded-tr-xs border border-[#C5EDB0]'
                            : 'bg-[#F0F4F8] text-[#111B21] rounded-tl-xs border border-slate-200/70'
                        }`}
                      >
                        {!isCustomer && (
                          <div className="text-xs font-bold text-[#0D2037] mb-1">
                            Anmol Support
                          </div>
                        )}

                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                          {msg.body}
                        </p>

                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isCustomer ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {isCustomer && (
                            <CheckCheck className="w-3.5 h-3.5 text-[#128C7E]" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {/* System Event Pill: Order status requested (Approved Reference UI) */}
              {statusRequestedTime && (
                <div className="flex justify-center my-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E8F1FC] text-[#1E60BE] text-xs font-semibold shadow-2xs border border-blue-100">
                    <FileText className="w-3.5 h-3.5 text-[#1E60BE]" />
                    <span>Order status requested • {statusRequestedTime}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ─── QUICK ACTION PILLS (Approved Reference UI) ────── */}
            <div className="relative z-10 px-3 py-2.5 bg-[#FAF7F2] border-t border-slate-100 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex items-center gap-2 min-w-max">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleQuickAction(action)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-orange-50 text-slate-800 hover:text-[#FF6B00] border border-slate-200/90 hover:border-orange-200 text-xs font-bold shadow-2xs transition-all active:scale-95 whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span>{action.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ─── COMPOSER BAR (Approved Reference UI) ──────────── */}
            <form
              onSubmit={handleSendMessage}
              className="relative z-10 p-2.5 sm:p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0 rounded-b-3xl"
            >
              <button
                type="button"
                onClick={() => {
                  setInputText((prev) => (prev ? `${prev} ` : 'Hi Anmol Support, '))
                  setTimeout(() => inputRef.current?.focus(), 50)
                }}
                className="w-10 h-10 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-slate-700 flex items-center justify-center shrink-0 transition active:scale-95"
                title="Quick query"
              >
                <Plus className="w-5 h-5" />
              </button>

              <div className="flex-1 flex items-center bg-[#F3F4F6] rounded-full px-4 py-1.5 border border-slate-200/50 focus-within:border-orange-400 focus-within:bg-white transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Message Anmol Support..."
                  maxLength={2000}
                  className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none py-1.5"
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || sendMessageMutation.isPending}
                className="w-10 h-10 rounded-full bg-[#FF6B00] hover:bg-[#E05E00] disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-orange-500/25 active:scale-95 transition-all shrink-0 cursor-pointer"
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
            {updatesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading broadcasts...</div>
            ) : updates.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Radio className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">
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
                      ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {update.title}
                      </h4>
                    </div>

                    {!update.readAt && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white uppercase">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {update.body}
                  </p>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
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

export default function CustomerChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] bg-[#F4F6F8] py-6 flex items-center justify-center font-sans">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-400 shadow-lg">
            Loading Helpdesk & Chat...
          </div>
        </div>
      }
    >
      <CustomerChatContent />
    </Suspense>
  )
}
