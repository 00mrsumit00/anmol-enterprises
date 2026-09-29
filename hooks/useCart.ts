import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  hydrateCart,
  addItem,
  removeItem,
  incrementItem,
  decrementItem,
  clearCart,
  toggleB2BMode,
  openCart,
  closeCart,
  selectCartItems,
  selectCartCount,
  selectCartTotal,
  selectIsB2BMode,
  selectCartOpen,
  CartItem,
} from '@/store/cartSlice'

export function useCart() {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectCartItems)
  const count = useAppSelector(selectCartCount)
  const total = useAppSelector(selectCartTotal)
  const isB2BMode = useAppSelector(selectIsB2BMode)
  const isOpen = useAppSelector(selectCartOpen)

  // Re-hydrate saved cart from localStorage on client mount
  useEffect(() => {
    dispatch(hydrateCart())
  }, [dispatch])

  const add = (item: CartItem) => dispatch(addItem(item))
  const remove = (variantId: string) => dispatch(removeItem(variantId))
  const increment = (variantId: string) => dispatch(incrementItem(variantId))
  const decrement = (variantId: string) => dispatch(decrementItem(variantId))
  const clear = () => dispatch(clearCart())
  const toggleB2B = () => dispatch(toggleB2BMode())
  const open = () => dispatch(openCart())
  const close = () => dispatch(closeCart())

  return {
    items,
    count,
    total,
    isB2BMode,
    isOpen,
    add,
    remove,
    increment,
    decrement,
    clear,
    toggleB2B,
    open,
    close,
  }
}
