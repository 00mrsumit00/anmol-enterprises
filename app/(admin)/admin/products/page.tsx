'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Package, Plus, Search, Filter, Edit3, Trash2, Eye, EyeOff, 
  Sparkles, CheckCircle2, AlertCircle, LayoutGrid, List, Tag, Image as ImageIcon,
  DollarSign, ShieldCheck, Flame, ChevronRight, UploadCloud, Star, ArrowLeft, ArrowRight,
  Upload, X, Boxes, ShoppingBag, Layers, BarChart3, Check
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { OFFICIAL_PACKET_IMAGES, normalizeImageUrl } from '@/lib/productImages'

const PRESET_OFFICIAL_IMAGES = [
  { name: 'Smiles', url: '/images/products/mccain-smiles.jpg' },
  { name: 'French Fries', url: '/images/products/mccain-french-fries-420g.jpg' },
  { name: 'Potato Cheese Shotz', url: '/images/products/mccain-potato-cheese-shotz.jpg' },
  { name: 'Aloo Tikki', url: '/images/products/mccain-aloo-tikki.jpg' },
  { name: 'Chilli Cheesy Nuggets', url: '/images/products/mccain-chilli-cheesy-nuggets.jpg' },
  { name: 'Chilli Garlic Bites', url: '/images/products/mccain-chilli-garlic-potato-bites.jpg' },
  { name: 'Veggie Burger Patty', url: '/images/products/mccain-veggie-burger-patty.jpg' },
  { name: 'Super Wedges', url: '/images/products/mccain-super-wedges.jpg' },
  { name: 'Masala Fries', url: '/images/products/mccain-masala-fries.jpg' },
  { name: 'Onion Rings', url: '/images/products/mccain-onion-rings.jpg' },
  { name: 'Veggie Fingers', url: '/images/products/mccain-veggie-fingers.jpg' },
  { name: 'Pepper Crunch', url: '/images/products/mccain-french-fries-pepper-crunch.jpg' },
  { name: 'Cheese Pizza Samosa', url: '/images/products/mccain-cheese-pizza-style-filling-mini-samosa.jpg' },
  { name: 'Variety Pack', url: '/images/products/mccain-variety-pack.jpg' },
]

export default function AdminProductsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Controls & Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [customImageUrlInput, setCustomImageUrlInput] = useState('')

  // Inline Category Creation State
  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('🍟')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  const handleCreateCategoryInline = async () => {
    if (!newCategoryName.trim()) {
      showToast('Please enter a category name', 'error')
      return
    }
    setIsCreatingCategory(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          emoji: newCategoryEmoji.trim() || '🍟'
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create category')

      showToast(`Category "${data.category.name}" created!`, 'success')
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      setFormData((prev: any) => ({ ...prev, categoryId: data.category.id }))
      setNewCategoryName('')
      setNewCategoryEmoji('🍟')
      setShowAddCategoryInline(false)
    } catch (err: any) {
      showToast(err.message || 'Failed to create category', 'error')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  // Product Quick Preview State (for Product List)
  const [selectedPreviewProduct, setSelectedPreviewProduct] = useState<any>(null)
  const [previewVariantType, setPreviewVariantType] = useState<'SINGLE' | 'BOX' | 'CARTON'>('SINGLE')

  // Form Fields State (with complete Quantity & Stock support)
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    brand: 'McCain',
    isVeg: true,
    imageUrl: '/images/products/mccain-smiles.jpg',
    galleryImages: ['/images/products/mccain-smiles.jpg'] as string[],
    isFeatured: false,
    isActive: true,
    singlePackUnit: '400g',
    singlePieces: 1,
    singleWeight: 400,
    singleStock: 100,
    reorderLevel: 10,
    singlePrice: 199,
    singleB2bPrice: 169,
    boxUnits: 10,
    boxStock: 50,
    boxPrice: 1790,
    boxB2bPrice: 1520,
    cartonUnits: 50,
    cartonStock: 20,
    cartonPrice: 8450,
    cartonB2bPrice: 7150,
  })

  // Live Modal Preview Tab & Active Thumbnail
  const [modalPreviewPackaging, setModalPreviewPackaging] = useState<'SINGLE' | 'BOX' | 'CARTON'>('SINGLE')
  const [modalActiveImageIdx, setModalActiveImageIdx] = useState<number>(0)

  // Fetch all admin products
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await fetch('/api/admin/products')
      if (!res.ok) throw new Error('Failed to fetch product catalog')
      return res.json()
    }
  })

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) return []
      return res.json()
    }
  })

  // Create Product Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const text = await res.text()
      let data: any = {}
      try {
        data = JSON.parse(text)
      } catch {
        const cleanMsg = text.includes('<pre>')
          ? text.match(/<pre>([\s\S]*?)<\/pre>/)?.[1]?.replace(/<[^>]+>/g, '')?.trim()
          : text.replace(/<[^>]+>/g, '').trim()
        data = { error: cleanMsg || 'Server error occurred' }
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create product')
      return data
    },
    onSuccess: () => {
      showToast('New product added successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      closeModal()
    },
    onError: (err: any) => {
      showToast(err.message || 'Creation failed', 'error')
    }
  })

  // Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const text = await res.text()
      let data: any = {}
      try {
        data = JSON.parse(text)
      } catch {
        const cleanMsg = text.includes('<pre>')
          ? text.match(/<pre>([\s\S]*?)<\/pre>/)?.[1]?.replace(/<[^>]+>/g, '')?.trim()
          : text.replace(/<[^>]+>/g, '').trim()
        data = { error: cleanMsg || 'Server error occurred' }
      }
      if (!res.ok) throw new Error(data.error || 'Failed to update product')
      return data
    },
    onSuccess: () => {
      showToast('Product updated successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      closeModal()
    },
    onError: (err: any) => {
      showToast(err.message || 'Update failed', 'error')
    }
  })

  // Delete / Deactivate Product Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch { data = { error: text || 'Server response error' } }
      if (!res.ok) throw new Error(data.error || 'Failed to delete product')
      return data
    },
    onSuccess: (data) => {
      showToast(data.message || 'Product removed!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Delete failed', 'error')
    }
  })

  // Open Add Modal
  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      description: '',
      brand: 'McCain',
      isVeg: true,
      imageUrl: '/images/products/mccain-smiles.jpg',
      galleryImages: ['/images/products/mccain-smiles.jpg'],
      isFeatured: false,
      isActive: true,
      singlePackUnit: '400g',
      singlePieces: 1,
      singleWeight: 400,
      singleStock: 100,
      reorderLevel: 10,
      singlePrice: 199,
      singleB2bPrice: 169,
      boxUnits: 10,
      boxStock: 50,
      boxPrice: 1790,
      boxB2bPrice: 1520,
      cartonUnits: 50,
      cartonStock: 20,
      cartonPrice: 8450,
      cartonB2bPrice: 7150,
    })
    setModalActiveImageIdx(0)
    setModalPreviewPackaging('SINGLE')
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (product: any) => {
    setEditingProduct(product)
    const singleVar = product.variants?.find((v: any) => v.packagingType === 'SINGLE') || {}
    const boxVar = product.variants?.find((v: any) => v.packagingType === 'BOX') || {}
    const cartonVar = product.variants?.find((v: any) => v.packagingType === 'CARTON') || {}

    const gallery = product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0
      ? product.galleryImages
      : [product.imageUrl || '/images/products/mccain-smiles.jpg']

    const pieces = singleVar.unitsInPack || 1
    const packUnit = pieces > 1
      ? `${pieces} Pieces`
      : (singleVar.weightGrams >= 1000 ? `${(singleVar.weightGrams / 1000).toFixed(1)} kg` : `${singleVar.weightGrams || 400}g`)

    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      description: product.description,
      brand: product.brand || 'McCain',
      isVeg: product.isVeg !== undefined ? product.isVeg : true,
      imageUrl: product.imageUrl || gallery[0],
      galleryImages: gallery,
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== undefined ? product.isActive : true,
      singlePackUnit: packUnit,
      singlePieces: pieces,
      singleWeight: singleVar.weightGrams || 400,
      singleStock: singleVar.stockCount !== undefined ? singleVar.stockCount : 100,
      reorderLevel: singleVar.reorderLevel !== undefined ? singleVar.reorderLevel : 10,
      singlePrice: singleVar.retailPrice || 199,
      singleB2bPrice: singleVar.b2bPrice || 169,
      boxUnits: boxVar.unitsInPack || 10,
      boxStock: boxVar.stockCount !== undefined ? boxVar.stockCount : 50,
      boxPrice: boxVar.retailPrice || 1790,
      boxB2bPrice: boxVar.b2bPrice || 1520,
      cartonUnits: cartonVar.unitsInPack || 50,
      cartonStock: cartonVar.stockCount !== undefined ? cartonVar.stockCount : 20,
      cartonPrice: cartonVar.retailPrice || 8450,
      cartonB2bPrice: cartonVar.b2bPrice || 7150,
    })
    setModalActiveImageIdx(0)
    setModalPreviewPackaging('SINGLE')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setCustomImageUrlInput('')
    setModalActiveImageIdx(0)
  }

  // Handle Multi-Image Upload from Device
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const uploadedUrls: string[] = []
    let failedCount = 0

    showToast(`Uploading ${files.length} image(s)...`, 'info')

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, base64Data })
        })

        if (res.ok) {
          const data = await res.json()
          if (data.url) uploadedUrls.push(data.url)
        } else {
          failedCount++
          console.error(`Failed to upload ${file.name}: Status ${res.status}`)
        }
      } catch (err) {
        failedCount++
        console.error('File upload error:', err)
      }
    }

    // Reset input so user can re-select files
    e.target.value = ''
    setIsUploading(false)

    if (uploadedUrls.length > 0) {
      const updatedGallery = [...formData.galleryImages, ...uploadedUrls]
      setFormData({
        ...formData,
        imageUrl: formData.imageUrl || uploadedUrls[0],
        galleryImages: updatedGallery
      })
      showToast(`Uploaded ${uploadedUrls.length} image(s) successfully!`, 'success')
    }

    if (failedCount > 0) {
      showToast(`${failedCount} image(s) failed to upload`, 'error')
    }
  }

  // Add Custom Image URL / Google Drive URL
  const handleAddImageUrl = async () => {
    if (!customImageUrlInput.trim()) return
    const rawUrl = customImageUrlInput.trim()
    setCustomImageUrlInput('')

    // Immediately normalize URL (e.g. Google Drive sharing link -> direct image thumbnail)
    const directUrl = normalizeImageUrl(rawUrl)
    const updated = [...formData.galleryImages, directUrl]
    setFormData({
      ...formData,
      imageUrl: formData.imageUrl || directUrl,
      galleryImages: updated
    })
    showToast('Image URL added to gallery', 'info')

    // Try background download to /public/images/products/ for 100% permanence
    try {
      const res = await fetch('/api/admin/import-image-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.url && data.url !== directUrl) {
          setFormData((prev) => ({
            ...prev,
            imageUrl: prev.imageUrl === directUrl ? data.url : prev.imageUrl,
            galleryImages: prev.galleryImages.map((u) => (u === directUrl ? data.url : u))
          }))
        }
      }
    } catch (err) {
      console.warn('Backend sync failed, using direct URL:', err)
    }
  }

  // Helper for numeric inputs with auto-calculations & leading zero prevention
  const handleNumericChange = (field: string, rawVal: string, isInt = false) => {
    if (rawVal === '') {
      setFormData(prev => ({ ...prev, [field]: 0 }))
      return
    }
    const clean = rawVal.replace(/^0+(?=\d)/, '')
    const num = isInt ? parseInt(clean, 10) || 0 : parseFloat(clean) || 0

    setFormData(prev => {
      const updated = { ...prev, [field]: num }
      if (field === 'singlePrice') {
        updated.boxPrice = Math.round(num * (prev.boxUnits || 10) * 0.95)
        updated.cartonPrice = Math.round(num * (prev.cartonUnits || 50) * 0.90)
      } else if (field === 'singleB2bPrice') {
        updated.boxB2bPrice = Math.round(num * (prev.boxUnits || 10) * 0.95)
        updated.cartonB2bPrice = Math.round(num * (prev.cartonUnits || 50) * 0.90)
      } else if (field === 'singleStock') {
        updated.boxStock = Math.floor(num / (prev.boxUnits || 10))
        updated.cartonStock = Math.floor(num / (prev.cartonUnits || 50))
      } else if (field === 'boxUnits') {
        updated.boxStock = num > 0 ? Math.floor(prev.singleStock / num) : 0
        if (prev.singlePrice > 0) updated.boxPrice = Math.round(prev.singlePrice * num * 0.95)
        if (prev.singleB2bPrice > 0) updated.boxB2bPrice = Math.round(prev.singleB2bPrice * num * 0.95)
      } else if (field === 'cartonUnits') {
        updated.cartonStock = num > 0 ? Math.floor(prev.singleStock / num) : 0
        if (prev.singlePrice > 0) updated.cartonPrice = Math.round(prev.singlePrice * num * 0.90)
        if (prev.singleB2bPrice > 0) updated.cartonB2bPrice = Math.round(prev.singleB2bPrice * num * 0.90)
      }
      return updated
    })
  }

  // Set Primary Packet Image
  const handleSetPrimary = (url: string) => {
    const updated = [url, ...formData.galleryImages.filter((u) => u !== url)]
    setFormData({
      ...formData,
      imageUrl: url,
      galleryImages: updated
    })
    showToast('Set as Primary Packet Image (shows first on cards & PDP)', 'success')
  }

  // Remove Image from Gallery
  const handleRemoveImage = (url: string) => {
    const updated = formData.galleryImages.filter((u) => u !== url)
    setFormData({
      ...formData,
      imageUrl: updated[0] || '',
      galleryImages: updated
    })
  }

  // Move Image Order
  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= formData.galleryImages.length) return
    const updated = [...formData.galleryImages]
    const item = updated.splice(fromIdx, 1)[0]
    updated.splice(toIdx, 0, item)
    setFormData({
      ...formData,
      imageUrl: updated[0] || '',
      galleryImages: updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.description.trim()) {
      return showToast('Product Name and Summary are required', 'error')
    }

    let singlePieces = formData.singlePieces || 1
    let singleWeight = formData.singleWeight || 400

    const unitLower = (formData.singlePackUnit || '').toLowerCase().trim()
    if (unitLower.includes('pc') || unitLower.includes('piece')) {
      const match = unitLower.match(/(\d+)/)
      if (match) singlePieces = parseInt(match[1]) || 1
    } else if (unitLower.includes('kg')) {
      const match = unitLower.match(/([\d.]+)/)
      if (match) singleWeight = Math.round(parseFloat(match[1]) * 1000)
    } else if (unitLower.includes('g')) {
      const match = unitLower.match(/(\d+)/)
      if (match) singleWeight = parseInt(match[1]) || 400
    }

    const payload = {
      ...formData,
      singlePieces,
      singleWeight,
      imageUrl: formData.galleryImages[0] || formData.imageUrl
    }

    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct.id,
        payload
      })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleToggleActive = (product: any) => {
    updateMutation.mutate({
      id: product.id,
      payload: { isActive: !product.isActive }
    })
  }

  const handleDelete = (product: any) => {
    if (confirm(`Are you sure you want to delete or deactivate "${product.name}"?`)) {
      deleteMutation.mutate(product.id)
    }
  }

  // Filter products by search and category
  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6 font-sans text-white">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Product & Image Catalog Manager
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Manage McCain official product packets, multi-image galleries, and wholesale pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/bulk-import"
            className="flex items-center gap-1.5 bg-[#111625] hover:bg-slate-800 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-800 transition-all"
          >
            <UploadCloud className="w-4 h-4 text-purple-400" />
            <span>Bulk JSON Sync</span>
          </Link>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111625] p-3 rounded-2xl border border-slate-800/80 shadow-xl">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name, slug or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B0F19] border border-slate-800 text-xs text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-amber-500 transition-all font-medium"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0B0F19] border border-slate-800 text-xs rounded-xl px-3 py-2.5 font-bold text-slate-300 cursor-pointer focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0B0F19] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs' : 'text-slate-500 hover:text-slate-300'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs' : 'text-slate-500 hover:text-slate-300'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Loading state */}
      {isProductsLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold">Loading product catalog...</p>
        </div>
      )}

      {/* Grid View */}
      {!isProductsLoading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product: any) => {
            const singleVar = product.variants?.find((v: any) => v.packagingType === 'SINGLE') || {}
            const galleryCount = product.galleryImages?.length || 1

            return (
              <div
                key={product.id}
                className={`bg-[#111625] border rounded-3xl p-4 flex flex-col justify-between shadow-xl transition-all ${
                  product.isActive ? 'border-slate-800/80 hover:border-slate-700' : 'border-rose-900/50 bg-rose-950/20 opacity-75'
                }`}
              >
                {/* Top Row: Status & Actions */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                    product.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>

                  <span className="text-[10px] font-bold text-slate-400">
                    🖼️ {galleryCount} {galleryCount === 1 ? 'image' : 'images'}
                  </span>
                </div>

                {/* Packet Image */}
                <div className="w-full aspect-square bg-[#0B0F19] rounded-2xl p-2 flex items-center justify-center mb-3 border border-slate-800">
                  <img
                    src={product.imageUrl || '/images/products/mccain-smiles.jpg'}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/products/mccain-smiles.jpg'
                    }}
                  />
                </div>

                {/* Meta */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {product.category?.name || 'McCain Foods'}
                  </span>
                  <h3 className="font-black text-sm text-white line-clamp-1 leading-snug">
                    {product.name}
                  </h3>
                  
                  {/* Prices */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">Retail (MRP)</span>
                      <span className="font-black text-white">₹{singleVar.retailPrice || 0}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-purple-400 font-bold block">B2B Wholesale</span>
                      <span className="font-black text-purple-300">₹{singleVar.b2bPrice || 0}</span>
                    </div>
                  </div>

                  {/* Stock Level Indicator */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px]">
                    <span className="flex items-center gap-1 text-slate-400 font-semibold">
                      <Boxes className="w-3 h-3 text-amber-400" /> Pack Stock
                    </span>
                    <span className={`font-black px-2 py-0.5 rounded-md ${
                      (singleVar.stockCount ?? 100) <= (singleVar.reorderLevel ?? 10)
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {singleVar.stockCount ?? 100} units
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedPreviewProduct(product)
                      setPreviewVariantType('SINGLE')
                    }}
                    className="flex items-center justify-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold py-2 rounded-xl border border-amber-500/20 transition-all"
                    title="Live Storefront Preview"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => openEditModal(product)}
                    className="flex items-center justify-center gap-1 bg-[#0B0F19] hover:bg-slate-800 text-slate-300 text-[11px] font-bold py-2 rounded-xl border border-slate-800 transition-all"
                    title="Edit Product"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleToggleActive(product)}
                    className="flex items-center justify-center gap-1 bg-[#0B0F19] hover:bg-slate-800 text-slate-300 text-[11px] font-bold py-2 rounded-xl border border-slate-800 transition-all"
                    title="Toggle Active Status"
                  >
                    {product.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleDelete(product)}
                    className="flex items-center justify-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold py-2 rounded-xl border border-rose-500/30 transition-all"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Table View */}
      {!isProductsLoading && viewMode === 'table' && (
        <div className="bg-[#111625] rounded-3xl border border-slate-800/80 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1320] border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Packet Image</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Gallery</th>
                <th className="p-4">Retail Price</th>
                <th className="p-4">B2B Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((product: any) => {
                const singleVar = product.variants?.find((v: any) => v.packagingType === 'SINGLE') || {}
                return (
                  <tr key={product.id} className="hover:bg-slate-800/40">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-[#0B0F19] rounded-xl border border-slate-800 p-1 flex items-center justify-center">
                        <img
                          src={product.imageUrl || '/images/products/mccain-smiles.jpg'}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/products/mccain-smiles.jpg'
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-4 font-black text-white">{product.name}</td>
                    <td className="p-4 text-slate-400">{product.category?.name}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        (singleVar.stockCount ?? 100) <= (singleVar.reorderLevel ?? 10)
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {singleVar.stockCount ?? 100} units
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-bold">{product.galleryImages?.length || 1} images</td>
                    <td className="p-4 font-black text-white">₹{singleVar.retailPrice || 0}</td>
                    <td className="p-4 font-black text-purple-300">₹{singleVar.b2bPrice || 0}</td>
                    <td className="p-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        product.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPreviewProduct(product)
                            setPreviewVariantType('SINGLE')
                          }}
                          className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30"
                          title="Preview Product Panel"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 bg-[#0B0F19] hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className="p-2 bg-[#0B0F19] hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800"
                          title="Toggle Status"
                        >
                          {product.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ============ LIVE MULTI-IMAGE GALLERY ADD / EDIT PRODUCT MODAL ============ */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#111625] rounded-3xl max-w-6xl w-full p-5 sm:p-7 shadow-2xl flex flex-col gap-6 animate-scale-up my-auto max-h-[92vh] overflow-y-auto border border-slate-800">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white flex items-center gap-2">
                    {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New McCain Product'}
                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Live Preview Enabled
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Configure stock quantities, pricing tiers, upload high-res images, and preview live on the right.
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="w-9 h-9 rounded-2xl bg-[#0B0F19] hover:bg-slate-800 text-slate-400 hover:text-white font-bold flex items-center justify-center border border-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Split 2-Column Grid: Left = Form Inputs, Right = Live Storefront Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Form Controls (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  
                  {/* 1. PRODUCT DETAILS */}
                  <div className="p-4 bg-[#0B0F19] rounded-3xl border border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                      <Tag className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        1. Product Information
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Product Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. McCain Smiles"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-[#111625] border border-slate-800 text-xs sm:text-sm text-white rounded-2xl px-4 py-3 font-semibold focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Category *</label>
                          <button
                            type="button"
                            onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {showAddCategoryInline ? '✕ Use Existing' : '+ New Category'}
                          </button>
                        </div>

                        {showAddCategoryInline ? (
                          <div className="p-3 bg-[#111625] border border-amber-500/30 rounded-2xl flex flex-col gap-2.5 my-0.5">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-[11px] font-bold text-amber-300">Emoji & Title</span>
                              <div className="flex gap-1 flex-wrap">
                                {['🍟', '🧀', '🌯', '🌽', '✨', '🍕', '🍔', '🥟', '🥤', '📦'].map((em) => (
                                  <button
                                    key={em}
                                    type="button"
                                    onClick={() => setNewCategoryEmoji(em)}
                                    className={`w-6 h-6 text-xs rounded-md flex items-center justify-center transition-all ${
                                      newCategoryEmoji === em ? 'bg-amber-500 text-slate-950 scale-110 shadow-xs' : 'bg-slate-800 hover:bg-slate-700 text-white'
                                    }`}
                                  >
                                    {em}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="e.g. Party Platters"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="flex-1 bg-[#0B0F19] border border-slate-800 text-xs sm:text-sm text-white rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500"
                              />
                              <button
                                type="button"
                                onClick={handleCreateCategoryInline}
                                disabled={isCreatingCategory}
                                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                              >
                                {isCreatingCategory ? 'Adding...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full bg-[#111625] border border-slate-800 text-xs sm:text-sm rounded-2xl px-4 py-3 font-semibold text-white cursor-pointer focus:outline-none focus:border-amber-500"
                            required
                          >
                            {categories.map((cat: any) => (
                              <option key={cat.id} value={cat.id} className="bg-[#111625] text-white">
                                {cat.emoji} {cat.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Brand Name */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Brand Name</label>
                        <input
                          type="text"
                          placeholder="e.g. McCain, Fresh Catch, etc."
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          className="w-full bg-[#111625] border border-slate-800 text-xs sm:text-sm text-white rounded-2xl px-4 py-3 font-semibold focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Dietary Type: Veg / Non-Veg */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dietary Category *</label>
                        <div className="flex items-center gap-2 h-full">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isVeg: true })}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                              formData.isVeg
                                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50 shadow-xs'
                                : 'bg-[#111625] border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div className="w-3.5 h-3.5 rounded-xs border border-emerald-500 p-0.5 flex items-center justify-center bg-white">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                            </div>
                            <span>Veg (Green Dot)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isVeg: false })}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                              !formData.isVeg
                                ? 'bg-red-950/60 border-red-500 text-red-300 ring-1 ring-red-500/50 shadow-xs'
                                : 'bg-[#111625] border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div className="w-3.5 h-3.5 rounded-xs border border-red-600 p-0.5 flex items-center justify-center bg-white">
                              <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-red-700" />
                            </div>
                            <span>Non-Veg (Red Dot)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Summary Description *</label>
                      <textarea
                        rows={2}
                        placeholder="Crispy on the outside, mashed potato happiness inside. A classic teatime and party snack."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-[#111625] border border-slate-800 text-xs text-white rounded-2xl p-3 font-semibold focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  {/* 2. MULTI-IMAGE GALLERY MANAGER */}
                  <div className="p-4 bg-[#0B0F19] rounded-3xl border border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          2. Gallery & Packet Image ({formData.galleryImages.length} images)
                        </h4>
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        ⭐ First image is Primary Packet Image
                      </span>
                    </div>

                    {/* Upload Buttons & URL Input */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <label className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all ${
                        isUploading ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-xs'
                      }`}>
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? 'Uploading...' : 'Upload Device Images'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>

                      <div className="flex-1 flex items-center gap-2 w-full">
                        <input
                          type="text"
                          placeholder="Or paste image URL"
                          value={customImageUrlInput}
                          onChange={(e) => setCustomImageUrlInput(e.target.value)}
                          className="flex-1 bg-[#111625] border border-slate-800 text-xs text-white placeholder-slate-500 rounded-2xl px-3 py-2.5 font-medium focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-3.5 py-2.5 bg-[#111625] hover:bg-slate-800 text-amber-400 text-xs font-black rounded-2xl border border-slate-800 shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Presets & Gallery Images Grid */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500 font-bold">Quick Presets:</span>
                      {PRESET_OFFICIAL_IMAGES.slice(0, 7).map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            if (!formData.galleryImages.includes(preset.url)) {
                              setFormData({
                                ...formData,
                                galleryImages: [...formData.galleryImages, preset.url]
                              })
                            }
                          }}
                          className="text-[9px] bg-[#111625] hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 font-bold px-2.5 py-1 rounded-xl border border-slate-800 transition-all"
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>

                    {/* Thumbnails grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                      {formData.galleryImages.map((url, idx) => {
                        const isPrimary = idx === 0
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-2xl p-2 border flex flex-col items-center gap-1.5 transition-all ${
                              isPrimary ? 'bg-amber-500/10 border-amber-500/40' : 'bg-[#111625] border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {isPrimary && (
                              <span className="absolute -top-2 left-2 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-md shadow-2xs flex items-center gap-0.5 z-10">
                                <Star className="w-2.5 h-2.5 fill-slate-950" /> PACKET
                              </span>
                            )}
                            <div className="w-full aspect-square flex items-center justify-center p-1 rounded-xl overflow-hidden bg-[#0B0F19] border border-slate-800">
                              <img
                                src={normalizeImageUrl(url)}
                                alt={`Slide ${idx + 1}`}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/products/mccain-smiles.jpg'
                                }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">Slide {idx + 1}</span>
                            <div className="flex items-center gap-1 w-full justify-between pt-1 border-t border-slate-800">
                              {!isPrimary ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(url)}
                                  className="text-[8px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-black px-1.5 py-0.5 rounded border border-amber-500/30"
                                >
                                  ⭐ Set
                                </button>
                              ) : (
                                <span className="text-[8px] text-amber-400 font-bold">Primary</span>
                              )}
                              <div className="flex items-center gap-0.5">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, idx - 1)}
                                    className="p-0.5 text-slate-400 hover:text-white text-[10px]"
                                  >
                                    ◀
                                  </button>
                                )}
                                {idx < formData.galleryImages.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, idx + 1)}
                                    className="p-0.5 text-slate-400 hover:text-white text-[10px]"
                                  >
                                    ▶
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(url)}
                                  className="p-0.5 text-rose-400 hover:text-rose-300 text-xs font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 3. PACKAGING VARIANTS, QUANTITY & STOCK */}
                  <div className="p-4 bg-[#0B0F19] rounded-3xl border border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">
                          3. Quantity, Stock & Pricing
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        Pack • Box • Carton
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      
                      {/* Single Pack Row */}
                      <div className="bg-[#111625] p-3.5 rounded-2xl border border-slate-800/90 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            Single Retail Pack ({formData.singlePackUnit || `${formData.singleWeight}g`})
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">Base retail consumer unit</span>
                        </div>

                        {/* Quick Pack Size Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-bold">Quick Pack Size:</span>
                          {[
                            { label: '3 Pieces', pieces: 3, weight: 300 },
                            { label: '10 pcs', pieces: 10, weight: 500 },
                            { label: '250g', pieces: 1, weight: 250 },
                            { label: '400g', pieces: 1, weight: 400 },
                            { label: '420g', pieces: 1, weight: 420 },
                            { label: '1 kg', pieces: 1, weight: 1000 },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  singlePackUnit: preset.label,
                                  singlePieces: preset.pieces,
                                  singleWeight: preset.weight
                                })
                              }}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                                formData.singlePackUnit === preset.label
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black'
                                  : 'bg-[#0B0F19] hover:bg-slate-800 text-slate-400 border-slate-800'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          <div>
                            <label className="text-[9px] font-bold text-amber-400 block mb-1">Pack Size / Pcs</label>
                            <input
                              type="text"
                              value={formData.singlePackUnit}
                              onChange={(e) => setFormData({ ...formData, singlePackUnit: e.target.value })}
                              placeholder="e.g. 3 Pieces, 250g"
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-amber-300 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">Weight (g)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.singleWeight === 0 ? '' : formData.singleWeight}
                              onChange={(e) => handleNumericChange('singleWeight', e.target.value)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-emerald-400 block mb-1">Pack Stock (Qty)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.singleStock === 0 ? '' : formData.singleStock}
                              onChange={(e) => handleNumericChange('singleStock', e.target.value, true)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-emerald-300 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">Retail MRP (₹)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.singlePrice === 0 ? '' : formData.singlePrice}
                              onChange={(e) => handleNumericChange('singlePrice', e.target.value)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-purple-400 block mb-1">B2B Wholesale (₹)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.singleB2bPrice === 0 ? '' : formData.singleB2bPrice}
                              onChange={(e) => handleNumericChange('singleB2bPrice', e.target.value)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-purple-300 focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                          <span className="text-slate-400">Low Stock Alert Threshold:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.reorderLevel === 0 ? '' : formData.reorderLevel}
                              onChange={(e) => handleNumericChange('reorderLevel', e.target.value, true)}
                              className="w-16 bg-[#0B0F19] border border-slate-800 rounded-lg px-2 py-0.5 text-xs font-black text-amber-300 text-center"
                            />
                            <span className="text-slate-500 font-bold">units</span>
                          </div>
                        </div>
                      </div>

                      {/* Box Pack Row */}
                      <div className="bg-[#111625] p-3.5 rounded-2xl border border-slate-800/90 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            Medium Box Pack ({formData.boxUnits} Units/Box)
                          </span>
                          {/* Quick presets for box units */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-slate-500 font-bold">Units:</span>
                            {[6, 10, 12, 24].map((u) => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => handleNumericChange('boxUnits', String(u), true)}
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  formData.boxUnits === u
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                    : 'bg-[#0B0F19] text-slate-400 border-slate-800'
                                }`}
                              >
                                {u}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">Units In Box</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.boxUnits === 0 ? '' : formData.boxUnits}
                              onChange={(e) => handleNumericChange('boxUnits', e.target.value, true)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-emerald-400 block mb-1">Box Stock (Qty)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.boxStock === 0 ? '' : formData.boxStock}
                              onChange={(e) => handleNumericChange('boxStock', e.target.value, true)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-emerald-300 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">Retail Box (₹)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.boxPrice === 0 ? '' : formData.boxPrice}
                              onChange={(e) => handleNumericChange('boxPrice', e.target.value)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-purple-400 block mb-1">B2B Box (₹)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.boxB2bPrice === 0 ? '' : formData.boxB2bPrice}
                              onChange={(e) => handleNumericChange('boxB2bPrice', e.target.value)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-purple-300 focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bulk Carton Row */}
                      <div className="bg-[#111625] p-3.5 rounded-2xl border border-slate-800/90 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            Bulk Master Carton ({formData.cartonUnits} Units/Carton)
                          </span>
                          {/* Quick presets for carton units */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-slate-500 font-bold">Units:</span>
                            {[20, 24, 48, 50, 100].map((u) => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => handleNumericChange('cartonUnits', String(u), true)}
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  formData.cartonUnits === u
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                    : 'bg-[#0B0F19] text-slate-400 border-slate-800'
                                }`}
                              >
                                {u}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">Units In Carton</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.cartonUnits === 0 ? '' : formData.cartonUnits}
                              onChange={(e) => handleNumericChange('cartonUnits', e.target.value, true)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-emerald-400 block mb-1">Carton Stock (Qty)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.cartonStock === 0 ? '' : formData.cartonStock}
                              onChange={(e) => handleNumericChange('cartonStock', e.target.value, true)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-emerald-300 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">Retail Carton (₹)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.cartonPrice === 0 ? '' : formData.cartonPrice}
                              onChange={(e) => handleNumericChange('cartonPrice', e.target.value)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-purple-400 block mb-1">B2B Carton (₹)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.cartonB2bPrice === 0 ? '' : formData.cartonB2bPrice}
                              onChange={(e) => handleNumericChange('cartonB2bPrice', e.target.value)}
                              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-2 text-xs font-black text-purple-300 focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-7 py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                    </button>
                  </div>

                </form>
              </div>

              {/* Right Column: Live Product Preview Panel (5 cols) */}
              <div className="lg:col-span-5 sticky top-2 flex flex-col gap-4">
                
                {/* Preview Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Live Storefront Preview
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold bg-[#0B0F19] border border-slate-800 px-2 py-0.5 rounded-lg">
                    Real-Time Simulation
                  </span>
                </div>

                {/* Preview Card */}
                {(() => {
                  const previewImage = formData.galleryImages[modalActiveImageIdx] || formData.imageUrl || '/images/products/mccain-smiles.jpg'
                  const activeCategory = categories.find((c: any) => c.id === formData.categoryId)
                  
                  // Active packaging values
                  let activeRetail = formData.singlePrice
                  let activeB2b = formData.singleB2bPrice
                  let activeStock = formData.singleStock
                  let packLabel = `Single Pack (${formData.singleWeight}g)`

                  if (modalPreviewPackaging === 'BOX') {
                    activeRetail = formData.boxPrice
                    activeB2b = formData.boxB2bPrice
                    activeStock = formData.boxStock
                    packLabel = `Box (${formData.boxUnits} Units)`
                  } else if (modalPreviewPackaging === 'CARTON') {
                    activeRetail = formData.cartonPrice
                    activeB2b = formData.cartonB2bPrice
                    activeStock = formData.cartonStock
                    packLabel = `Bulk Carton (${formData.cartonUnits} Units)`
                  }

                  const isLowStock = activeStock <= formData.reorderLevel

                  return (
                    <div className="bg-[#0B0F19] rounded-3xl border border-slate-700/60 p-4 sm:p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
                      
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                          {activeCategory?.emoji || '🍟'} {activeCategory?.name || 'McCain Foods'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {formData.brand?.toLowerCase() === 'mccain' && (
                            <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-md uppercase">
                              McCain
                            </span>
                          )}
                          {formData.isVeg ? (
                            <span className="w-4 h-4 rounded-xs border border-emerald-500 p-0.5 flex items-center justify-center bg-white" title="100% Vegetarian">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-xs border border-red-600 p-0.5 flex items-center justify-center bg-white" title="Non-Vegetarian">
                              <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-red-600"></span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Main Packet Display */}
                      <div className="relative w-full aspect-square bg-gradient-to-b from-[#111625] to-[#0A0D14] rounded-2xl p-4 flex items-center justify-center border border-slate-800 group">
                        <img
                          src={normalizeImageUrl(previewImage)}
                          alt={formData.name || 'Preview'}
                          className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/products/mccain-smiles.jpg'
                          }}
                        />

                        {/* Slide Indicator */}
                        <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-800">
                          {modalActiveImageIdx + 1} / {formData.galleryImages.length}
                        </span>
                      </div>

                      {/* Gallery Thumbnails Strip */}
                      {formData.galleryImages.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {formData.galleryImages.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setModalActiveImageIdx(idx)}
                              className={`w-11 h-11 rounded-xl p-1 shrink-0 border transition-all ${
                                modalActiveImageIdx === idx 
                                  ? 'border-amber-400 bg-amber-500/10 scale-105' 
                                  : 'border-slate-800 bg-[#111625] hover:border-slate-700'
                              }`}
                            >
                              <img
                                src={normalizeImageUrl(url)}
                                alt={`Thumb ${idx + 1}`}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/products/mccain-smiles.jpg'
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-black text-base text-white leading-tight">
                          {formData.name || 'Untitled McCain Product'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {formData.description || 'Enter a summary description on the left to preview it here.'}
                        </p>
                      </div>

                      {/* Packaging Selector Tabs */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Select Packaging Size
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 bg-[#111625] p-1 rounded-2xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setModalPreviewPackaging('SINGLE')}
                            className={`py-1.5 text-[10px] font-bold rounded-xl transition-all ${
                              modalPreviewPackaging === 'SINGLE'
                                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Single ({formData.singlePackUnit || `${formData.singleWeight}g`})
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalPreviewPackaging('BOX')}
                            className={`py-1.5 text-[10px] font-bold rounded-xl transition-all ${
                              modalPreviewPackaging === 'BOX'
                                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Box ({formData.boxUnits} pcs)
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalPreviewPackaging('CARTON')}
                            className={`py-1.5 text-[10px] font-bold rounded-xl transition-all ${
                              modalPreviewPackaging === 'CARTON'
                                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Carton ({formData.cartonUnits} pcs)
                          </button>
                        </div>
                      </div>

                      {/* Pricing & Stock Bar */}
                      <div className="bg-[#111625] rounded-2xl p-3 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Retail MRP</span>
                          <span className="text-base font-black text-white">₹{activeRetail}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-purple-400 font-bold uppercase block">B2B Wholesale</span>
                          <span className="text-base font-black text-purple-300">₹{activeB2b}</span>
                        </div>

                        <div className="text-right pl-3 border-l border-slate-800">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Customer Status</span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded-md inline-block ${
                            activeStock <= 0
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : isLowStock 
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {activeStock <= 0
                              ? 'Not Available'
                              : isLowStock
                              ? 'Only few available'
                              : 'Available'}
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold block mt-0.5">
                            (Admin stock: {activeStock})
                          </span>
                        </div>
                      </div>

                      {/* Mock Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                          disabled
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          type="button"
                          className="w-full bg-[#111625] border border-purple-500/30 text-purple-300 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                          disabled
                        >
                          <span>B2B Wholesale</span>
                        </button>
                      </div>

                    </div>
                  )
                })()}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ============ STANDALONE PRODUCT QUICK PREVIEW DRAWER (FOR LIST) ========= */}
      {/* ========================================================================= */}
      {selectedPreviewProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-end p-0 sm:p-4 overflow-y-auto">
          <div className="bg-[#111625] h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl w-full sm:max-w-md p-6 shadow-2xl flex flex-col gap-5 animate-slide-left border border-slate-800 overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">Product Preview</h3>
              </div>
              <button
                onClick={() => setSelectedPreviewProduct(null)}
                className="w-8 h-8 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-slate-400 hover:text-white font-bold flex items-center justify-center border border-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            {(() => {
              const prod = selectedPreviewProduct
              const singleVar = prod.variants?.find((v: any) => v.packagingType === 'SINGLE') || {}
              const boxVar = prod.variants?.find((v: any) => v.packagingType === 'BOX') || {}
              const cartonVar = prod.variants?.find((v: any) => v.packagingType === 'CARTON') || {}
              
              let activeVar = singleVar
              if (previewVariantType === 'BOX') activeVar = boxVar
              if (previewVariantType === 'CARTON') activeVar = cartonVar

              const gallery = prod.galleryImages && Array.isArray(prod.galleryImages) && prod.galleryImages.length > 0
                ? prod.galleryImages
                : [prod.imageUrl || '/images/products/mccain-smiles.jpg']

              return (
                <div className="flex flex-col gap-4">
                  {/* Image Showcase */}
                  <div className="w-full aspect-square bg-[#0B0F19] rounded-2xl p-4 flex items-center justify-center border border-slate-800 relative">
                    <img
                      src={prod.imageUrl || gallery[0]}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain drop-shadow-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/mccain-smiles.jpg'
                      }}
                    />
                    <span className="absolute top-3 left-3 text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      {prod.category?.name || 'McCain'}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="font-black text-lg text-white">{prod.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{prod.description}</p>
                  </div>

                  {/* Packaging Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 bg-[#0B0F19] p-1 rounded-2xl border border-slate-800">
                    <button
                      onClick={() => setPreviewVariantType('SINGLE')}
                      className={`py-2 text-[10px] font-bold rounded-xl transition-all ${
                        previewVariantType === 'SINGLE' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                      }`}
                    >
                      Single ({singleVar.unitsInPack > 1 ? `${singleVar.unitsInPack} pcs` : `${singleVar.weightGrams || 400}g`})
                    </button>
                    <button
                      onClick={() => setPreviewVariantType('BOX')}
                      className={`py-2 text-[10px] font-bold rounded-xl transition-all ${
                        previewVariantType === 'BOX' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                      }`}
                    >
                      Box ({boxVar.unitsInPack || 10}u)
                    </button>
                    <button
                      onClick={() => setPreviewVariantType('CARTON')}
                      className={`py-2 text-[10px] font-bold rounded-xl transition-all ${
                        previewVariantType === 'CARTON' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                      }`}
                    >
                      Carton ({cartonVar.unitsInPack || 50}u)
                    </button>
                  </div>

                  {/* Pricing and Stock Card */}
                  <div className="bg-[#0B0F19] p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Retail MRP</span>
                        <span className="text-lg font-black text-white">₹{activeVar.retailPrice || 0}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-purple-400 font-bold uppercase block">B2B Wholesale</span>
                        <span className="text-lg font-black text-purple-300">₹{activeVar.b2bPrice || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Boxes className="w-3.5 h-3.5 text-amber-400" /> Customer Status:
                      </span>
                      <div className="text-right">
                        <span className={`font-black px-2.5 py-0.5 rounded-md inline-block ${
                          (activeVar.stockCount ?? 100) <= 0
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : (activeVar.stockCount ?? 100) <= (activeVar.reorderLevel ?? 10)
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {(activeVar.stockCount ?? 100) <= 0
                            ? 'Not Available'
                            : (activeVar.stockCount ?? 100) <= (activeVar.reorderLevel ?? 10)
                            ? 'Only few available'
                            : 'Available'}
                        </span>
                        <span className="text-[9px] text-slate-500 block font-semibold mt-0.5">
                          Admin Warehouse: {activeVar.stockCount ?? 100} units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Edit Button */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        const p = selectedPreviewProduct
                        setSelectedPreviewProduct(null)
                        openEditModal(p)
                      }}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs py-3 rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit This Product</span>
                    </button>
                    <button
                      onClick={() => setSelectedPreviewProduct(null)}
                      className="px-4 bg-[#0B0F19] hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-2xl border border-slate-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )
            })()}

          </div>
        </div>
      )}

    </div>
  )
}
