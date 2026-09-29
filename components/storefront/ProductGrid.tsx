'use client'

import React from 'react'
import ProductCard, { ProductType } from './ProductCard'

interface ProductGridProps {
  products: ProductType[]
  isLoading?: boolean
}

export default function ProductGrid({ products, isLoading = false }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 no-print">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-card border border-gray-100 h-64 animate-pulse p-4 flex flex-col justify-between">
            <div className="bg-gray-100 rounded-card h-32 w-full mb-3" />
            <div className="bg-gray-100 h-4 rounded w-3/4 mb-2" />
            <div className="bg-gray-100 h-3 rounded w-1/2 mb-4" />
            <div className="flex justify-between items-center">
              <div className="bg-gray-100 h-6 rounded w-1/4" />
              <div className="bg-gray-100 h-8 rounded-pill w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-card border border-ice-blue-dk/20 p-8 shadow-sm no-print">
        <span className="text-5xl">❄️</span>
        <h3 className="font-display text-base sm:text-lg font-bold text-brand-charcoal mt-4">
          No Products Found
        </h3>
        <p className="font-body text-xs sm:text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">
          We couldn't find any frozen foods matching your query. Check spelling or choose a different category.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5 no-print">
      {products.map((product) => (
        <div key={product.id} className="h-full">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}
