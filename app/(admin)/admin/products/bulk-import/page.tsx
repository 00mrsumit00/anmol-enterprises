'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  UploadCloud, FileJson, Download, CheckCircle2, AlertCircle, 
  ArrowLeft, RefreshCw, Layers, Sparkles, Info, FileSpreadsheet
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

// Pre-loaded Official McCain India Catalog Preset
const MCCAIN_OFFICIAL_CATALOG_PRESET = [
  {
    name: 'McCain French Fries',
    slug: 'mccain-french-fries',
    brand: 'McCain',
    description: 'Golden, crispy McCain French Fries. Classic straight-cut fries seasoned to perfection. Ready in 10 minutes from frozen.',
    categorySlug: 'frozen-potato-snacks',
    imageUrl: 'https://res.cloudinary.com/anmol-enterprises/image/upload/products/mccain-french-fries.webp',
    isVeg: true,
    isFeatured: true,
    isActive: true,
    sortOrder: 1,
    variants: [
      { packagingType: 'SINGLE', skuCode: 'MCN-FF-420', unitsInPack: 1, weightGrams: 420, retailPrice: 199, b2bPrice: 169, stockCount: 80, minOrderQty: 1 },
      { packagingType: 'BOX', skuCode: 'MCN-FF-BOX', unitsInPack: 10, weightGrams: 4200, retailPrice: 1790, b2bPrice: 1499, stockCount: 20, minOrderQty: 1 },
      { packagingType: 'CARTON', skuCode: 'MCN-FF-CRT', unitsInPack: 50, weightGrams: 21000, retailPrice: 8500, b2bPrice: 6999, stockCount: 8, minOrderQty: 1 }
    ]
  },
  {
    name: 'McCain Potato Cheese Shotz',
    slug: 'mccain-potato-cheese-shotz',
    brand: 'McCain',
    description: 'Small round shots filled with molten cheese and potato filling. Bestseller for cafes and parties.',
    categorySlug: 'cheese-veggie-bites',
    imageUrl: 'https://res.cloudinary.com/anmol-enterprises/image/upload/products/mccain-potato-cheese-shotz.webp',
    isVeg: true,
    isFeatured: true,
    isActive: true,
    sortOrder: 2,
    variants: [
      { packagingType: 'SINGLE', skuCode: 'MCN-PCS-400', unitsInPack: 1, weightGrams: 400, retailPrice: 269, b2bPrice: 229, stockCount: 75, minOrderQty: 1 },
      { packagingType: 'BOX', skuCode: 'MCN-PCS-BOX', unitsInPack: 10, weightGrams: 4000, retailPrice: 2590, b2bPrice: 2049, stockCount: 18, minOrderQty: 1 },
      { packagingType: 'CARTON', skuCode: 'MCN-PCS-CRT', unitsInPack: 50, weightGrams: 20000, retailPrice: 12499, b2bPrice: 9799, stockCount: 4, minOrderQty: 1 }
    ]
  },
  {
    name: 'McCain Aloo Tikki',
    slug: 'mccain-aloo-tikki',
    brand: 'McCain',
    description: 'Crispy on the outside, soft inside. Classic spiced potato patties perfect for chaat and burgers.',
    categorySlug: 'frozen-potato-snacks',
    imageUrl: 'https://res.cloudinary.com/anmol-enterprises/image/upload/products/mccain-aloo-tikki.webp',
    isVeg: true,
    isFeatured: true,
    isActive: true,
    sortOrder: 3,
    variants: [
      { packagingType: 'SINGLE', skuCode: 'MCN-AT-400', unitsInPack: 1, weightGrams: 400, retailPrice: 179, b2bPrice: 149, stockCount: 120, minOrderQty: 1 },
      { packagingType: 'BOX', skuCode: 'MCN-AT-BOX', unitsInPack: 10, weightGrams: 4000, retailPrice: 1690, b2bPrice: 1349, stockCount: 30, minOrderQty: 1 },
      { packagingType: 'CARTON', skuCode: 'MCN-AT-CRT', unitsInPack: 50, weightGrams: 20000, retailPrice: 8000, b2bPrice: 6299, stockCount: 10, minOrderQty: 1 }
    ]
  },
  {
    name: 'McCain Smiles',
    slug: 'mccain-smiles',
    brand: 'McCain',
    description: 'Smiley face shaped potato snacks that kids love. Fun to eat, crispy and delicious.',
    categorySlug: 'frozen-potato-snacks',
    imageUrl: 'https://res.cloudinary.com/anmol-enterprises/image/upload/products/mccain-smiles.webp',
    isVeg: true,
    isFeatured: false,
    isActive: true,
    sortOrder: 4,
    variants: [
      { packagingType: 'SINGLE', skuCode: 'MCN-SM-415', unitsInPack: 1, weightGrams: 415, retailPrice: 189, b2bPrice: 159, stockCount: 90, minOrderQty: 1 },
      { packagingType: 'BOX', skuCode: 'MCN-SM-BOX', unitsInPack: 10, weightGrams: 4150, retailPrice: 1790, b2bPrice: 1449, stockCount: 25, minOrderQty: 1 },
      { packagingType: 'CARTON', skuCode: 'MCN-SM-CRT', unitsInPack: 50, weightGrams: 20750, retailPrice: 8500, b2bPrice: 6799, stockCount: 6, minOrderQty: 1 }
    ]
  },
  {
    name: 'McCain Chilli Cheesy Nuggets',
    slug: 'mccain-chilli-cheesy-nuggets',
    brand: 'McCain',
    description: 'Golden nuggets with spicy melted cheese filling. The heat of chilli meets rich cheese.',
    categorySlug: 'cheese-veggie-bites',
    imageUrl: 'https://res.cloudinary.com/anmol-enterprises/image/upload/products/mccain-chilli-cheesy-nuggets.webp',
    isVeg: true,
    isFeatured: true,
    isActive: true,
    sortOrder: 5,
    variants: [
      { packagingType: 'SINGLE', skuCode: 'MCN-CCN-420', unitsInPack: 1, weightGrams: 420, retailPrice: 249, b2bPrice: 211, stockCount: 85, minOrderQty: 1 },
      { packagingType: 'BOX', skuCode: 'MCN-CCN-BOX', unitsInPack: 10, weightGrams: 4200, retailPrice: 2390, b2bPrice: 1899, stockCount: 20, minOrderQty: 1 },
      { packagingType: 'CARTON', skuCode: 'MCN-CCN-CRT', unitsInPack: 50, weightGrams: 21000, retailPrice: 11499, b2bPrice: 8999, stockCount: 5, minOrderQty: 1 }
    ]
  },
  {
    name: 'McCain Crinkle Cut Fries',
    slug: 'mccain-crinkle-cut-fries',
    brand: 'McCain',
    description: 'Wavy ridged crinkle-cut fries with extra surface area for maximum crispiness.',
    categorySlug: 'premium-fries-cuts',
    imageUrl: 'https://res.cloudinary.com/anmol-enterprises/image/upload/products/mccain-crinkle-cut-fries.webp',
    isVeg: true,
    isFeatured: true,
    isActive: true,
    sortOrder: 6,
    variants: [
      { packagingType: 'SINGLE', skuCode: 'MCN-CCF-420', unitsInPack: 1, weightGrams: 420, retailPrice: 219, b2bPrice: 185, stockCount: 90, minOrderQty: 1 },
      { packagingType: 'BOX', skuCode: 'MCN-CCF-BOX', unitsInPack: 10, weightGrams: 4200, retailPrice: 2090, b2bPrice: 1659, stockCount: 22, minOrderQty: 1 },
      { packagingType: 'CARTON', skuCode: 'MCN-CCF-CRT', unitsInPack: 50, weightGrams: 21000, retailPrice: 9999, b2bPrice: 7799, stockCount: 6, minOrderQty: 1 }
    ]
  },
  {
    name: 'McCain Veg Seekh Kebab',
    slug: 'mccain-veg-seekh-kebab',
    brand: 'McCain',
    description: 'Tender, smoky seekh kebabs made from a blend of vegetables and spices. Pack of 8 pieces.',
    categorySlug: 'wraps-and-rolls',
    imageUrl: 'https://res.cloudinary.com/anmol-enterprises/image/upload/products/mccain-veg-seekh-kebab.webp',
    isVeg: true,
    isFeatured: true,
    isActive: true,
    sortOrder: 7,
    variants: [
      { packagingType: 'SINGLE', skuCode: 'MCN-VSK-280', unitsInPack: 1, weightGrams: 280, retailPrice: 229, b2bPrice: 195, stockCount: 60, minOrderQty: 1 },
      { packagingType: 'BOX', skuCode: 'MCN-VSK-BOX', unitsInPack: 10, weightGrams: 2800, retailPrice: 2190, b2bPrice: 1749, stockCount: 15, minOrderQty: 1 },
      { packagingType: 'CARTON', skuCode: 'MCN-VSK-CRT', unitsInPack: 50, weightGrams: 14000, retailPrice: 10499, b2bPrice: 8199, stockCount: 4, minOrderQty: 1 }
    ]
  },
  {
    name: 'McCain Crispy Onion Rings',
    slug: 'mccain-crispy-onion-rings',
    brand: 'McCain',
    description: 'Thick-cut onion rings coated in a light, crispy golden batter. Great for dipping.',
    categorySlug: 'onion-corn-specialties',
    imageUrl: 'https://res.cloudinary.com/anmol-enterprises/image/upload/products/mccain-crispy-onion-rings.webp',
    isVeg: true,
    isFeatured: true,
    isActive: true,
    sortOrder: 8,
    variants: [
      { packagingType: 'SINGLE', skuCode: 'MCN-COR-250', unitsInPack: 1, weightGrams: 250, retailPrice: 199, b2bPrice: 169, stockCount: 70, minOrderQty: 1 },
      { packagingType: 'BOX', skuCode: 'MCN-COR-BOX', unitsInPack: 10, weightGrams: 2500, retailPrice: 1890, b2bPrice: 1499, stockCount: 18, minOrderQty: 1 },
      { packagingType: 'CARTON', skuCode: 'MCN-COR-CRT', unitsInPack: 50, weightGrams: 12500, retailPrice: 8999, b2bPrice: 7099, stockCount: 5, minOrderQty: 1 }
    ]
  }
]

export default function BulkImportPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [jsonInput, setJsonInput] = useState('')
  const [parsedProducts, setParsedProducts] = useState<any[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [importResult, setImportResult] = useState<any | null>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCategories(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!jsonInput.trim()) {
      setParsedProducts([])
      setParseError(null)
      return
    }
    try {
      const parsed = JSON.parse(jsonInput)
      const list = Array.isArray(parsed) ? parsed : (parsed.products || [])
      if (!Array.isArray(list) || list.length === 0) {
        setParseError('JSON must be an array of products or an object with a "products" array.')
        setParsedProducts([])
      } else {
        setParseError(null)
        setParsedProducts(list)
      }
    } catch (e: any) {
      setParseError('JSON Syntax Error: ' + e.message)
      setParsedProducts([])
    }
  }, [jsonInput])

  const handleLoadPreset = () => {
    const formatted = JSON.stringify(MCCAIN_OFFICIAL_CATALOG_PRESET, null, 2)
    setJsonInput(formatted)
    showToast('Loaded official McCain India catalog sample', 'info')
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/admin/products/bulk-template')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'anmol_products_bulk_template.json'
      a.click()
      URL.revokeObjectURL(url)
      showToast('Template downloaded', 'success')
    } catch {
      showToast('Failed to fetch template', 'error')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setJsonInput(text)
      showToast('Loaded ' + file.name, 'info')
    }
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    if (parsedProducts.length === 0) {
      return showToast('No valid products to import', 'error')
    }
    setIsSubmitting(true)
    setImportResult(null)

    try {
      const res = await fetch('/api/admin/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedProducts }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Bulk import failed')
      }

      setImportResult(data)
      showToast(data.message || 'Bulk import complete!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Import failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categorySlugsSet = new Set(categories.map(c => c.slug))

  return (
    <div className="flex flex-col gap-6 font-body max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all tap-scale shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg sm:text-xl font-black text-brand-charcoal">
                Bulk Product Import & Catalog Sync
              </h1>
              <span className="bg-brand-orange/10 text-brand-orange text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Admin Tools
              </span>
            </div>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Import dozens of McCain frozen food products and SKUs at once via JSON or official presets.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleLoadPreset}
            type="button"
            className="bg-brand-yellow/20 hover:bg-brand-yellow/30 text-amber-900 border border-brand-yellow/40 text-xs font-bold px-3.5 py-2.5 rounded-2xl flex items-center gap-2 transition-all tap-scale"
          >
            <Sparkles className="w-4 h-4 text-brand-orange" />
            <span>Load McCain Preset</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3.5 py-2.5 rounded-2xl flex items-center gap-2 transition-all tap-scale"
          >
            <Download className="w-4 h-4" />
            <span>Download Template</span>
          </button>
        </div>
      </div>

      {/* Available Categories Banner */}
      <div className="bg-blue-50/70 rounded-3xl p-4 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-blue-900 font-medium">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Active Categories in DB:</strong> {categories.map(c => c.name + ' (' + c.slug + ')').join(', ') || 'Loading...'}
          </span>
        </div>
        <span className="text-[11px] text-blue-700">
          Every product must have a matching <code>categorySlug</code>
        </span>
      </div>

      {/* Main Grid: JSON Editor + Upload vs Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Input & Upload */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-brand-orange" />
              <h2 className="font-display text-sm font-black text-brand-charcoal uppercase tracking-wider">
                Product JSON Payload
              </h2>
            </div>
            
            {/* File upload input */}
            <label className="cursor-pointer text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
              <UploadCloud className="w-4 h-4" />
              <span>Upload .json File</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON product array here... or click 'Load McCain Preset' above."
              rows={18}
              className={`w-full font-mono text-xs p-4 rounded-2xl border bg-gray-50/70 focus:bg-white focus:outline-none transition-all resize-y ${
                parseError ? 'border-rose-400 focus:border-rose-500' : 'border-gray-200 focus:border-brand-orange'
              }`}
            />
          </div>

          {/* Syntax Status */}
          {parseError ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-rose-700 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          ) : parsedProducts.length > 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Valid JSON: {parsedProducts.length} product(s) detected with variants</span>
              </div>
              <button
                onClick={() => setJsonInput(JSON.stringify(parsedProducts, null, 2))}
                className="text-[11px] text-emerald-900 underline font-bold"
              >
                Beautify
              </button>
            </div>
          ) : null}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || parsedProducts.length === 0 || !!parseError}
            className={`w-full py-3.5 rounded-2xl font-body font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all tap-scale ${
              isSubmitting || parsedProducts.length === 0 || !!parseError
                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                : 'bg-brand-orange hover:bg-brand-orange-dark shadow-brand-orange/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Bulk Upsert...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 stroke-[3]" />
                <span>Import {parsedProducts.length > 0 ? `${parsedProducts.length} Products` : ''} to Neon DB</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Live Table Preview & Results */}
        <div className="flex flex-col gap-6">
          
          {/* Results Summary Box (if import executed) */}
          {importResult && (
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500 shadow-md flex flex-col gap-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-display font-black text-base">Import Succeeded!</h3>
              </div>
              <p className="text-xs text-gray-600 font-semibold">{importResult.message}</p>
              
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-emerald-50 rounded-2xl p-3 text-center border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Created</span>
                  <span className="font-display text-xl font-black text-emerald-900">{importResult.created}</span>
                </div>
                <div className="bg-blue-50 rounded-2xl p-3 text-center border border-blue-200">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Updated</span>
                  <span className="font-display text-xl font-black text-blue-900">{importResult.updated}</span>
                </div>
                <div className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Failed</span>
                  <span className="font-display text-xl font-black text-amber-900">{importResult.failed}</span>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200 text-xs text-rose-700 mt-2">
                  <strong className="block mb-1">Errors encountered:</strong>
                  <ul className="list-disc list-inside space-y-0.5">
                    {importResult.errors.map((e: any, idx: number) => (
                      <li key={idx}><strong>{e.slug}:</strong> {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Link
                  href="/admin/products"
                  className="bg-brand-charcoal text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-charcoal-soft transition-all"
                >
                  View in Product Catalog →
                </Link>
              </div>
            </div>
          )}

          {/* Live Preview List */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-orange" />
                <h2 className="font-display text-sm font-black text-brand-charcoal uppercase tracking-wider">
                  Live Payload Preview ({parsedProducts.length})
                </h2>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Auto-validates category & SKUs
              </span>
            </div>

            {parsedProducts.length === 0 ? (
              <div className="flex-1 min-h-[260px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-gray-400 gap-2">
                <FileSpreadsheet className="w-10 h-10 stroke-1 text-gray-300" />
                <p className="text-xs font-semibold text-gray-500">No products to preview yet</p>
                <p className="text-[11px] text-gray-400 max-w-xs">
                  Click <strong>&quot;Load McCain Preset&quot;</strong> or upload a JSON file to inspect the parsed list.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                {parsedProducts.map((p, index) => {
                  const hasValidCategory = categorySlugsSet.has(p.categorySlug)
                  const variantCount = Array.isArray(p.variants) ? p.variants.length : 0
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border transition-all ${
                        hasValidCategory ? 'bg-gray-50/60 border-gray-200' : 'bg-rose-50/60 border-rose-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-black text-xs text-brand-charcoal">
                              {p.name || 'Unnamed Product'}
                            </span>
                            <span className="font-mono text-[10px] text-gray-400 bg-gray-200/70 px-1.5 py-0.5 rounded">
                              /{p.slug}
                            </span>
                            {p.isFeatured && (
                              <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                FEATURED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                            {p.description}
                          </p>
                        </div>

                        {/* Category Status */}
                        <div className="text-right shrink-0">
                          {hasValidCategory ? (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full inline-block">
                              ✓ {p.categorySlug}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full inline-block">
                              ⚠ Unknown Category: {p.categorySlug}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Variants Row */}
                      <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-600">
                        <span className="font-bold text-gray-700">
                          {variantCount} Variant(s): {p.variants && p.variants.map((v: any) => v.packagingType).join(', ')}
                        </span>
                        <div className="flex items-center gap-3 font-mono text-[10px]">
                          <span>Retail: ₹{p.variants && p.variants[0] ? p.variants[0].retailPrice : 0}</span>
                          <span className="text-purple-700 font-bold">B2B: ₹{p.variants && p.variants[0] ? p.variants[0].b2bPrice : 0}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  )
}
