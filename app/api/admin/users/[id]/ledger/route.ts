import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import * as XLSX from 'xlsx'

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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = getAuthUser(req)
    if (!admin || !['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 })
    }

    const userId = params.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { businessProfile: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const format = searchParams.get('format') || 'json'

    const now = new Date()
    const fromDate = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1) // default 1st of month
    fromDate.setHours(0, 0, 0, 0)

    const toDate = toParam ? new Date(toParam) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    toDate.setHours(23, 59, 59, 999)

    // 1. Calculate Opening Balance before fromDate
    const priorOrders = await prisma.order.findMany({
      where: {
        userId,
        status: { notIn: ['CANCELLED', 'RETURNED'] },
        createdAt: { lt: fromDate }
      },
      select: {
        totalAmount: true,
        paymentStatus: true
      }
    })

    let openingBalance = 0
    for (const po of priorOrders) {
      const debit = po.totalAmount
      const credit = po.paymentStatus === 'PAID' ? po.totalAmount : 0
      openingBalance += (debit - credit)
    }

    // 2. Fetch Orders in Date Range
    const periodOrders = await prisma.order.findMany({
      where: {
        userId,
        status: { notIn: ['CANCELLED', 'RETURNED'] },
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      include: {
        items: true
      },
      orderBy: { createdAt: 'asc' }
    })

    let runningBalance = openingBalance
    let totalDebit = 0
    let totalCredit = 0

    const transactions = periodOrders.map((order) => {
      const debit = order.totalAmount
      const isPaid = order.paymentStatus === 'PAID'
      const credit = isPaid ? order.totalAmount : 0

      totalDebit += debit
      totalCredit += credit
      runningBalance = runningBalance + debit - credit

      const itemsDesc = order.items
        .map((it) => `${it.productName} (${it.quantity}×${it.packagingType})`)
        .slice(0, 3)
        .join(', ') + (order.items.length > 3 ? ` +${order.items.length - 3} more` : '')

      return {
        id: order.id,
        date: order.createdAt.toISOString(),
        formattedDate: new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        orderNumber: order.orderNumber,
        invoiceNumber: `INV-${order.orderNumber}`,
        particulars: itemsDesc || 'Cold-Chain Frozen Food Supplies',
        paymentMethod: order.paymentMethod.replace(/_/g, ' '),
        paymentStatus: order.paymentStatus,
        debit,
        credit,
        runningBalance
      }
    })

    const closingBalance = runningBalance

    const ledgerData = {
      customer: {
        id: user.id,
        name: user.name,
        businessName: user.businessName || user.businessProfile?.businessName || user.name,
        gstin: user.businessProfile?.gstin || 'Unregistered',
        phone: user.phone || 'N/A',
        email: user.email || 'N/A',
        creditLimit: user.creditLimit || 0,
        creditUsed: user.creditUsed || 0,
        creditAvailable: Math.max(0, (user.creditLimit || 0) - (user.creditUsed || 0)),
        isCreditEnabled: user.isCreditEnabled
      },
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        formattedFrom: fromDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        formattedTo: toDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      },
      openingBalance,
      transactions,
      summary: {
        totalDebit,
        totalCredit,
        closingBalance
      }
    }

    // ─── EXCEL (.XLSX) EXPORT ───────────────────────────────────────────────
    if (format === 'excel') {
      const rows: any[] = []

      // Company info headers
      rows.push(['M/S ANMOL ENTERPRISES - OFFICIAL B2B CUSTOMER ACCOUNT LEDGER'])
      rows.push(['Raje Shivaji Nagar, Barshi Road, Opp Kiy Moters, Latur - 413512, Maharashtra'])
      rows.push(['GSTIN: 27AGEPT8074F1Z0 | Phone: 02382 222424 | FSSAI: 11524049000286'])
      rows.push([])
      rows.push(['STATEMENT DETAILS:'])
      rows.push(['Customer Name:', ledgerData.customer.businessName, 'Period:', `${ledgerData.period.formattedFrom} to ${ledgerData.period.formattedTo}`])
      rows.push(['Contact Person:', ledgerData.customer.name, 'Phone:', ledgerData.customer.phone])
      rows.push(['GSTIN:', ledgerData.customer.gstin, 'Credit Limit:', `₹${ledgerData.customer.creditLimit}`])
      rows.push([])

      // Table Header
      rows.push([
        'Date',
        'Invoice / Order Ref',
        'Particulars / Item Summary',
        'Payment Mode',
        'Debit (₹) [Invoiced]',
        'Credit (₹) [Paid]',
        'Balance Outstanding (₹)'
      ])

      // Opening balance row
      rows.push([
        ledgerData.period.formattedFrom,
        '-',
        'OPENING BALANCE B/F',
        '-',
        0,
        0,
        openingBalance
      ])

      // Transaction rows
      for (const t of transactions) {
        rows.push([
          t.formattedDate,
          t.invoiceNumber,
          t.particulars,
          t.paymentMethod,
          t.debit,
          t.credit,
          t.runningBalance
        ])
      }

      // Summary row
      rows.push([])
      rows.push([
        'TOTALS / CLOSING BALANCE',
        '-',
        `Net Outstanding as of ${ledgerData.period.formattedTo}`,
        '-',
        totalDebit,
        totalCredit,
        closingBalance
      ])

      const worksheet = XLSX.utils.aoa_to_sheet(rows)

      // Column widths
      worksheet['!cols'] = [
        { wch: 14 },
        { wch: 20 },
        { wch: 45 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 22 }
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Account Ledger')

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

      const sanitizedName = (ledgerData.customer.businessName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')
      const fileName = `Ledger_${sanitizedName}_${ledgerData.period.formattedFrom}_to_${ledgerData.period.formattedTo}.xlsx`

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      })
    }

    return NextResponse.json(ledgerData)
  } catch (error: any) {
    console.error('Error generating B2B ledger:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate ledger' }, { status: 500 })
  }
}
