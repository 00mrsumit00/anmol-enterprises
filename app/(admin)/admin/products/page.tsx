'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Package, Plus, Search, Filter, Edit3, Trash2, Eye, EyeOff, 
  Sparkles, CheckCircle2, AlertCircle, LayoutGrid, List, Tag, Image as ImageIcon,
  DollarSign, ShieldCheck, Flame, ChevronRight, UploadCloud, Star, ArrowLeft, ArrowRight,
  Upload, X
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

  // Form Fields State
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
    singleWeight: 400,
    singlePrice: 199,
    singleB2bPrice: 169,
    boxPrice: 1790,
    boxB2bPrice: 1520,
    cartonPrice: 8450,
    cartonB2bPrice: 7150,
  })

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
      try { data = JSON.parse(text) } catch { data = { error: text || 'Server response error' } }
      if (!res.ok) throw new Error(data.error || 'Failed to create product')
      return data
    },
    onSuccess: () => {
      showToast('New McCain product added successfully!', 'success')
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
      try { data = JSON.parse(text) } catch { data = { error: text || 'Server response error' } }
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
      singleWeight: 400,
      singlePrice: 199,
      singleB2bPrice: 169,
      boxPrice: 1790,
      boxB2bPrice: 1520,
      cartonPrice: 8450,
      cartonB2bPrice: 7150,
    })
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

    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      description: product.description,
      brand: product.brand || 'McCain',
      isVeg: product.isVeg,
      imageUrl: product.imageUrl || gallery[0],
      galleryImages: gallery,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      singleWeight: singleVar.weightGrams || 400,
      singlePrice: singleVar.retailPrice || 199,
      singleB2bPrice: singleVar.b2bPrice || 169,
      boxPrice: boxVar.retailPrice || 1790,
      boxB2bPrice: boxVar.b2bPrice || 1520,
      cartonPrice: cartonVar.retailPrice || 8450,
      cartonB2bPrice: cartonVar.b2bPrice || 7150,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setCustomImageUrlInput('')
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

    const payload = {
      ...formData,
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
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6 font-sans">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0c831f] text-white rounded-xl shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Product & Image Catalog Manager
            </h1>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Manage McCain official product packets, multi-image galleries, and wholesale pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/bulk-import"
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all"
          >
            <UploadCloud className="w-4 h-4 text-purple-700" />
            <span>Bulk JSON Sync</span>
          </Link>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-[#0c831f] hover:bg-[#0a6d19] text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-[#0c831f]/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name, slug or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8f9fa] border border-gray-200/80 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#f8f9fa] border border-gray-200/80 text-xs rounded-xl px-3 py-2.5 font-bold text-gray-700 cursor-pointer focus:outline-none focus:border-[#0c831f]"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-[#0c831f] shadow-xs' : 'text-gray-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white text-[#0c831f] shadow-xs' : 'text-gray-500'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Loading state */}
      {isProductsLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="w-10 h-10 border-4 border-[#0c831f] border-t-transparent rounded-full animate-spin" />
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
                className={`bg-white border rounded-3xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all ${
                  product.isActive ? 'border-gray-200/90' : 'border-rose-200 bg-rose-50/20 opacity-75'
                }`}
              >
                {/* Top Row: Status & Actions */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                    product.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>

                  <span className="text-[10px] font-bold text-gray-400">
                    🖼️ {galleryCount} {galleryCount === 1 ? 'image' : 'images'}
                  </span>
                </div>

                {/* Packet Image */}
                <div className="w-full aspect-square bg-[#fbfbfb] rounded-2xl p-2 flex items-center justify-center mb-3 border border-gray-100">
                  <img
                    src={product.imageUrl || '/images/products/mccain-smiles.jpg'}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                  />
                </div>

                {/* Meta */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {product.category?.name || 'McCain Foods'}
                  </span>
                  <h3 className="font-black text-sm text-gray-900 line-clamp-1 leading-snug">
                    {product.name}
                  </h3>
                  
                  {/* Prices */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold block">Retail (MRP)</span>
                      <span className="font-black text-gray-900">₹{singleVar.retailPrice || 0}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-purple-700 font-bold block">B2B Wholesale</span>
                      <span className="font-black text-purple-900">₹{singleVar.b2bPrice || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2 rounded-xl transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleToggleActive(product)}
                    className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl transition-all"
                    title="Toggle Active Status"
                  >
                    {product.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleDelete(product)}
                    className="flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold py-2 rounded-xl transition-all"
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
        <div className="bg-white rounded-3xl border border-gray-200/90 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Packet Image</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Gallery</th>
                <th className="p-4">Retail Price</th>
                <th className="p-4">B2B Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product: any) => {
                const singleVar = product.variants?.find((v: any) => v.packagingType === 'SINGLE') || {}
                return (
                  <tr key={product.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 p-1 flex items-center justify-center">
                        <img
                          src={product.imageUrl || '/images/products/mccain-smiles.jpg'}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </td>
                    <td className="p-4 font-black text-gray-900">{product.name}</td>
                    <td className="p-4 text-gray-500">{product.category?.name}</td>
                    <td className="p-4 text-gray-600 font-bold">{product.galleryImages?.length || 1} images</td>
                    <td className="p-4 font-black text-gray-900">₹{singleVar.retailPrice || 0}</td>
                    <td className="p-4 font-black text-purple-900">₹{singleVar.b2bPrice || 0}</td>
                    <td className="p-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        product.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl"
                          title="Toggle Status"
                        >
                          {product.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-6 animate-scale-up my-auto max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-black text-lg text-gray-900">
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New McCain Product'}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Upload multiple product gallery images, set the primary packet photo, and configure pricing.
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="w-9 h-9 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* 1. PRODUCT DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Product Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. McCain Smiles"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-xs sm:text-sm rounded-2xl px-4 py-3 font-semibold focus:outline-none focus:border-[#0c831f] focus:bg-white"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showAddCategoryInline ? '✕ Use Existing' : '+ Add New Category'}
                    </button>
                  </div>

                  {showAddCategoryInline ? (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col gap-2.5 my-0.5">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-[11px] font-bold text-amber-900">New Category Details</span>
                        <div className="flex gap-1 flex-wrap">
                          {['🍟', '🧀', '🌯', '🌽', '✨', '🍕', '🍔', '🥟', '🥤', '📦'].map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setNewCategoryEmoji(em)}
                              className={`w-6 h-6 text-xs rounded-md flex items-center justify-center transition-all ${
                                newCategoryEmoji === em ? 'bg-amber-500 text-white scale-110 shadow-xs' : 'bg-white hover:bg-amber-100 border border-amber-200'
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
                          placeholder="e.g. Party Platters or Kids Special"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1 bg-white border border-amber-300 text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategoryInline}
                          disabled={isCreatingCategory}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                        >
                          {isCreatingCategory ? 'Adding...' : 'Save & Select'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 text-xs sm:text-sm rounded-2xl px-4 py-3 font-semibold text-gray-900 cursor-pointer focus:outline-none focus:border-[#0c831f]"
                      required
                    >
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Summary Description *</label>
                <textarea
                  rows={2}
                  placeholder="Crispy on the outside, mashed potato happiness inside. A classic teatime and party snack."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-2xl p-3 font-semibold focus:outline-none focus:border-[#0c831f] focus:bg-white"
                  required
                />
              </div>

              {/* 2. MULTI-IMAGE GALLERY MANAGER (Auto-Scroll Carousel Builder) */}
              <div className="p-4 bg-[#f8f9fa] rounded-3xl border border-gray-200/90 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#0c831f]" />
                    <h4 className="font-black text-sm text-gray-900">
                      Product Gallery & Auto-Scroll Carousel ({formData.galleryImages.length} images)
                    </h4>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold">
                    ⭐ First image is the Primary Packet Image shown on cards
                  </span>
                </div>

                {/* Upload Buttons & URL Input */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  
                  {/* File Upload Button */}
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all ${
                    isUploading ? 'bg-gray-200 text-gray-500' : 'bg-[#0c831f] hover:bg-[#0a6d19] text-white shadow-xs'
                  }`}>
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Uploading...' : 'Upload Images from Device'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  {/* URL Input */}
                  <div className="flex-1 flex items-center gap-2 w-full">
                    <input
                      type="text"
                      placeholder="Or paste image URL (e.g. /images/products/mccain-smiles.jpg)"
                      value={customImageUrlInput}
                      onChange={(e) => setCustomImageUrlInput(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 text-xs rounded-2xl px-3 py-2.5 font-medium focus:outline-none focus:border-[#0c831f]"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="bg-gray-900 hover:bg-black text-white text-xs font-black px-3.5 py-2.5 rounded-2xl transition-all"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Quick Presets Strip */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-gray-400 font-bold">Quick Presets:</span>
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
                      className="text-[9px] bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0c831f] font-bold px-2.5 py-1 rounded-xl border border-gray-200/80 transition-all"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>

                {/* Gallery Thumbnail Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                  {formData.galleryImages.map((url, idx) => {
                    const isPrimary = idx === 0
                    return (
                      <div
                        key={idx}
                        className={`relative bg-white rounded-2xl p-2 border-2 flex flex-col items-center gap-1 shadow-2xs group ${
                          isPrimary ? 'border-[#0c831f] bg-emerald-50/20 ring-2 ring-[#0c831f]/20' : 'border-gray-200'
                        }`}
                      >
                        {/* Primary Badge */}
                        {isPrimary && (
                          <span className="absolute -top-2 left-2 bg-[#0c831f] text-white text-[8px] font-black px-1.5 py-0.2 rounded-md shadow-2xs flex items-center gap-0.5 z-10">
                            <Star className="w-2.5 h-2.5 fill-white" /> PACKET
                          </span>
                        )}

                        {/* Image Preview */}
                        <div className="w-full aspect-square flex items-center justify-center p-1.5 rounded-xl overflow-hidden bg-[#fbfbfb] border border-gray-100">
                          <img src={normalizeImageUrl(url)} alt={`Slide ${idx + 1}`} className="w-full h-full object-contain drop-shadow-2xs" />
                        </div>

                        <span className="text-[9px] font-bold text-gray-500">Slide {idx + 1}</span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 w-full justify-between pt-1 border-t border-gray-100">
                          {!isPrimary ? (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(url)}
                              className="text-[8px] bg-emerald-50 hover:bg-emerald-100 text-[#0c831f] font-black px-1.5 py-0.5 rounded"
                              title="Make Primary Packet Image"
                            >
                              ⭐ Set
                            </button>
                          ) : (
                            <span className="text-[8px] text-[#0c831f] font-bold">Primary</span>
                          )}

                          <div className="flex items-center gap-0.5">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, idx - 1)}
                                className="p-0.5 text-gray-400 hover:text-black text-[10px]"
                                title="Move Left"
                              >
                                ◀
                              </button>
                            )}
                            {idx < formData.galleryImages.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, idx + 1)}
                                className="p-0.5 text-gray-400 hover:text-black text-[10px]"
                                title="Move Right"
                              >
                                ▶
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(url)}
                              className="p-0.5 text-rose-500 hover:text-rose-700 text-xs font-bold"
                              title="Delete Image"
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

              {/* 3. PACKAGING VARIANTS & PRICING */}
              <div className="p-4 bg-gray-50 rounded-3xl border border-gray-200/80 flex flex-col gap-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  Pricing & Packaging Variants (₹)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-2xl border border-gray-200">
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Single Retail Pack (400g)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500">Retail MRP</label>
                        <input
                          type="number"
                          value={formData.singlePrice}
                          onChange={(e) => setFormData({ ...formData, singlePrice: parseFloat(e.target.value) || 0 })}
                          className="w-full border rounded-xl p-2 text-xs font-black"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-purple-700">B2B Wholesale</label>
                        <input
                          type="number"
                          value={formData.singleB2bPrice}
                          onChange={(e) => setFormData({ ...formData, singleB2bPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full border rounded-xl p-2 text-xs font-black text-purple-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-gray-200">
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Box Pack (10 Units)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500">Retail Box</label>
                        <input
                          type="number"
                          value={formData.boxPrice}
                          onChange={(e) => setFormData({ ...formData, boxPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full border rounded-xl p-2 text-xs font-black"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-purple-700">B2B Box</label>
                        <input
                          type="number"
                          value={formData.boxB2bPrice}
                          onChange={(e) => setFormData({ ...formData, boxB2bPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full border rounded-xl p-2 text-xs font-black text-purple-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-gray-200">
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Bulk Carton (50 Units)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500">Retail Carton</label>
                        <input
                          type="number"
                          value={formData.cartonPrice}
                          onChange={(e) => setFormData({ ...formData, cartonPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full border rounded-xl p-2 text-xs font-black"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-purple-700">B2B Carton</label>
                        <input
                          type="number"
                          value={formData.cartonB2bPrice}
                          onChange={(e) => setFormData({ ...formData, cartonB2bPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full border rounded-xl p-2 text-xs font-black text-purple-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#0c831f] hover:bg-[#0a6d19] text-white font-black text-xs px-7 py-3.5 rounded-2xl shadow-md shadow-[#0c831f]/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}
