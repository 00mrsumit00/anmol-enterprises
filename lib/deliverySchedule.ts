/**
 * Latur City Dynamic Frozen Delivery Schedule Calculator
 * Enforces local distribution windows for Latur businesses & households:
 * 1. 06:00 AM - 12:00 PM -> Expected delivery Today Evening (by 5:00 PM)
 * 2. 12:01 PM - 04:00 PM -> Expected delivery Today Evening (by 8:00 PM)
 * 3. After 04:00 PM (or before 6:00 AM) -> Expected delivery Tomorrow Morning
 */

export interface DeliveryEstimate {
  headline: string           // e.g. "Today Evening (by 5:00 PM)"
  badge: string              // e.g. "Today by 5 PM"
  summary: string            // e.g. "Order now for delivery today evening by 5:00 PM"
  slotKey: 'TODAY_EVENING_5PM' | 'TODAY_NIGHT_8PM' | 'TOMORROW_MORNING'
  cutoffNotice?: string
  isToday: boolean
}

export function getLaturDeliveryEstimate(dateInput?: Date): DeliveryEstimate {
  const date = dateInput || new Date()

  // Format to IST hours & minutes reliably regardless of client/server time zone
  try {
    const istString = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false })
    const timePart = istString.split(', ')[1] || istString.split(' ')[1]
    if (timePart) {
      const [hStr, mStr] = timePart.split(':')
      const hours = parseInt(hStr, 10)
      const minutes = parseInt(mStr, 10)
      const decimalTime = hours + minutes / 60

      // 1. 06:00 AM to 12:00 PM (inclusive of 12:00)
      if (decimalTime >= 6.0 && decimalTime <= 12.0) {
        return {
          headline: 'Today Evening (by 5:00 PM)',
          badge: 'Today by 5 PM',
          summary: 'Order placed before 12:00 PM delivers today evening by 5:00 PM',
          slotKey: 'TODAY_EVENING_5PM',
          cutoffNotice: 'Order before 12:00 PM for 5:00 PM dispatch',
          isToday: true
        }
      }

      // 2. 12:01 PM to 04:00 PM (16:00)
      if (decimalTime > 12.0 && decimalTime <= 16.0) {
        return {
          headline: 'Today Evening (by 8:00 PM)',
          badge: 'Today by 8 PM',
          summary: 'Order placed before 4:00 PM delivers today by 8:00 PM',
          slotKey: 'TODAY_NIGHT_8PM',
          cutoffNotice: 'Order before 4:00 PM for today’s evening batch',
          isToday: true
        }
      }

      // 3. After 04:00 PM (16:00) or Early morning before 06:00 AM
      return {
        headline: 'Tomorrow Morning',
        badge: 'Tomorrow Morning',
        summary: 'Order delivers tomorrow morning fresh from cold storage',
        slotKey: 'TOMORROW_MORNING',
        cutoffNotice: 'Next batch dispatches tomorrow morning at 8:00 AM',
        isToday: false
      }
    }
  } catch (err) {
    // Fallback to local machine time
  }

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const decimal = hours + minutes / 60

  if (decimal >= 6.0 && decimal <= 12.0) {
    return {
      headline: 'Today Evening (by 5:00 PM)',
      badge: 'Today by 5 PM',
      summary: 'Delivers today evening by 5:00 PM',
      slotKey: 'TODAY_EVENING_5PM',
      isToday: true
    }
  } else if (decimal > 12.0 && decimal <= 16.0) {
    return {
      headline: 'Today Evening (by 8:00 PM)',
      badge: 'Today by 8 PM',
      summary: 'Delivers today evening by 8:00 PM',
      slotKey: 'TODAY_NIGHT_8PM',
      isToday: true
    }
  } else {
    return {
      headline: 'Tomorrow Morning',
      badge: 'Tomorrow Morning',
      summary: 'Delivers tomorrow morning',
      slotKey: 'TOMORROW_MORNING',
      isToday: false
    }
  }
}
