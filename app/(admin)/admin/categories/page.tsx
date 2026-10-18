'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Layers, Plus, Search, Edit3, Trash2, Eye, EyeOff, 
  Package, CheckCircle2, ArrowUpDown, ExternalLink, Sparkles, Filter
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const EMOJI_PRESETS = [
  '🍟', '🧀', '🌯', '🌽', '✨', '🍕', '🍔', '🥟', '🥤', '📦', '🍗', '🍖', '🥪', '🍲', '🥗', '🍱'
]

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🍟',
    sortOrder: 0,
    isActive: true
  })

  // Fetch admin categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetch('/api/admin/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    }
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create category')
      return data
    },
    onSuccess: (data) => {
      showToast(data.message || 'Category created!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeModal()
    },
    onError: (err: any) => {
      showToast(err.message || 'Creation failed', 'error')
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update category')
      return data
    },
    onSuccess: (data) => {
      showToast(data.message || 'Category updated!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeModal()
    },
    onError: (err: any) => {
      showToast(err.message || 'Update failed', 'error')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete category')
      return data
    },
    onSuccess: (data) => {
      showToast(data.message || 'Category removed/deactivated', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Delete failed', 'error')
    }
  })

  const openAddModal = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      emoji: '🍟',
      sortOrder: (categories.length || 0) + 1,
      isActive: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (cat: any) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      emoji: cat.emoji || '📦',
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive !== false
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      return showToast('Category name is required', 'error')
    }

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        payload: formData
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleToggleActive = (cat: any) => {
    updateMutation.mutate({
      id: cat.id,
      payload: { isActive: !cat.isActive }
    })
  }

  const handleDelete = (cat: any) => {
    const hasProducts = (cat._count?.products || 0) > 0
    const msg = hasProducts
      ? `Category "${cat.name}" has ${cat._count.products} products attached. It will be deactivated instead of deleted. Proceed?`
      : `Are you sure you want to delete category "${cat.name}"?`

    if (confirm(msg)) {
      deleteMutation.mutate(cat.id)
    }
  }

  // Filter categories
  const filteredCategories = categories.filter((cat: any) => {
    const matchesSearch = 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    if (statusFilter === 'ACTIVE') return cat.isActive
    if (statusFilter === 'INACTIVE') return !cat.isActive
    return true
  })

  // Aggregate stats
  const totalCategories = categories.length
  const activeCount = categories.filter((c: any) => c.isActive).length
  const totalAssignedProducts = categories.reduce((sum: number, c: any) => sum + (c._count?.products || 0), 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#111625] p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Category Management
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Structure your McCain catalog, assign distinctive emojis, and manage navigation groups.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111625] p-5 rounded-3xl border border-slate-800/80 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Categories
            </span>
            <span className="text-2xl font-black text-white">{totalCategories}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111625] p-5 rounded-3xl border border-slate-800/80 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Active on Storefront
            </span>
            <span className="text-2xl font-black text-emerald-400">{activeCount}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111625] p-5 rounded-3xl border border-slate-800/80 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Catalog Items Linked
            </span>
            <span className="text-2xl font-black text-blue-400">{totalAssignedProducts}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111625] p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search category name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B0F19] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === filter
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-[#0B0F19] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold">Loading category taxonomy...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-16 text-center bg-[#111625] rounded-3xl border border-slate-800 p-8">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-base text-white">No categories found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search filter or create a new category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat: any) => {
            const productCount = cat._count?.products || 0

            return (
              <div
                key={cat.id}
                className={`bg-[#111625] rounded-3xl p-5 border flex flex-col justify-between shadow-xl transition-all ${
                  cat.isActive ? 'border-slate-800 hover:border-slate-700' : 'border-rose-950/60 bg-rose-950/10 opacity-75'
                }`}
              >
                <div>
                  {/* Top Bar: Emoji & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
                      {cat.emoji || '📦'}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 bg-[#0B0F19] px-2 py-0.5 rounded-md border border-slate-800">
                        Order #{cat.sortOrder || 0}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        cat.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Slug */}
                  <h3 className="font-black text-base text-white">{cat.name}</h3>
                  <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                    /{cat.slug}
                  </span>

                  {/* Products count pill */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-400" /> Catalog Items:
                    </span>
                    <span className="font-black text-xs text-white bg-[#0B0F19] px-2.5 py-0.5 rounded-lg border border-slate-800">
                      {productCount} {productCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                {/* Actions row */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="flex items-center justify-center gap-1 bg-[#0B0F19] hover:bg-slate-800 text-slate-300 text-xs font-bold py-2 rounded-xl border border-slate-800 transition-all"
                    title="Edit Category"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleToggleActive(cat)}
                    className="flex items-center justify-center gap-1 bg-[#0B0F19] hover:bg-slate-800 text-slate-300 text-xs font-bold py-2 rounded-xl border border-slate-800 transition-all"
                    title="Toggle Visibility"
                  >
                    {cat.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleDelete(cat)}
                    className="flex items-center justify-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold py-2 rounded-xl border border-rose-500/30 transition-all"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#111625] rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 border border-slate-800 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
                </h3>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-slate-400 hover:text-white font-bold flex items-center justify-center border border-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Emoji Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Select Visual Emoji
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#0B0F19] rounded-2xl border border-slate-800">
                  {EMOJI_PRESETS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji: em })}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all ${
                        formData.emoji === em 
                          ? 'bg-amber-500 text-slate-950 scale-110 shadow-xs' 
                          : 'bg-[#111625] hover:bg-slate-800 text-white'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Potato Appetizers"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0B0F19] border border-slate-800 text-xs sm:text-sm text-white rounded-2xl px-4 py-3 font-semibold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Display Order & Active */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0B0F19] border border-slate-800 text-xs sm:text-sm text-white rounded-2xl px-4 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`w-full py-2.5 px-3 rounded-2xl text-xs font-black transition-all border ${
                      formData.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {formData.isActive ? 'Active on Store' : 'Hidden / Inactive'}
                  </button>
                </div>
              </div>

              {/* Live Preview Pill */}
              <div className="p-3 bg-[#0B0F19] rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Storefront Tag:</span>
                <span className="text-xs font-black bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span>{formData.emoji}</span>
                  <span>{formData.name || 'Untitled Category'}</span>
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}
