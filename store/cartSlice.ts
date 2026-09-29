import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type PackagingType = 'SINGLE' | 'BOX' | 'CARTON'

export interface CartItem {
  productId: string
  variantId: string
  productName: string
  productSlug: string
  imageUrl: string
  packagingType: PackagingType
  weightGrams: number
  unitsInPack: number
  skuCode: string
  unitPrice: number        // price used at time of adding (retail or b2b)
  quantity: number
  lineTotal: number
}

interface CartState {
  items: CartItem[]
  isB2BMode: boolean       // toggles which price to show
  isOpen: boolean          // cart drawer open/close
}

const CART_STORAGE_KEY = 'anmol_cart_items_v1'
const B2B_STORAGE_KEY = 'anmol_cart_b2b_mode_v1'

const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    if (saved) {
      const items = JSON.parse(saved)
      if (Array.isArray(items)) return items
    }
  } catch (e) {
    console.error('Error loading cart from storage:', e)
  }
  return []
}

const loadB2BFromStorage = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const saved = localStorage.getItem(B2B_STORAGE_KEY)
    if (saved !== null) return JSON.parse(saved)
  } catch (e) {}
  return false
}

const saveCartToStorage = (items: CartItem[], isB2BMode: boolean) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    localStorage.setItem(B2B_STORAGE_KEY, JSON.stringify(isB2BMode))
  } catch (e) {
    console.error('Error saving cart to storage:', e)
  }
}

const initialState: CartState = {
  items: loadCartFromStorage(),
  isB2BMode: loadB2BFromStorage(),
  isOpen: false,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrateCart: (state) => {
      state.items = loadCartFromStorage()
      state.isB2BMode = loadB2BFromStorage()
    },
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(i => i.variantId === action.payload.variantId)
      if (existing) {
        existing.quantity += action.payload.quantity
        existing.lineTotal = existing.unitPrice * existing.quantity
      } else {
        state.items.push({ ...action.payload })
      }
      saveCartToStorage(state.items, state.isB2BMode)
    },
    removeItem: (state, action: PayloadAction<string>) => { // variantId
      state.items = state.items.filter(i => i.variantId !== action.payload)
      saveCartToStorage(state.items, state.isB2BMode)
    },
    incrementItem: (state, action: PayloadAction<string>) => { // variantId
      const item = state.items.find(i => i.variantId === action.payload)
      if (item) { 
        item.quantity += 1
        item.lineTotal = item.unitPrice * item.quantity 
      }
      saveCartToStorage(state.items, state.isB2BMode)
    },
    decrementItem: (state, action: PayloadAction<string>) => { // variantId
      const item = state.items.find(i => i.variantId === action.payload)
      if (item) {
        item.quantity -= 1
        if (item.quantity <= 0) {
          state.items = state.items.filter(i => i.variantId !== action.payload)
        } else {
          item.lineTotal = item.unitPrice * item.quantity
        }
      }
      saveCartToStorage(state.items, state.isB2BMode)
    },
    clearCart: (state) => { 
      state.items = []
      saveCartToStorage([], state.isB2BMode)
    },
    toggleB2BMode: (state) => { 
      state.isB2BMode = !state.isB2BMode 
      saveCartToStorage(state.items, state.isB2BMode)
    },
    openCart: (state) => { state.isOpen = true },
    closeCart: (state) => { state.isOpen = false },
  },
})

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items
export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((acc, i) => acc + i.quantity, 0)
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((acc, i) => acc + i.lineTotal, 0)
export const selectIsB2BMode = (state: { cart: CartState }) => state.cart.isB2BMode
export const selectCartOpen = (state: { cart: CartState }) => state.cart.isOpen

export const { hydrateCart, addItem, removeItem, incrementItem, decrementItem,
               clearCart, toggleB2BMode, openCart, closeCart } = cartSlice.actions
export default cartSlice.reducer
