import { google } from 'googleapis'
import { prisma } from './prisma'
import { env } from './env'

// Sanitize strings against CSV / Excel / Google Sheets formula injection
// Any string starting with =, +, -, @, or tab is prefixed with a single quote '
export function sanitizeForSheet(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/^[=\+\-@\t\r]/.test(str)) {
    return `'${str}`
  }
  return str
}

// Convert a Date to Indian Standard Time formatted string (DD/MM/YYYY hh:mm:ss A)
export function formatToIST(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date)
  } catch (err) {
    return date.toISOString()
  }
}

// Initialize authenticated Google Sheets API client
function getSheetsClient() {
  const sheetId = env.GOOGLE_SHEET_ID
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  let privateKey = env.GOOGLE_PRIVATE_KEY

  if (!sheetId || !clientEmail || !privateKey) {
    return null
  }

  // Handle escaped newlines from environment strings (e.g. \n in .env)
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return {
    sheets: google.sheets({ version: 'v4', auth }),
    spreadsheetId: sheetId,
  }
}

let headersInitialized = false

// Ensure "Chat Log" and "Broadcasts" tabs exist and have top header rows with styling
async function ensureSheetTabsAndHeaders(client: NonNullable<ReturnType<typeof getSheetsClient>>) {
  if (headersInitialized) return
  const { sheets, spreadsheetId } = client

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId })
    const sheetTitles = (meta.data.sheets || []).map((s) => s.properties?.title)

    const requests: any[] = []

    if (!sheetTitles.includes('Chat Log')) {
      requests.push({
        addSheet: {
          properties: {
            title: 'Chat Log',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      })
    }

    if (!sheetTitles.includes('Broadcasts')) {
      requests.push({
        addSheet: {
          properties: {
            title: 'Broadcasts',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      })
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      })
    }

    // Set header columns if tabs are freshly created or empty
    const chatHeaders = [
      'Timestamp (IST)',
      'Message ID',
      'Conversation ID',
      'Customer Name',
      'Customer Phone',
      'Customer Type',
      'Sender Direction',
      'Message / Query',
      'Admin Replied By',
      'Order ID Context',
    ]

    const broadcastHeaders = [
      'Timestamp (IST)',
      'Broadcast ID',
      'Title',
      'Audience',
      'Recipient Count',
      'Created By Admin',
      'Message Content',
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'Chat Log'!A1:J1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [chatHeaders],
      },
    }).catch(() => {}) // Ignore if already has headers

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'Broadcasts'!A1:G1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [broadcastHeaders],
      },
    }).catch(() => {}) // Ignore if already has headers

    headersInitialized = true
  } catch (err) {
    console.warn('[GoogleSheets] ensureSheetTabsAndHeaders warning:', (err as any)?.message || err)
  }
}

// Background sync worker: pulls batches of PENDING messages & broadcasts and appends to Google Sheet
export async function syncPendingToGoogleSheet(): Promise<{ syncedMessages: number; syncedBroadcasts: number }> {
  const client = getSheetsClient()
  if (!client) {
    return { syncedMessages: 0, syncedBroadcasts: 0 }
  }

  await ensureSheetTabsAndHeaders(client)

  let syncedMessages = 0
  let syncedBroadcasts = 0

  // 1. Process pending chat messages (up to 50 per batch)
  const pendingMessages = await prisma.chatMessage.findMany({
    where: {
      sheetSyncStatus: 'PENDING',
      sheetSyncAttempts: { lt: 5 },
    },
    take: 50,
    orderBy: { createdAt: 'asc' },
    include: {
      conversation: {
        include: {
          customer: {
            select: { name: true, phone: true, isB2B: true },
          },
        },
      },
    },
  })

  if (pendingMessages.length > 0) {
    const rows = pendingMessages.map((msg) => {
      const customer = msg.conversation.customer
      const direction = msg.senderRole === 'CUSTOMER' ? 'Customer -> Admin' : 'Admin -> Customer'
      const adminReplier = msg.senderRole === 'ADMIN' ? msg.senderId : ''

      return [
        formatToIST(msg.createdAt),
        sanitizeForSheet(msg.id),
        sanitizeForSheet(msg.conversationId),
        sanitizeForSheet(customer?.name || 'Customer'),
        sanitizeForSheet(customer?.phone || ''),
        customer?.isB2B ? 'B2B Wholesale' : 'Retail B2C',
        direction,
        sanitizeForSheet(msg.body),
        sanitizeForSheet(adminReplier),
        sanitizeForSheet(msg.orderId || ''),
      ]
    })

    try {
      await client.sheets.spreadsheets.values.append({
        spreadsheetId: client.spreadsheetId,
        range: `'Chat Log'!A:J`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: rows },
      })

      const now = new Date()
      await prisma.chatMessage.updateMany({
        where: { id: { in: pendingMessages.map((m) => m.id) } },
        data: {
          sheetSyncStatus: 'SYNCED',
          sheetSyncedAt: now,
        },
      })
      syncedMessages = pendingMessages.length
    } catch (err: any) {
      console.error('[GoogleSheets] Chat sync batch error:', err?.message || err)
      await prisma.chatMessage.updateMany({
        where: { id: { in: pendingMessages.map((m) => m.id) } },
        data: {
          sheetSyncAttempts: { increment: 1 },
        },
      })
    }
  }

  // 2. Process pending broadcasts (up to 10 per batch)
  const pendingBroadcasts = await prisma.broadcast.findMany({
    where: {
      sheetSyncStatus: 'PENDING',
    },
    take: 10,
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: { name: true, email: true },
      },
    },
  })

  if (pendingBroadcasts.length > 0) {
    const bRows = pendingBroadcasts.map((b) => [
      formatToIST(b.createdAt),
      sanitizeForSheet(b.id),
      sanitizeForSheet(b.title),
      sanitizeForSheet(b.audience),
      b.recipientCount,
      sanitizeForSheet(b.author?.name || b.author?.email || b.createdBy),
      sanitizeForSheet(b.body),
    ])

    try {
      await client.sheets.spreadsheets.values.append({
        spreadsheetId: client.spreadsheetId,
        range: `'Broadcasts'!A:G`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: bRows },
      })

      const now = new Date()
      await prisma.broadcast.updateMany({
        where: { id: { in: pendingBroadcasts.map((b) => b.id) } },
        data: {
          sheetSyncStatus: 'SYNCED',
          sheetSyncedAt: now,
        },
      })
      syncedBroadcasts = pendingBroadcasts.length
    } catch (err: any) {
      console.error('[GoogleSheets] Broadcast sync error:', err?.message || err)
    }
  }

  return { syncedMessages, syncedBroadcasts }
}
