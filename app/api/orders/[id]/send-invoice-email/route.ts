import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sendOrderInvoiceEmail } from '@/lib/invoiceEmailService'

export const dynamic = 'force-dynamic'

function getAuthUser(req: Request) {
  const cookieStore = cookies()
  let token = cookieStore.get('token')?.value

  if (!token) {
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
  }

  if (!token) return null
  return verifyToken(token)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = params.id
    let body: any = {}
    try {
      body = await req.json()
    } catch {}

    const customEmail = body.email

    const result = await sendOrderInvoiceEmail(orderId, customEmail)
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send invoice email' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Tax Invoice emailed successfully!' })
  } catch (error: any) {
    console.error('Error sending invoice email:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
