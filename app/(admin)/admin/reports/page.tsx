'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, Calendar, DollarSign, Package, ShoppingBag, 
  ArrowUpRight, Download, Filter, CheckCircle2, AlertCircle, 
  CreditCard, Truck, RefreshCw, BarChart2, PieChart
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function AdminReportsPage() {
  const { showToast } = useToast()
  const [range, setRange] = useState<'today' | '7days' | '30days' | 'year' | 'all'>('30days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Fetch report data
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-reports', range, startDate, endDate],
    queryFn: async () => {
      let url = `/api/admin/reports?range=${range}`
      if (startDate && endDate) {
        url = `/api/admin/reports?startDate=${startDate}&endDate=${endDate}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load analytics data')
      return res.json()
    }
  })

  const summary = data?.summary || {
    totalOrders: 0,
    totalRevenue: 0,
    b2bRevenue: 0,
    retailRevenue: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    activeOrders: 0,
    averageOrderValue: 0
  }

  const topProducts = data?.topProducts || []
  const dailyTrends = data?.dailyTrends || []
  const paymentMethods = data?.paymentMethodCounts || {}
  const statusCounts = data?.statusCounts || {}

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!dailyTrends.length && !topProducts.length) {
      return showToast('No report data available to export', 'error')
    }

    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'ANMOL ENTERPRISES - BUSINESS & SALES REPORT\n'
    csvContent += `Generated On: ${new Date().toLocaleString()}\n`
    csvContent += `Filter Range: ${range.toUpperCase()}\n\n`

    csvContent += 'FINANCIAL KPI SUMMARY\n'
    csvContent += `Total Revenue,Rs. ${summary.totalRevenue}\n`
    csvContent += `B2B Wholesale Revenue,Rs. ${summary.b2bRevenue}\n`
    csvContent += `Retail Revenue,Rs. ${summary.retailRevenue}\n`
    csvContent += `Total Orders,${summary.totalOrders}\n`
    csvContent += `Delivered Orders,${summary.deliveredCount}\n`
    csvContent += `Cancelled Orders,${summary.cancelledCount}\n`
    csvContent += `Average Order Value,Rs. ${summary.averageOrderValue}\n\n`

    csvContent += 'TOP SELLING PRODUCTS\n'
    csvContent += 'Rank,Product Name,Units Sold,Revenue Generated (INR)\n'
    topProducts.forEach((p: any, idx: number) => {
      csvContent += `${idx + 1},"${p.name.replace(/"/g, '""')}",${p.quantity},${p.revenue}\n`
    })

    csvContent += '\nDAILY SALES TIMELINE\n'
    csvContent += 'Date,Order Count,Daily Revenue (INR)\n'
    dailyTrends.forEach((d: any) => {
      csvContent += `${d.date},${d.orders},${d.revenue}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Anmol_Enterprises_Report_${range}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Report downloaded as CSV successfully!', 'success')
  }

  // Max revenue for bar scaling
  const maxDailyRevenue = Math.max(...dailyTrends.map((d: any) => d.revenue), 1)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#111625] p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Reports & Financial Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time revenue metrics, product sales velocity, and delivery fulfillment insights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-3 bg-[#0B0F19] hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-[#111625] p-4 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Quick Range Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'year', label: 'This Year' },
            { id: 'all', label: 'All Time' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setRange(item.id as any)
                setStartDate('')
                setEndDate('')
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                range === item.id && !startDate
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-[#0B0F19] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <span className="text-slate-500 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold">Calculating business analytics...</p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Revenue */}
            <div className="bg-[#111625] p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Gross Revenue
                </span>
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  ₹{summary.totalRevenue.toLocaleString('en-IN')}
                </span>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-[10px]">
                  <span className="text-purple-300 font-bold">
                    B2B: ₹{summary.b2bRevenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">
                    Retail: ₹{summary.retailRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-[#111625] p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Order Volume
                </span>
                <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {summary.totalOrders}
                </span>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-[10px]">
                  <span className="text-emerald-400 font-bold">
                    {summary.deliveredCount} Delivered
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-bold">
                    {summary.activeOrders} Active
                  </span>
                </div>
              </div>
            </div>

            {/* Average Order Value (AOV) */}
            <div className="bg-[#111625] p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Avg. Order Value (AOV)
                </span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  ₹{summary.averageOrderValue.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                  Average spend per customer order
                </p>
              </div>
            </div>

            {/* Fulfillment Rate */}
            <div className="bg-[#111625] p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Fulfillment Success
                </span>
                <div className="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-purple-300">
                  {summary.totalOrders > 0
                    ? Math.round((summary.deliveredCount / summary.totalOrders) * 100)
                    : 100}%
                </span>
                <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                  {summary.cancelledCount} orders cancelled
                </p>
              </div>
            </div>

          </div>

          {/* Daily Sales Chart */}
          <div className="bg-[#111625] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  Daily Revenue & Order Velocity
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                {dailyTrends.length} active sales days recorded
              </span>
            </div>

            {dailyTrends.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">No transactions recorded in this date range.</p>
            ) : (
              <div className="flex items-end gap-2 h-48 pt-6 pb-2 overflow-x-auto">
                {dailyTrends.map((day: any) => {
                  const heightPercent = Math.max(Math.round((day.revenue / maxDailyRevenue) * 100), 8)
                  return (
                    <div
                      key={day.date}
                      className="flex-1 min-w-[36px] flex flex-col items-center gap-2 h-full justify-end group"
                    >
                      <div className="relative w-full flex items-end justify-center">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-10 bg-slate-900 border border-slate-700 text-white text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                          ₹{day.revenue.toLocaleString('en-IN')} ({day.orders} orders)
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg group-hover:from-amber-400 group-hover:to-amber-300 transition-all shadow-xs"
                        />
                      </div>

                      {/* Date Label */}
                      <span className="text-[8px] text-slate-500 font-bold truncate max-w-full">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 2-Column Section: Top Products & Payment Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Top 10 McCain Products (7 cols) */}
            <div className="lg:col-span-7 bg-[#111625] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">
                    Top Selling Products
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  Ranked by Revenue
                </span>
              </div>

              {topProducts.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No product sales in this period.</p>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {topProducts.map((prod: any, idx: number) => {
                    const revPercent = summary.totalRevenue > 0 
                      ? Math.round((prod.revenue / summary.totalRevenue) * 100)
                      : 0

                    return (
                      <div key={prod.name} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            idx === 0 
                              ? 'bg-amber-500 text-slate-950' 
                              : idx === 1 
                                ? 'bg-slate-300 text-slate-950' 
                                : idx === 2 
                                  ? 'bg-amber-700 text-white' 
                                  : 'bg-[#0B0F19] text-slate-400 border border-slate-800'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="font-black text-xs text-white line-clamp-1">{prod.name}</h4>
                            <span className="text-[10px] text-slate-400">{prod.quantity} units sold</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-xs text-white block">
                            ₹{prod.revenue.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-amber-400/80 font-bold">
                            {revPercent}% of sales
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Payment & Status Breakdown (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Payment Methods Card */}
              <div className="bg-[#111625] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">
                    Payment Method Share
                  </h3>
                </div>

                <div className="space-y-3">
                  {Object.entries(paymentMethods).map(([method, data]: [string, any]) => {
                    const percent = summary.totalRevenue > 0 
                      ? Math.round((data.total / summary.totalRevenue) * 100) 
                      : 0

                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-300">{method.replace(/_/g, ' ')}</span>
                          <span className="text-white">₹{data.total.toLocaleString('en-IN')} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-[#0B0F19] h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            style={{ width: `${percent}%` }}
                            className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Order Status Breakdown Card */}
              <div className="bg-[#111625] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <PieChart className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">
                    Order Status Breakdown
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="bg-[#0B0F19] p-3 rounded-2xl border border-slate-800">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                        {status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-base font-black text-white mt-0.5 block">
                        {count as number}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  )
}
