'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Activity, 
  Calendar, 
  User, 
  ShieldAlert, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react'

interface AuditLog {
  id: string
  adminId: string
  adminName: string
  adminRole: string
  action: string
  targetId: string | null
  targetName: string | null
  details: string
  createdAt: string
}

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/audit-logs?limit=100')
      if (!res.ok) {
        throw new Error('Failed to load audit logs')
      }
      return res.json() as Promise<{ logs: AuditLog[] }>
    },
    refetchInterval: 15000, // Live poll every 15s
  })

  const logs = data?.logs || []

  // Filter logs based on search and action type
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.targetName && log.targetName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter

    return matchesSearch && matchesAction
  })

  // Format timestamp e.g. "Aug 26, 11:28 AM"
  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) + ', ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return dateStr
    }
  }

  // Render action badge styled identically to screenshot 2
  const renderActionBadge = (action: string) => {
    switch (action) {
      case 'UPDATE_PERMISSIONS':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#132238] text-[#38BDF8] border border-[#0284C7]/30 shadow-xs">
            UPDATE PERMISSIONS
          </span>
        )
      case 'CREATE_STAFF':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#0E2822] text-[#34D399] border border-[#059669]/30 shadow-xs">
            CREATE SUBADMIN
          </span>
        )
      case 'DELETE_SUBADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#2D151B] text-[#F87171] border border-[#DC2626]/30 shadow-xs">
            DELETE SUBADMIN
          </span>
        )
      case 'ENABLE_ACCOUNT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#0E2822] text-[#34D399] border border-[#059669]/30 shadow-xs">
            ENABLE ACCOUNT
          </span>
        )
      case 'DISABLE_ACCOUNT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#2E2012] text-[#FBBF24] border border-[#D97706]/30 shadow-xs">
            DISABLE ACCOUNT
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700">
            {action.replace(/_/g, ' ')}
          </span>
        )
    }
  }

  return (
    <div className="min-h-[85vh] -m-5 md:-m-7 p-6 md:p-8 bg-[#0B0F19] text-white">
      {/* Header matching Screenshot 2 */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Audit Logs
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Security trail and admin activity tracking
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111625] border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by admin, sub-admin name, or details..."
              className="w-full bg-[#111625] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-[#111625] border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Actions</option>
              <option value="UPDATE_PERMISSIONS">Update Permissions</option>
              <option value="CREATE_STAFF">Create Subadmin</option>
              <option value="DELETE_SUBADMIN">Delete Subadmin</option>
              <option value="ENABLE_ACCOUNT">Enable Account</option>
              <option value="DISABLE_ACCOUNT">Disable Account</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container matching Screenshot 2 */}
      <div className="max-w-7xl mx-auto bg-[#111625] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold text-[11px] bg-[#0E131F]">
                <th className="py-4 px-6 w-[200px]">TIMESTAMP</th>
                <th className="py-4 px-6 w-[230px]">ADMIN</th>
                <th className="py-4 px-6 w-[200px]">ACTION</th>
                <th className="py-4 px-6">DETAILS</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading security trail...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-rose-400">
                    Failed to load audit logs. Please try refreshing.
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <span>No security audit logs recorded yet.</span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-4 px-6 text-slate-300 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatTimestamp(log.createdAt)}</span>
                      </div>
                    </td>

                    {/* Admin */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#182033] border border-amber-500/40 text-amber-400 font-bold text-[10px] flex items-center justify-center">
                          {log.adminName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">
                          {log.adminName}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          ({log.adminRole === 'SUPER_ADMIN' ? 'Master Admin' : log.adminRole})
                        </span>
                      </div>
                    </td>

                    {/* Action Pill Badge */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {renderActionBadge(log.action)}
                    </td>

                    {/* Details */}
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-normal text-slate-300">
                          {log.details}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
