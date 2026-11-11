import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

export async function sendOrderInvoiceEmail(orderId: string, customRecipientEmail?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          include: {
            businessProfile: true
          }
        },
        address: true,
        driver: true,
      }
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    const recipientEmail = customRecipientEmail || order.user?.email
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.log(`[Invoice Email]: Order #${order.orderNumber} has no valid recipient email. Skipped.`)
      return { success: false, error: 'Customer has no registered email address' }
    }

    const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim()
    const port = parseInt(process.env.SMTP_PORT || '587', 10)
    const user = (process.env.SMTP_USER || 'anmolenterprizes2026@gmail.com').trim()
    const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '')
    const from = process.env.SMTP_FROM_ADDRESS || `M/s Anmol Enterprises <${user}>`

    if (!pass) {
      console.warn(`[Invoice Email]: SMTP_PASS is not configured in .env. Email for Order #${order.orderNumber} skipped.`)
      return { success: false, error: 'SMTP credentials not configured in server environment' }
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 8000,
      socketTimeout: 8000,
    })

    const customerName = order.businessName || order.guestName || order.user?.name || 'Valued Customer'
    const invoiceUrl = `https://anmolenterprisess.in/admin/orders/${order.id}/invoice`

    // Generate table rows HTML
    const itemsHtml = order.items
      .map((item, idx) => {
        const lineTotal = item.lineTotal || item.unitPrice * item.quantity
        return `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
            <td style="padding: 10px 8px; color: #64748b; text-align: center;">${idx + 1}</td>
            <td style="padding: 10px 8px; color: #0f172a; font-weight: 600;">
              ${item.productName}
              <div style="font-size: 11px; color: #64748b; font-weight: normal;">Pack: ${item.packagingType} (${item.weightGrams}g)</div>
            </td>
            <td style="padding: 10px 8px; color: #0f172a; text-align: center; font-weight: bold;">${item.quantity}</td>
            <td style="padding: 10px 8px; color: #0f172a; text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
            <td style="padding: 10px 8px; color: #0f172a; text-align: right; font-weight: bold;">₹${lineTotal.toFixed(2)}</td>
          </tr>
        `
      })
      .join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Tax Invoice - Order #${order.orderNumber}</title>
      </head>
      <body style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
        <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0c831f 0%, #096918 100%); color: #ffffff; padding: 24px; text-align: left;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; opacity: 0.9;">Official Tax Invoice</div>
            <h1 style="margin: 4px 0 0 0; font-size: 22px; font-weight: 900;">M/s Anmol Enterprises</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Authorised McCain Frozen Foods Wholesale & Cold-Chain Logistics, Latur</p>
          </div>

          <!-- Order Summary Card -->
          <div style="padding: 24px;">
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
              <span style="font-size: 11px; font-weight: bold; color: #065f46; text-transform: uppercase;">Delivery Completed Successfully 🎉</span>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #047857; font-weight: 600;">
                Dear ${customerName}, your order <strong>#${order.orderNumber}</strong> has been delivered. Please find your official Tax Invoice attached below.
              </p>
            </div>

            <!-- Metadata Box -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 12px; line-height: 1.6;">
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <div style="color: #64748b; font-weight: 600;">INVOICE NUMBER:</div>
                  <div style="font-weight: 800; color: #0f172a; font-family: monospace;">INV-${order.orderNumber}</div>
                  <div style="color: #64748b; font-weight: 600; margin-top: 6px;">BILL DATE:</div>
                  <div style="font-weight: 700; color: #0f172a;">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: #64748b; font-weight: 600;">DELIVERY ADDRESS:</div>
                  <div style="font-weight: 600; color: #0f172a;">${order.deliveryAddress || 'Latur'}</div>
                  <div style="color: #64748b; font-weight: 600; margin-top: 6px;">PAYMENT METHOD:</div>
                  <div style="font-weight: 700; color: #0c831f;">${order.paymentMethod.replace(/_/g, ' ')} (${order.paymentStatus})</div>
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f1f5f9; text-transform: uppercase; font-size: 10px; font-weight: 800; color: #475569; letter-spacing: 0.5px;">
                  <th style="padding: 8px; text-align: center; width: 30px;">#</th>
                  <th style="padding: 8px; text-align: left;">Item Description</th>
                  <th style="padding: 8px; text-align: center; width: 40px;">Qty</th>
                  <th style="padding: 8px; text-align: right; width: 70px;">Rate</th>
                  <th style="padding: 8px; text-align: right; width: 80px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Totals Block -->
            <div style="border-top: 2px solid #0f172a; padding-top: 12px; margin-bottom: 24px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #64748b;">Subtotal:</span>
                <span style="font-weight: 600;">₹${order.subtotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #64748b;">Delivery & Handling:</span>
                <span style="font-weight: 600;">₹${((order.deliveryFee || 0) + (order.coldHandlingFee || 0)).toFixed(2)}</span>
              </div>
              ${order.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #0c831f;">
                <span>Discount / Coupon Applied:</span>
                <span style="font-weight: 600;">-₹${order.discountAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 16px; font-weight: 900; color: #0c831f;">
                <span>Total Invoice Value:</span>
                <span>₹${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <!-- View / Print PDF Action Button -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${invoiceUrl}" target="_blank" style="display: inline-block; background-color: #0c831f; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; rounded: 12px; border-radius: 12px; box-shadow: 0 4px 12px rgba(12,131,31,0.25);">
                📄 Download / Print Official Tax Invoice (PDF)
              </a>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
                Click above to view your full GST bill with HSN breakdown and bank stamp.
              </div>
            </div>

            <!-- Company & Bank Details -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 11px; color: #475569; line-height: 1.6;">
              <strong style="color: #0f172a; font-size: 12px; display: block; margin-bottom: 4px;">M/s Anmol Enterprises — Bank & GST Details:</strong>
              <div><strong>GSTIN:</strong> 27AGEPT8074F1Z0 | <strong>FSSAI Lic:</strong> 11524049000286</div>
              <div><strong>Bank Name:</strong> HDFC Bank CURRENT A/C 385</div>
              <div><strong>Account No:</strong> 50200019285385 | <strong>IFSC:</strong> HDFC0000360 (MG Road Latur)</div>
              <div><strong>Address:</strong> Raje Shivaji Nagar, Barshi Road, Opp Kiy Moters, Latur - 413512, Maharashtra</div>
              <div><strong>Helpline:</strong> 02382 222424</div>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            This is an automated tax invoice notification from M/s Anmol Enterprises. Thank you for your business!
          </div>

        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from,
      to: recipientEmail,
      subject: `[Tax Invoice] Order #${order.orderNumber} Delivered — M/s Anmol Enterprises`,
      html: emailHtml,
    })

    console.log(`[Invoice Email]: Successfully sent invoice for Order #${order.orderNumber} to ${recipientEmail}`)
    return { success: true }
  } catch (error: any) {
    console.error(`[Invoice Email Error]: Failed to send email for order ${orderId}:`, error)
    return { success: false, error: error.message || 'Failed to dispatch email' }
  }
}
