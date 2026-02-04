import { useState, useEffect } from 'react'
import { Download, FileText, Users, Clock, TrendingUp, CheckCircle, Trash2, Save, Calendar, Plus, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react'
import config from '../config'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Reports() {
  const [data, setData] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [hourRates, setHourRates] = useState({}) // Object with employee_id as key
  const [activeTab, setActiveTab] = useState('summary') // 'summary', 'confirmed', or 'finalized'
  const [confirmedSalaries, setConfirmedSalaries] = useState(() => {
    // Load from localStorage if available
    const stored = localStorage.getItem('confirmedSalaries')
    return stored ? JSON.parse(stored) : []
  })
  const [selectedEmployees, setSelectedEmployees] = useState({}) // Object with employee_id as key for selection
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEmployeeForAction, setSelectedEmployeeForAction] = useState(null)
  const [editFormData, setEditFormData] = useState({ total_hours: '', hour_rate: '', salary: '' })
  const [finalizedSalaries, setFinalizedSalaries] = useState(() => {
    // Load from localStorage if available
    const stored = localStorage.getItem('finalizedSalariesByMonth')
    return stored ? JSON.parse(stored) : {}
  })
  const [selectedFinalizedMonth, setSelectedFinalizedMonth] = useState('')
  const [showDeleteFinalizedModal, setShowDeleteFinalizedModal] = useState(false)
  const [monthToDelete, setMonthToDelete] = useState('')
  const [manualUsers, setManualUsers] = useState(() => {
    // Load from localStorage if available
    const stored = localStorage.getItem('manualUsers')
    return stored ? JSON.parse(stored) : []
  })
  const [manualUserDailyRecords, setManualUserDailyRecords] = useState(() => {
    // Load daily records for manual users from localStorage
    const stored = localStorage.getItem('manualUserDailyRecords')
    return stored ? JSON.parse(stored) : {} // Object with employee_id as key, array of daily records as value
  })
  const [showAddManualUserModal, setShowAddManualUserModal] = useState(false)
  const [manualUserForm, setManualUserForm] = useState({
    employee_id: '',
    employee_name: '',
    total_hours: '',
    hour_rate: '',
    is_manual: true // Flag to identify manual users
  })
  const [editingManualUser, setEditingManualUser] = useState(null)
  const [expandedBuckets, setExpandedBuckets] = useState(() => {
    // Load from localStorage if available, or default to all expanded
    const stored = localStorage.getItem('expandedBuckets')
    return stored ? JSON.parse(stored) : {}
  })
  const [showUserCalendar, setShowUserCalendar] = useState(false)
  const [selectedUserForCalendar, setSelectedUserForCalendar] = useState(null)
  const [showEditDayModal, setShowEditDayModal] = useState(false)
  const [selectedDayForEdit, setSelectedDayForEdit] = useState(null)
  const [editDayForm, setEditDayForm] = useState({ status: '', hours: '', minutes: '', date: '' })

  useEffect(() => {
    const stored = localStorage.getItem('lastProcessResult')
    if (stored) {
      setData(JSON.parse(stored))
      if (JSON.parse(stored).monthly_summary?.length > 0) {
        setSelectedEmployee(JSON.parse(stored).monthly_summary[0])
      }
    }
  }, [])

  // Save confirmedSalaries to localStorage whenever they change
  useEffect(() => {
    if (confirmedSalaries.length > 0 || localStorage.getItem('confirmedSalaries')) {
      localStorage.setItem('confirmedSalaries', JSON.stringify(confirmedSalaries))
    }
  }, [confirmedSalaries])

  if (!data) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Reports Available</h2>
        <p className="text-gray-600 mb-6">
          Process an attendance file to view detailed reports
        </p>
        <a href="/upload" className="btn-primary inline-block">
          Upload File
        </a>
      </div>
    )
  }

  const { monthly_summary: originalMonthlySummary, daily_report, statistics } = data
  
  // Merge manual users with monthly_summary
  const monthly_summary = [...originalMonthlySummary, ...manualUsers]

  // ========== HH:MM Format Helper Functions ==========
  
  // Convert HH:MM to total minutes (for calculations)
  const hhmmToMinutes = (hhmm) => {
    if (!hhmm || typeof hhmm !== 'string') return 0
    const parts = hhmm.trim().split(':')
    if (parts.length !== 2) return 0
    const hours = parseInt(parts[0], 10) || 0
    const minutes = parseInt(parts[1], 10) || 0
    if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes >= 60) return 0
    return (hours * 60) + minutes
  }

  // Convert total minutes to HH:MM format
  const minutesToHHMM = (totalMinutes) => {
    if (!totalMinutes && totalMinutes !== 0) return '0:00'
    const minutes = Math.abs(Math.round(totalMinutes))
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${String(mins).padStart(2, '0')}`
  }

  // Add two HH:MM times together
  const addHHMM = (time1, time2) => {
    const minutes1 = hhmmToMinutes(time1)
    const minutes2 = hhmmToMinutes(time2)
    return minutesToHHMM(minutes1 + minutes2)
  }

  // Sum an array of HH:MM times
  const sumHHMM = (times) => {
    if (!Array.isArray(times) || times.length === 0) return '0:00'
    const totalMinutes = times.reduce((sum, time) => {
      return sum + hhmmToMinutes(time)
    }, 0)
    return minutesToHHMM(totalMinutes)
  }

  // Multiply HH:MM by a number (for salary calculations)
  const multiplyHHMM = (hhmm, multiplier) => {
    const minutes = hhmmToMinutes(hhmm)
    const result = minutes * multiplier
    return minutesToHHMM(result)
  }

  // Convert hours and minutes to HH:MM format
  const hoursMinutesToHHMM = (hours, minutes) => {
    const h = parseInt(hours, 10) || 0
    const m = parseInt(minutes, 10) || 0
    if (m < 0 || m >= 60) return '0:00'
    return `${h}:${String(m).padStart(2, '0')}`
  }

  // Validate HH:MM format
  const isValidHHMM = (hhmm) => {
    if (!hhmm || typeof hhmm !== 'string') return false
    const parts = hhmm.trim().split(':')
    if (parts.length !== 2) return false
    const hours = parseInt(parts[0], 10)
    const minutes = parseInt(parts[1], 10)
    return !isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60
  }

  // Get HH:MM from data (handles both old decimal and new HH:MM format)
  const getHHMM = (data) => {
    if (!data) return '0:00'
    // If it's already HH:MM format, return it
    if (typeof data === 'string' && data.includes(':')) {
      return data
    }
    // If it's a number (decimal), convert it
    if (typeof data === 'number') {
      const hours = Math.floor(data)
      const minutes = Math.round((data - hours) * 60)
      return `${hours}:${String(minutes).padStart(2, '0')}`
    }
    // Try to get hours_hm or worked_hours from object
    if (typeof data === 'object') {
      if (data.hours_hm) return data.hours_hm
      if (data.worked_hours) {
        // Check if worked_hours is already in HH:MM format
        if (typeof data.worked_hours === 'string' && data.worked_hours.includes(':')) {
          return data.worked_hours
        }
        // Otherwise, treat it as decimal and convert
        const h = typeof data.worked_hours === 'string' ? parseFloat(data.worked_hours) : data.worked_hours
        const hours = Math.floor(h)
        const minutes = Math.round((h - hours) * 60)
        return `${hours}:${String(minutes).padStart(2, '0')}`
      }
      if (data.total_hours_hm) return data.total_hours_hm
      if (data.total_hours) {
        // Check if total_hours is already in HH:MM format
        if (typeof data.total_hours === 'string' && data.total_hours.includes(':')) {
          return data.total_hours
        }
        // Otherwise, treat it as decimal and convert
        const h = typeof data.total_hours === 'string' ? parseFloat(data.total_hours) : data.total_hours
        const hours = Math.floor(h)
        const minutes = Math.round((h - hours) * 60)
        return `${hours}:${String(minutes).padStart(2, '0')}`
      }
    }
    return '0:00'
  }

  // Prepare chart data (using minutes for sorting, but display HH:MM)
  const topEmployees = monthly_summary
    .map((emp) => ({
      name: emp.employee_name,
      total_hours_hm: getHHMM(emp),
      total_minutes: hhmmToMinutes(getHHMM(emp))
    }))
    .sort((a, b) => b.total_minutes - a.total_minutes)
    .slice(0, 10)
    .map((emp) => ({
      name: emp.name,
      hours: hhmmToMinutes(emp.total_hours_hm) / 60, // Convert to decimal for chart display (chart library needs numbers)
      hours_hm: emp.total_hours_hm
    }))

  const statusDistribution = [
    {
      name: 'Present',
      value: statistics.present_days,
      color: '#10b981',
    },
    {
      name: 'Absent',
      value: statistics.absent_days,
      color: '#ef4444',
    },
    {
      name: 'Auto-Assigned',
      value: statistics.auto_assigned_days,
      color: '#f59e0b',
    },
  ]

  const handleDownload = () => {
    if (data?.output_file) {
      const filename = data.output_file.split(/[/\\]/).pop()
      window.open(config.getApiUrl(`/api/download?filename=${filename}`), '_blank')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Reports</h1>
          <p className="text-gray-600">Comprehensive analysis of attendance data</p>
        </div>
        <button onClick={handleDownload} className="btn-primary flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Download Excel</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Employees</p>
              <p className="text-3xl font-bold">{statistics.total_employees}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Total Hours</p>
              <p className="text-3xl font-bold">
                {sumHHMM(monthly_summary.map(emp => getHHMM(emp)))}
              </p>
            </div>
            <Clock className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Present Days</p>
              <p className="text-3xl font-bold">{statistics.present_days}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Avg Hours/Employee</p>
              <p className="text-3xl font-bold">
                {monthly_summary.length > 0 
                  ? minutesToHHMM(
                      Math.round(
                        monthly_summary.reduce((sum, emp) => sum + hhmmToMinutes(getHHMM(emp)), 0) / monthly_summary.length
                      )
                    )
                  : '0:00'}
              </p>
            </div>
            <FileText className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Employees by Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topEmployees}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Details</h3>
        <select
          value={selectedEmployee?.employee_id || ''}
          onChange={(e) => {
            const emp = monthly_summary.find(
              (m) => m.employee_id === parseInt(e.target.value)
            )
            setSelectedEmployee(emp)
          }}
          className="input-field mb-4"
        >
          {monthly_summary.map((emp) => (
            <option key={emp.employee_id} value={emp.employee_id}>
              {emp.employee_name} (ID: {emp.employee_id})
            </option>
          ))}
        </select>

        {selectedEmployee && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {getHHMM(selectedEmployee)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Present Days</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedEmployee.present_days}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Absent Days</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedEmployee.absent_days}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Auto-Assigned</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedEmployee.auto_assigned_days}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Section */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Monthly Summary
            </button>
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'confirmed'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>Confirmed Salaries</span>
              {confirmedSalaries.length > 0 && (
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                  {confirmedSalaries.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('finalized')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'finalized'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>Finalized Salaries</span>
              {Object.keys(finalizedSalaries).length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                  {Object.keys(finalizedSalaries).length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Monthly Summary Table */}
      {activeTab === 'summary' && (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Summary</h3>
          <button
            onClick={() => {
              setManualUserForm({
                employee_id: '',
                employee_name: '',
                total_hours: '',
                hour_rate: '',
                is_manual: true
              })
              setEditingManualUser(null)
              setShowAddManualUserModal(true)
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual User</span>
          </button>
          {Object.keys(selectedEmployees).filter(id => selectedEmployees[id]).length > 0 && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {Object.keys(selectedEmployees).filter(id => selectedEmployees[id]).length} selected
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">₹</span>
                  <input
                    type="number"
                    placeholder="Set rate for all"
                    min="0"
                    step="0.01"
                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const rate = parseFloat(e.target.value) || 0
                        if (rate > 0) {
                          const selectedIds = Object.keys(selectedEmployees).filter(id => selectedEmployees[id])
                          const updatedRates = { ...hourRates }
                          selectedIds.forEach(id => {
                            updatedRates[id] = rate
                          })
                          setHourRates(updatedRates)
                          e.target.value = ''
                        }
                      }
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    const rateInput = document.querySelector('input[placeholder="Set rate for all"]')
                    const rate = parseFloat(rateInput?.value) || 0
                    if (rate > 0) {
                      const selectedIds = Object.keys(selectedEmployees).filter(id => selectedEmployees[id])
                      const updatedRates = { ...hourRates }
                      selectedIds.forEach(id => {
                        updatedRates[id] = rate
                      })
                      setHourRates(updatedRates)
                      if (rateInput) rateInput.value = ''
                    }
                  }}
                  className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={monthly_summary.length > 0 && monthly_summary.every(emp => selectedEmployees[emp.employee_id])}
                    onChange={(e) => {
                      const newSelection = {}
                      monthly_summary.forEach(emp => {
                        newSelection[emp.employee_id] = e.target.checked
                      })
                      setSelectedEmployees(newSelection)
                    }}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hour Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present Days
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent Days
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthly_summary.map((emp) => {
                const rate = parseFloat(hourRates[emp.employee_id]) || 0
                // Convert HH:MM to decimal hours for salary calculation
                const totalHoursHHMM = getHHMM(emp)
                const totalHoursDecimal = hhmmToMinutes(totalHoursHHMM) / 60
                const salary = totalHoursDecimal * rate
                const hasRate = rate > 0
                const hasSalary = salary > 0
                return (
                  <tr key={emp.employee_id} className={`hover:bg-gray-50 ${selectedEmployees[emp.employee_id] ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEmployees[emp.employee_id] || false}
                        onChange={(e) => {
                          setSelectedEmployees({
                            ...selectedEmployees,
                            [emp.employee_id]: e.target.checked
                          })
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </td>
                    <td 
                      className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer hover:bg-primary-50"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Opening calendar for user:', emp)
                        console.log('Data available:', !!data)
                        console.log('Daily report available:', !!data?.daily_report)
                        setSelectedUserForCalendar(emp)
                        setShowUserCalendar(true)
                      }}
                      title="Click to view date-wise attendance calendar"
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-primary-600" />
                        <span className="text-primary-600 hover:text-primary-800 hover:underline font-semibold">
                      {emp.employee_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-600">₹</span>
                        <input
                          type="number"
                          value={hourRates[emp.employee_id] || ''}
                          onChange={(e) => {
                            setHourRates({
                              ...hourRates,
                              [emp.employee_id]: e.target.value
                            })
                          }}
                          placeholder="Rate"
                          min="0"
                          step="0.01"
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {emp.is_manual ? '-' : (emp.present_days || 0)} days
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {emp.is_manual ? '-' : (emp.absent_days || 0)} days
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {totalHoursHHMM} hrs
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {hasSalary ? `₹${salary.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                      {hasRate && hasSalary ? (
                        <button
                          onClick={() => {
                            const confirmedSalary = {
                              employee_id: emp.employee_id,
                              employee_name: emp.employee_name,
                              total_hours: parseFloat(emp.total_hours),
                              hour_rate: rate,
                              salary: salary,
                              confirmed_at: new Date().toISOString()
                            }
                            // Add to confirmed salaries if not already there
                            setConfirmedSalaries(prev => {
                              const exists = prev.find(s => s.employee_id === emp.employee_id)
                              if (exists) {
                                return prev.map(s => 
                                  s.employee_id === emp.employee_id ? confirmedSalary : s
                                )
                              }
                              return [...prev, confirmedSalary]
                            })
                            // Switch to confirmed tab
                            setActiveTab('confirmed')
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Confirm</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                        {emp.is_manual && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${emp.employee_name} (ID: ${emp.employee_id})?`)) {
                                // Remove from manual users
                                const updatedManualUsers = manualUsers.filter(
                                  u => u.employee_id !== emp.employee_id
                                )
                                setManualUsers(updatedManualUsers)
                                localStorage.setItem('manualUsers', JSON.stringify(updatedManualUsers))
                                
                                // Remove from confirmed salaries if exists
                                setConfirmedSalaries(prev => 
                                  prev.filter(s => s.employee_id !== emp.employee_id)
                                )
                                
                                // Remove hour rate if exists
                                setHourRates(prev => {
                                  const updated = { ...prev }
                                  delete updated[emp.employee_id]
                                  return updated
                                })
                                
                                // Remove from selected employees if exists
                                setSelectedEmployees(prev => {
                                  const updated = { ...prev }
                                  delete updated[emp.employee_id]
                                  return updated
                                })
                                
                                alert(`Successfully deleted ${emp.employee_name}`)
                              }
                            }}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-1"
                            title="Delete manual user"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* Bottom Action Buttons */}
        {activeTab === 'summary' && (
          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              onClick={() => {
                // Calculate all salaries - could save to backend here
                const allSalaries = monthly_summary
                  .filter(emp => {
                    const rate = parseFloat(hourRates[emp.employee_id]) || 0
                    return rate > 0
                  })
                  .map(emp => {
                    const rate = parseFloat(hourRates[emp.employee_id]) || 0
                    const totalHoursHHMM = getHHMM(emp)
                    const totalHoursDecimal = hhmmToMinutes(totalHoursHHMM) / 60
                    const salary = totalHoursDecimal * rate
                    return {
                      employee_id: emp.employee_id,
                      employee_name: emp.employee_name,
                      total_hours: totalHoursHHMM, // Store as HH:MM format
                      hour_rate: rate,
                      salary: salary
                    }
                  })
                
                // You can add save logic here
                alert(`Calculated salaries for ${allSalaries.length} employees`)
              }}
              className="flex-1 btn-primary flex items-center justify-center space-x-2 py-3"
            >
              <Clock className="w-5 h-5" />
              <span>Calculate & Save All ({Object.values(hourRates).filter(rate => rate && parseFloat(rate) > 0).length})</span>
            </button>
            
            <button
              onClick={() => {
                const selectedIds = Object.keys(selectedEmployees).filter(id => selectedEmployees[id])
                const salaries = monthly_summary
                  .filter(emp => selectedIds.includes(emp.employee_id.toString()))
                  .map(emp => {
                    const rate = parseFloat(hourRates[emp.employee_id]) || 0
                    const totalHoursHHMM = getHHMM(emp)
                    const totalHoursDecimal = hhmmToMinutes(totalHoursHHMM) / 60
                    const salary = totalHoursDecimal * rate
                    return {
                      employee_id: emp.employee_id,
                      employee_name: emp.employee_name,
                      total_hours: totalHoursHHMM, // Store as HH:MM format
                      hour_rate: rate,
                      salary: salary,
                      confirmed_at: new Date().toISOString()
                    }
                  })
                  .filter(emp => emp.hour_rate > 0)
                
                if (salaries.length > 0) {
                  setConfirmedSalaries(prev => {
                    // Merge with existing confirmed salaries
                    const existingIds = prev.map(s => s.employee_id)
                    const newSalaries = salaries.filter(s => !existingIds.includes(s.employee_id))
                    const updatedSalaries = prev.map(s => {
                      const updated = salaries.find(ns => ns.employee_id === s.employee_id)
                      return updated || s
                    })
                    return [...updatedSalaries, ...newSalaries]
                  })
                  setActiveTab('confirmed')
                }
              }}
              disabled={Object.values(selectedEmployees).filter(Boolean).length === 0}
              className="flex-1 btn-primary flex items-center justify-center space-x-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Confirm All ({Object.values(selectedEmployees).filter(Boolean).length})</span>
            </button>
          </div>
        )}
        
        {Object.keys(hourRates).length > 0 && Object.values(hourRates).some(rate => rate && parseFloat(rate) > 0) && activeTab === 'summary' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Salary:</span>
              <span className="text-xl font-bold text-green-600">
                ₹{monthly_summary.reduce((sum, emp) => {
                  const rate = parseFloat(hourRates[emp.employee_id]) || 0
                  const totalHoursHHMM = getHHMM(emp)
                  const totalHoursDecimal = hhmmToMinutes(totalHoursHHMM) / 60
                  return sum + (totalHoursDecimal * rate)
                }, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Confirmed Salaries Tab Content */}
      {activeTab === 'confirmed' && (
        <div className="card">
          {confirmedSalaries.length > 0 ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmed Salaries</h3>
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hour Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Salary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {confirmedSalaries.map((emp, index) => (
                        <tr key={emp.employee_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {emp.employee_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {emp.employee_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {getHHMM(emp)} hrs
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            ₹{parseFloat(emp.hour_rate || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            ₹{parseFloat(emp.salary || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedEmployeeForAction({ ...emp, index })
                                  setEditFormData({
                                    total_hours: getHHMM(emp), // Convert to HH:MM format
                                    hour_rate: emp.hour_rate ? String(emp.hour_rate) : '',
                                    salary: emp.salary ? String(emp.salary) : ''
                                  })
                                  setShowUpdateModal(true)
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-1"
                              >
                                <Save className="w-4 h-4" />
                                <span>Update</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedEmployeeForAction({ ...emp, index })
                                  setShowDeleteModal(true)
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                          Total Salary:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-lg">
                          ₹{confirmedSalaries.reduce((sum, emp) => sum + emp.salary, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => {
                      if (confirmedSalaries.length === 0) {
                        alert('No salaries to finalize')
                        return
                      }
                      
                      // Get month/year from processed data (selected during upload)
                      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                                    'July', 'August', 'September', 'October', 'November', 'December']
                      const selectedYear = data?.year || new Date().getFullYear()
                      const selectedMonth = data?.month || (new Date().getMonth() + 1)
                      const monthKey = `${months[selectedMonth - 1]} ${selectedYear}`
                      
                      // Check if month container already exists
                      const existingMonthData = finalizedSalaries[monthKey]
                      
                      let updatedEmployees
                      if (existingMonthData) {
                        // Month container exists - merge new employees with existing ones
                        // Create a map of existing employees by employee_id for quick lookup
                        const existingEmployeesMap = new Map(
                          existingMonthData.employees.map(emp => [emp.employee_id, emp])
                        )
                        
                        // Add new employees (newer entries replace older ones for same employee_id)
                        confirmedSalaries.forEach(newEmp => {
                          existingEmployeesMap.set(newEmp.employee_id, {
                            ...newEmp,
                            finalized_at: new Date().toISOString()
                          })
                        })
                        
                        // Convert map back to array
                        updatedEmployees = Array.from(existingEmployeesMap.values())
                      } else {
                        // Month container doesn't exist - create new one
                        updatedEmployees = confirmedSalaries.map(emp => ({
                          ...emp,
                          finalized_at: new Date().toISOString()
                        }))
                      }
                      
                      // Calculate total salary for all employees in this month
                      const totalSalary = updatedEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0)
                      
                      // Save to finalized salaries organized by month (append/merge, don't replace)
                      const updatedFinalized = {
                        ...finalizedSalaries,
                        [monthKey]: {
                          month: selectedMonth,
                          year: selectedYear,
                          finalized_at: new Date().toISOString(), // Update to latest finalization time
                          employees: updatedEmployees,
                          total_salary: totalSalary
                        }
                      }
                      
                      setFinalizedSalaries(updatedFinalized)
                      localStorage.setItem('finalizedSalariesByMonth', JSON.stringify(updatedFinalized))
                      
                      const actionMessage = existingMonthData 
                        ? `Added ${confirmedSalaries.length} employees to existing ${monthKey} container. Total employees: ${updatedEmployees.length}`
                        : `Successfully created new ${monthKey} container with ${confirmedSalaries.length} employees`
                      
                      // Clear all report data after finalizing
                      setConfirmedSalaries([])
                      setData(null)
                      setHourRates({})
                      setSelectedEmployees({})
                      setSelectedEmployee(null)
                      
                      // Clear processed data from localStorage
                      localStorage.removeItem('processedReportData')
                      localStorage.removeItem('hourRates')
                      
                      alert(`${actionMessage}. All report data has been cleared.`)
                      
                      // Switch to finalized tab to show the saved data
                      setActiveTab('finalized')
                    }}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Finalize & Confirm</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Confirmed Salaries</h3>
              <p className="text-gray-600 mb-4">
                Confirm employee salaries from the Monthly Summary tab to view them here.
              </p>
              <button
                onClick={() => setActiveTab('summary')}
                className="btn-secondary"
              >
                Go to Monthly Summary
              </button>
            </div>
          )}
        </div>
      )}

      {/* Update Confirmation Modal */}
      {showUpdateModal && selectedEmployeeForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Update Salary</h3>
            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="font-semibold text-gray-900">{selectedEmployeeForAction.employee_name}</p>
                <p className="text-sm text-gray-600">ID: {selectedEmployeeForAction.employee_id}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Hours (HH:MM format)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editFormData.total_hours}
                      onChange={(e) => {
                        let value = e.target.value
                        // Allow only digits and colon
                        value = value.replace(/[^\d:]/g, '')
                        // Limit to reasonable format
                        if (value.includes(':')) {
                          const parts = value.split(':')
                          if (parts[0] && parseInt(parts[0]) > 24) {
                            value = '24:' + (parts[1] || '')
                          }
                          if (parts[1] && parts[1].length > 2) {
                            value = parts[0] + ':' + parts[1].slice(0, 2)
                          }
                          if (parts[1] && parseInt(parts[1]) >= 60) {
                            value = parts[0] + ':59'
                          }
                        }
                        const rate = parseFloat(editFormData.hour_rate) || 0
                        const hoursDecimal = isValidHHMM(value) ? hhmmToMinutes(value) / 60 : 0
                        setEditFormData({
                          ...editFormData,
                          total_hours: value,
                          salary: (hoursDecimal * rate).toFixed(2)
                        })
                      }}
                      className="flex-1 input-field"
                      placeholder="8:30"
                    />
                    <span className="text-sm text-gray-600">hrs</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format: HH:MM (e.g., 8:30 for 8 hours 30 minutes)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hour Rate
                  </label>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-600">₹</span>
                    <input
                      type="number"
                      value={editFormData.hour_rate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0
                        const hoursDecimal = isValidHHMM(editFormData.total_hours) ? hhmmToMinutes(editFormData.total_hours) / 60 : 0
                        setEditFormData({
                          ...editFormData,
                          hour_rate: e.target.value,
                          salary: (hoursDecimal * rate).toFixed(2)
                        })
                      }}
                      min="0"
                      step="0.01"
                      className="flex-1 input-field"
                      placeholder="Enter rate"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary
                  </label>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-600">₹</span>
                    <input
                      type="number"
                      value={editFormData.salary}
                      onChange={(e) => {
                        const salary = parseFloat(e.target.value) || 0
                        const hoursDecimal = isValidHHMM(editFormData.total_hours) ? hhmmToMinutes(editFormData.total_hours) / 60 : 0
                        const rate = hoursDecimal > 0 ? (salary / hoursDecimal).toFixed(2) : 0
                        setEditFormData({
                          ...editFormData,
                          salary: e.target.value,
                          hour_rate: rate
                        })
                      }}
                      min="0"
                      step="0.01"
                      className="flex-1 input-field font-bold text-green-600"
                      placeholder="Enter salary"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUpdateModal(false)
                  setSelectedEmployeeForAction(null)
                  setEditFormData({ total_hours: '', hour_rate: '', salary: '' })
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Update the confirmed salaries array
                  const updated = confirmedSalaries.map((emp, i) => {
                    if (i === selectedEmployeeForAction.index) {
                      // Only update fields that have valid values, keep existing values otherwise
                      const updatedEmp = { ...emp }
                      
                      // Update total_hours only if valid HH:MM format is provided
                      if (editFormData.total_hours && isValidHHMM(editFormData.total_hours)) {
                        updatedEmp.total_hours = editFormData.total_hours
                      } else if (editFormData.total_hours === '') {
                        // If empty, keep existing value (convert to HH:MM if needed)
                        updatedEmp.total_hours = getHHMM(emp)
                      }
                      
                      // Update hour_rate only if a valid number is provided
                      if (editFormData.hour_rate !== '' && !isNaN(parseFloat(editFormData.hour_rate))) {
                        updatedEmp.hour_rate = parseFloat(editFormData.hour_rate)
                      }
                      // If empty, keep existing hour_rate
                      
                      // Update salary only if a valid number is provided
                      if (editFormData.salary !== '' && !isNaN(parseFloat(editFormData.salary))) {
                        updatedEmp.salary = parseFloat(editFormData.salary)
                      }
                      // If empty, keep existing salary
                      
                      return updatedEmp
                    }
                    return emp
                  })
                  setConfirmedSalaries(updated)
                  alert(`Salary updated successfully for ${selectedEmployeeForAction.employee_name}!`)
                  setShowUpdateModal(false)
                  setSelectedEmployeeForAction(null)
                  setEditFormData({ total_hours: '', hour_rate: '', salary: '' })
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Confirm Update</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployeeForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-red-900 mb-4">Delete Salary Confirmation</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete the salary record for:
              </p>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="font-semibold text-gray-900">{selectedEmployeeForAction.employee_name}</p>
                <p className="text-sm text-gray-600">ID: {selectedEmployeeForAction.employee_id}</p>
                <p className="text-sm font-bold text-red-600">Salary: ₹{selectedEmployeeForAction.salary.toFixed(2)}</p>
              </div>
              <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedEmployeeForAction(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Delete logic - remove from confirmed salaries and clear hour rate in monthly summary
                  setConfirmedSalaries(prev => 
                    prev.filter((_, i) => i !== selectedEmployeeForAction.index)
                  )
                  // Clear the hour rate for this employee in monthly summary
                  setHourRates(prev => {
                    const updated = { ...prev }
                    delete updated[selectedEmployeeForAction.employee_id]
                    return updated
                  })
                  alert(`Salary record deleted for ${selectedEmployeeForAction.employee_name}! The hour rate has been reset in Monthly Summary.`)
                  setShowDeleteModal(false)
                  setSelectedEmployeeForAction(null)
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalized Salaries Tab Content */}
      {activeTab === 'finalized' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Finalized Salaries by Month</h3>
            {Object.keys(finalizedSalaries).length > 0 && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <select
                    value={selectedFinalizedMonth || ''}
                    onChange={(e) => setSelectedFinalizedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">All Months</option>
                    {Object.keys(finalizedSalaries)
                      .sort((a, b) => {
                        const dateA = new Date(finalizedSalaries[a].finalized_at)
                        const dateB = new Date(finalizedSalaries[b].finalized_at)
                        return dateB - dateA
                      })
                      .map((monthKey) => (
                        <option key={monthKey} value={monthKey}>
                          {monthKey}
                        </option>
                      ))}
                  </select>
                </div>
                {selectedFinalizedMonth && finalizedSalaries[selectedFinalizedMonth] && (
                  <button
                    onClick={async () => {
                      try {
                        // Helper function to format numbers without exponential notation
                        const formatNumber = (num) => {
                          // Handle null, undefined, or NaN
                          if (num === null || num === undefined || num === '' || isNaN(num)) {
                            return '0'
                          }
                          
                          // Convert to number and round to integer
                          const numValue = Number(num)
                          if (isNaN(numValue)) return '0'
                          
                          // Round to integer
                          const intNum = Math.round(numValue)
                          
                          // Convert to string - this will never produce exponential notation for reasonable numbers
                          let numStr = String(intNum)
                          
                          // If somehow exponential notation appears, use alternative method
                          if (numStr.includes('e') || numStr.includes('E')) {
                            // For very large numbers, use a more reliable method
                            numStr = intNum.toString()
                            if (numStr.includes('e') || numStr.includes('E')) {
                              // Last resort: manually construct string
                              const absNum = Math.abs(intNum)
                              numStr = intNum < 0 ? '-' + absNum.toString() : absNum.toString()
                            }
                          }
                          
                          return numStr
                        }
                        
                        // Dynamic import of jsPDF
                        const jsPDF = (await import('jspdf')).default
                        const doc = new jsPDF()
                        
                        const monthData = finalizedSalaries[selectedFinalizedMonth]
                        const pageWidth = doc.internal.pageSize.getWidth()
                        const margin = 15
                        const tableStartX = margin
                        const tableEndX = pageWidth - margin
                        
                        let yPos = margin
                        
                        // Header Section with colored background
                        doc.setFillColor(14, 165, 233) // primary-600 color
                        doc.rect(0, 0, pageWidth, 35, 'F')
                        
                        // Title
                        doc.setTextColor(255, 255, 255) // White text
                        doc.setFontSize(20)
                        doc.setFont(undefined, 'bold')
                        doc.text(`Salary Report - ${selectedFinalizedMonth}`, margin, yPos + 15)
                        
                        // Date
                        doc.setFontSize(10)
                        doc.setFont(undefined, 'normal')
                        const finalizedDate = new Date(monthData.finalized_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        doc.text(`Finalized on: ${finalizedDate}`, margin, yPos + 22)
                        
                        yPos = 45
                        doc.setTextColor(0, 0, 0) // Black text
                        
                        // Summary boxes
                        const boxWidth = 85
                        const boxHeight = 25
                        const boxSpacing = 10
                        
                        // Total Employees box
                        doc.setFillColor(239, 246, 255) // Light blue background
                        doc.rect(margin, yPos, boxWidth, boxHeight, 'F')
                        doc.setFontSize(9)
                        doc.setTextColor(100, 100, 100)
                        doc.text('TOTAL EMPLOYEES', margin + 5, yPos + 8)
                        doc.setFontSize(16)
                        doc.setTextColor(14, 165, 233) // primary-600
                        doc.setFont(undefined, 'bold')
                        doc.text(monthData.employees.length.toString(), margin + 5, yPos + 18)
                        
                        // Total Salary box
                        doc.setFillColor(236, 253, 245) // Light green background
                        doc.rect(margin + boxWidth + boxSpacing, yPos, boxWidth, boxHeight, 'F')
                        doc.setFontSize(9)
                        doc.setTextColor(100, 100, 100)
                        doc.text('TOTAL SALARY', margin + boxWidth + boxSpacing + 5, yPos + 8)
                        doc.setFontSize(16)
                        doc.setTextColor(16, 185, 129) // green-500
                        doc.setFont(undefined, 'bold')
                        doc.text(`₹${formatNumber(monthData.total_salary)}`, margin + boxWidth + boxSpacing + 5, yPos + 18)
                        
                        yPos += 35
                        
                        // Table Header with background
                        doc.setFillColor(249, 250, 251) // gray-50
                        doc.rect(tableStartX, yPos, tableEndX - tableStartX, 12, 'F')
                        
                        doc.setFontSize(10)
                        doc.setFont(undefined, 'bold')
                        doc.setTextColor(55, 65, 81) // gray-700
                        doc.text('EMPLOYEE ID', tableStartX + 3, yPos + 8)
                        doc.text('EMPLOYEE NAME', tableStartX + 25, yPos + 8)
                        doc.text('TOTAL HOURS', tableStartX + 75, yPos + 8)
                        doc.text('HOUR RATE', tableStartX + 105, yPos + 8)
                        doc.text('SALARY', tableStartX + 135, yPos + 8)
                        
                        yPos += 15
                        
                        // Table rows
                        doc.setFont(undefined, 'normal')
                        doc.setFontSize(9)
                        
                        monthData.employees.forEach((emp, index) => {
                          // Check if new page needed
                          if (yPos > 280) {
                            doc.addPage()
                            yPos = margin
                            
                            // Re-add table header on new page
                            doc.setFillColor(249, 250, 251)
                            doc.rect(tableStartX, yPos, tableEndX - tableStartX, 12, 'F')
                            doc.setFontSize(10)
                            doc.setFont(undefined, 'bold')
                            doc.setTextColor(55, 65, 81)
                            doc.text('EMPLOYEE ID', tableStartX + 3, yPos + 8)
                            doc.text('EMPLOYEE NAME', tableStartX + 25, yPos + 8)
                            doc.text('TOTAL HOURS', tableStartX + 75, yPos + 8)
                            doc.text('HOUR RATE', tableStartX + 105, yPos + 8)
                            doc.text('SALARY', tableStartX + 135, yPos + 8)
                            yPos += 15
                          }
                          
                          // Alternating row background
                          if (index % 2 === 1) {
                            doc.setFillColor(249, 250, 251) // light gray
                            doc.rect(tableStartX, yPos - 5, tableEndX - tableStartX, 6, 'F')
                          }
                          
                          // Row data
                          doc.setTextColor(0, 0, 0)
                          doc.setFont(undefined, 'normal')
                          
                          // Employee ID (with slight background)
                          doc.setFillColor(243, 244, 246) // gray-100
                          doc.rect(tableStartX + 1, yPos - 4.5, 18, 5, 'F')
                          doc.setFont(undefined, 'bold')
                          doc.text(emp.employee_id.toString(), tableStartX + 3, yPos)
                          
                          // Employee Name
                          doc.setFont(undefined, 'normal')
                          const name = emp.employee_name.length > 18 ? emp.employee_name.substring(0, 18) + '...' : emp.employee_name
                          doc.text(name, tableStartX + 25, yPos)
                          
                          // Total Hours (right aligned)
                          doc.text(`${getHHMM(emp)} hrs`, tableStartX + 75, yPos)
                          
                          // Hour Rate (right aligned)
                          const hourRateValue = formatNumber(parseFloat(emp.hour_rate || 0))
                          doc.text(`₹${hourRateValue}`, tableStartX + 105, yPos)
                          
                          // Salary (right aligned, bold, green)
                          doc.setFont(undefined, 'bold')
                          doc.setTextColor(16, 185, 129) // green-500
                          const salaryValue = formatNumber(parseFloat(emp.salary || 0))
                          doc.text(`₹${salaryValue}`, tableStartX + 135, yPos)
                          doc.setTextColor(0, 0, 0) // Reset to black
                          
                          yPos += 6
                        })
                        
                        // Footer with total
                        yPos += 2
                        doc.setFillColor(236, 253, 245) // Light green background
                        doc.rect(tableStartX, yPos, tableEndX - tableStartX, 10, 'F')
                        
                        doc.setLineWidth(0.2)
                        doc.setDrawColor(34, 197, 94) // green-500
                        doc.line(tableStartX, yPos, tableEndX, yPos)
                        
                        doc.setFontSize(11)
                        doc.setFont(undefined, 'bold')
                        doc.setTextColor(0, 0, 0)
                        doc.text('Grand Total Salary:', tableStartX + 100, yPos + 7)
                        doc.setTextColor(22, 163, 74) // green-600
                        doc.setFontSize(12)
                        // Format grand total number cleanly
                        const grandTotalValue = formatNumber(monthData.total_salary)
                        // Use simple text positioning without options that might cause rendering issues
                        doc.text(`₹${grandTotalValue}`, tableStartX + 135, yPos + 7)
                        
                        // Page number
                        const totalPages = doc.internal.pages.length - 1
                        for (let i = 1; i <= totalPages; i++) {
                          doc.setPage(i)
                          doc.setFontSize(8)
                          doc.setTextColor(150, 150, 150)
                          doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' })
                        }
                        
                        // Save PDF
                        doc.save(`Salary_Report_${selectedFinalizedMonth.replace(/\s+/g, '_')}.pdf`)
                      } catch (error) {
                        console.error('Error generating PDF:', error)
                        alert('Error generating PDF. Please install jspdf: npm install jspdf')
                      }
                    }}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {Object.keys(finalizedSalaries).length > 0 ? (
            <div className="space-y-6">
              {(selectedFinalizedMonth
                ? [[selectedFinalizedMonth, finalizedSalaries[selectedFinalizedMonth]]]
                : Object.entries(finalizedSalaries)
                    .sort((a, b) => {
                      // Sort by date (newest first)
                      const dateA = new Date(a[1].finalized_at)
                      const dateB = new Date(b[1].finalized_at)
                      return dateB - dateA
                    })
              ).map(([monthKey, monthData]) => {
                  const isExpanded = expandedBuckets[monthKey] !== false // Default to expanded
                  
                  const toggleBucket = () => {
                    const newExpanded = {
                      ...expandedBuckets,
                      [monthKey]: !isExpanded
                    }
                    setExpandedBuckets(newExpanded)
                    localStorage.setItem('expandedBuckets', JSON.stringify(newExpanded))
                  }
                  
                  return (
                  <div key={monthKey} className="bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Header Section with Gradient - Clickable to Toggle */}
                    <div 
                      className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 cursor-pointer hover:from-primary-700 hover:to-primary-800 transition-colors"
                      onClick={toggleBucket}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBucket()
                            }}
                            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-white" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-white" />
                            )}
                          </button>
                          <div className="bg-white/20 p-2 rounded-lg">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-2xl font-bold text-white">{monthKey}</h4>
                            <p className="text-sm text-primary-100 flex items-center space-x-1 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>Finalized on: {new Date(monthData.finalized_at).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-right">
                            <p className="text-xs text-primary-100 uppercase tracking-wide mb-1">Total Employees</p>
                            <p className="text-2xl font-bold text-white">{monthData.employees.length}</p>
                          </div>
                          <div className="bg-green-500/20 backdrop-blur-sm rounded-lg px-4 py-3 text-right">
                            <p className="text-xs text-green-100 uppercase tracking-wide mb-1">Total Salary</p>
                            <p className="text-2xl font-bold text-white">₹{monthData.total_salary.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setMonthToDelete(monthKey)
                              setShowDeleteFinalizedModal(true)
                            }}
                            className="btn-danger flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700"
                            title="Move this finalized salary report back to Confirmed Salaries"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Move to Confirmed</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Table Section - Collapsible */}
                    {isExpanded && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-md font-semibold text-gray-700">Employee Details</h5>
                        <button
                          onClick={() => {
                            // Delete permanently - different from "Move to Confirmed"
                            if (confirm(`Are you sure you want to permanently delete the ${monthKey} finalized salary report? This action cannot be undone.`)) {
                              const updatedFinalized = { ...finalizedSalaries }
                              delete updatedFinalized[monthKey]
                              setFinalizedSalaries(updatedFinalized)
                              localStorage.setItem('finalizedSalariesByMonth', JSON.stringify(updatedFinalized))
                              
                              // Remove from expanded state
                              const newExpanded = { ...expandedBuckets }
                              delete newExpanded[monthKey]
                              setExpandedBuckets(newExpanded)
                              localStorage.setItem('expandedBuckets', JSON.stringify(newExpanded))
                              
                              if (selectedFinalizedMonth === monthKey) {
                                setSelectedFinalizedMonth('')
                              }
                              
                              alert(`Successfully deleted ${monthKey} finalized salary report.`)
                            }
                          }}
                          className="btn-danger flex items-center space-x-2 px-3 py-2 text-sm bg-red-600 hover:bg-red-700"
                          title="Permanently delete this finalized salary report"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Employee ID
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Employee Name
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Total Hours
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Hour Rate
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Salary
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {monthData.employees.map((emp, index) => (
                              <tr 
                                key={emp.employee_id} 
                                className={`hover:bg-gray-50 transition-colors duration-150 ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                    {emp.employee_id}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-medium text-gray-900">{emp.employee_name}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-sm text-gray-700 font-medium">
                                    {getHHMM(emp)} <span className="text-gray-500 text-xs">hrs</span>
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-sm text-gray-700 font-medium">
                                    ₹{parseFloat(emp.hour_rate || 0).toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-sm font-bold text-green-600">
                                    ₹{parseFloat(emp.salary || 0).toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gradient-to-r from-green-50 to-green-100 border-t-2 border-green-200">
                              <td colSpan="4" className="px-6 py-4 text-right">
                                <span className="text-base font-bold text-gray-900">Grand Total Salary:</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="text-xl font-bold text-green-700">
                                  ₹{monthData.total_salary.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                    )}
                  </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Finalized Salaries</h3>
              <p className="text-gray-600 mb-4">
                Finalize confirmed salaries to view them here organized by month.
              </p>
              <button
                onClick={() => setActiveTab('confirmed')}
                className="btn-secondary"
              >
                Go to Confirmed Salaries
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Finalized Salary Confirmation Modal */}
      {showDeleteFinalizedModal && monthToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Move Back to Confirmed Salaries</h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to move the finalized salary report for <strong>{monthToDelete}</strong> back to Confirmed Salaries?
              </p>
              {finalizedSalaries[monthToDelete] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-blue-800">
                    This will move back to Confirmed Salaries:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                    <li>{finalizedSalaries[monthToDelete].employees.length} employee records</li>
                    <li>Total salary: ₹{finalizedSalaries[monthToDelete].total_salary.toFixed(2)}</li>
                  </ul>
                  <p className="text-sm text-blue-600 mt-2 font-semibold">
                    They will be available for editing and re-finalization.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteFinalizedModal(false)
                  setMonthToDelete('')
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Get the employees from the month to be deleted
                  const monthData = finalizedSalaries[monthToDelete]
                  if (!monthData) {
                    setShowDeleteFinalizedModal(false)
                    setMonthToDelete('')
                    return
                  }
                  
                  // Move employees back to confirmed salaries
                  setConfirmedSalaries(prev => {
                    // Merge with existing confirmed salaries, avoiding duplicates
                    const existingIds = prev.map(s => s.employee_id)
                    const newSalaries = monthData.employees.filter(emp => !existingIds.includes(emp.employee_id))
                    return [...prev, ...newSalaries]
                  })
                  
                  // Remove the month from finalized salaries
                  const updatedFinalized = { ...finalizedSalaries }
                  delete updatedFinalized[monthToDelete]
                  setFinalizedSalaries(updatedFinalized)
                  localStorage.setItem('finalizedSalariesByMonth', JSON.stringify(updatedFinalized))
                  
                  // Clear selected month if it was the deleted one
                  if (selectedFinalizedMonth === monthToDelete) {
                    setSelectedFinalizedMonth('')
                  }
                  
                  setShowDeleteFinalizedModal(false)
                  setMonthToDelete('')
                  alert(`Successfully moved ${monthData.employees.length} employees from ${monthToDelete} back to Confirmed Salaries.`)
                  
                  // Switch to confirmed tab to show the moved salaries
                  setActiveTab('confirmed')
                }}
                className="btn-danger"
              >
                Move to Confirmed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Manual User Modal */}
      {showAddManualUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingManualUser ? 'Edit Manual User' : 'Add Manual User'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={manualUserForm.employee_id}
                  onChange={(e) => setManualUserForm({ ...manualUserForm, employee_id: e.target.value })}
                  className="input-field"
                  placeholder="Enter employee ID"
                  disabled={!!editingManualUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualUserForm.employee_name}
                  onChange={(e) => setManualUserForm({ ...manualUserForm, employee_name: e.target.value })}
                  className="input-field"
                  placeholder="Enter employee name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Hours (HH:MM format) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualUserForm.total_hours}
                  onChange={(e) => {
                    let value = e.target.value
                    // Allow only digits and colon
                    value = value.replace(/[^\d:]/g, '')
                    // Limit to reasonable format
                    if (value.includes(':')) {
                      const parts = value.split(':')
                      if (parts[0] && parseInt(parts[0]) > 24) {
                        value = '24:' + (parts[1] || '')
                      }
                      if (parts[1] && parts[1].length > 2) {
                        value = parts[0] + ':' + parts[1].slice(0, 2)
                      }
                      if (parts[1] && parseInt(parts[1]) >= 60) {
                        value = parts[0] + ':59'
                      }
                    }
                    setManualUserForm({ ...manualUserForm, total_hours: value })
                  }}
                  className="input-field"
                  placeholder="8:30"
                />
                <p className="text-xs text-gray-500 mt-1">Format: HH:MM (e.g., 8:30 for 8 hours 30 minutes)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hour Rate (Optional)
                </label>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">₹</span>
                  <input
                    type="number"
                    value={manualUserForm.hour_rate}
                    onChange={(e) => setManualUserForm({ ...manualUserForm, hour_rate: e.target.value })}
                    className="input-field"
                    placeholder="Enter hour rate"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddManualUserModal(false)
                  setEditingManualUser(null)
                  setManualUserForm({
                    employee_id: '',
                    employee_name: '',
                    total_hours: '',
                    hour_rate: '',
                    is_manual: true
                  })
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!manualUserForm.employee_id || !manualUserForm.employee_name || !manualUserForm.total_hours) {
                    alert('Please fill all required fields')
                    return
                  }
                  
                  // Validate HH:MM format
                  if (!isValidHHMM(manualUserForm.total_hours)) {
                    alert('Invalid hours format. Please use HH:MM format (e.g., 8:30)')
                    return
                  }
                  
                  const newUser = {
                    employee_id: parseInt(manualUserForm.employee_id),
                    employee_name: manualUserForm.employee_name,
                    total_hours: manualUserForm.total_hours, // Store as HH:MM format
                    present_days: 0,
                    absent_days: 0,
                    auto_assigned_days: 0,
                    is_manual: true
                  }
                  
                  let updatedUsers
                  if (editingManualUser) {
                    // Update existing manual user
                    updatedUsers = manualUsers.map(u => 
                      u.employee_id === editingManualUser.employee_id ? newUser : u
                    )
                  } else {
                    // Check if ID already exists
                    if (manualUsers.find(u => u.employee_id === newUser.employee_id) || 
                        originalMonthlySummary.find(e => e.employee_id === newUser.employee_id)) {
                      alert('Employee ID already exists')
                      return
                    }
                    updatedUsers = [...manualUsers, newUser]
                  }
                  
                  setManualUsers(updatedUsers)
                  localStorage.setItem('manualUsers', JSON.stringify(updatedUsers))
                  
                  // Set hour rate if provided
                  if (manualUserForm.hour_rate) {
                    setHourRates({
                      ...hourRates,
                      [newUser.employee_id]: parseFloat(manualUserForm.hour_rate)
                    })
                  }
                  
                  setShowAddManualUserModal(false)
                  setEditingManualUser(null)
                  setManualUserForm({
                    employee_id: '',
                    employee_name: '',
                    total_hours: '',
                    hour_rate: '',
                    is_manual: true
                  })
                }}
                className="btn-primary"
              >
                {editingManualUser ? 'Update' : 'Add'} User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Calendar Modal */}
      {showUserCalendar && selectedUserForCalendar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUserCalendar(false)
              setSelectedUserForCalendar(null)
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedUserForCalendar.employee_name}
                </h3>
                <p className="text-sm text-primary-100 mt-1">
                  Employee ID: {selectedUserForCalendar.employee_id} | 
                  Total Hours: {getHHMM(selectedUserForCalendar)} hrs
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUserCalendar(false)
                  setSelectedUserForCalendar(null)
                }}
                className="text-white hover:text-gray-200 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                // Check if this is a manual user - they don't need daily_report from data
                const isManualUser = Boolean(selectedUserForCalendar?.is_manual)
                
                // For regular users, check if data and daily_report exist
                if (!isManualUser && (!data || !data.daily_report || !Array.isArray(data.daily_report))) {
                  return (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No daily attendance data available. Please process a file first.</p>
                    </div>
                  )
                }

                // Filter daily report for this user - handle both string and number employee_id
                const userId = selectedUserForCalendar.employee_id
                
                // For manual users, use their stored daily records
                let userDailyData
                if (isManualUser) {
                  userDailyData = manualUserDailyRecords[userId] || []
                } else {
                  // For regular users, use daily_report from data
                  userDailyData = data.daily_report.filter(record => {
                    const recordId = record.employee_id
                    // Handle both string and number comparison
                    return String(recordId) === String(userId) || Number(recordId) === Number(userId)
                  })
                }

                // For manual users, allow empty data - they can add records via calendar
                if (!isManualUser && (!userDailyData || userDailyData.length === 0)) {
                  return (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No daily attendance data available for this user.</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Employee ID: {userId} | Total Records: {data.daily_report.length}
                      </p>
                    </div>
                  )
                }

                // Group by date and create calendar view
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December']
                const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

                // Get year and month from data or current date
                // For manual users, use current month/year if data doesn't have it
                const year = data?.year || new Date().getFullYear()
                const month = data?.month || new Date().getMonth() + 1
                const monthName = months[month - 1]

                // Helper function to create date key in YYYY-MM-DD format (local timezone)
                const getDateKey = (date) => {
                  const y = date.getFullYear()
                  const m = String(date.getMonth() + 1).padStart(2, '0')
                  const d = String(date.getDate()).padStart(2, '0')
                  return `${y}-${m}-${d}`
                }

                // Create a map of date to attendance data
                const dateMap = new Map()
                
                userDailyData.forEach(record => {
                  try {
                    // Handle different date formats
                    let date
                    if (record.date instanceof Date) {
                      date = new Date(record.date.getFullYear(), record.date.getMonth(), record.date.getDate())
                    } else if (typeof record.date === 'string') {
                      // Try parsing string date
                      // First try ISO format or standard date string
                      date = new Date(record.date)
                      // If invalid, try YYYY-MM-DD format
                      if (isNaN(date.getTime())) {
                        const parts = record.date.split(/[-/]/)
                        if (parts.length === 3) {
                          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                        }
                      } else {
                        // Create date in local timezone to avoid UTC conversion issues
                        date = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                      }
                    } else {
                      date = new Date(record.date)
                      // Normalize to local date
                      date = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                    }
                    
                    if (!isNaN(date.getTime())) {
                      const dateKey = getDateKey(date)
                      dateMap.set(dateKey, record)
                    }
                  } catch (e) {
                    console.warn('Error parsing date:', record.date, e)
                  }
                })

                // Get first and last day of month
                const firstDay = new Date(year, month - 1, 1)
                const lastDay = new Date(year, month, 0)
                const daysInMonth = lastDay.getDate()
                const firstDayOfWeek = firstDay.getDay()

                // Generate calendar grid
                const calendarDays = []
                
                // Empty cells for days before month starts
                for (let i = 0; i < firstDayOfWeek; i++) {
                  calendarDays.push(null)
                }

                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month - 1, day)
                  const dateKey = getDateKey(date)
                  const attendanceData = dateMap.get(dateKey)
                  calendarDays.push({ day, date, attendanceData })
                }

                return (
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4">
                      {monthName} {year} - Daily Attendance Calendar
                    </h4>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-6">
                      {/* Week day headers */}
                      {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-700 py-2 bg-gray-100 rounded">
                          {day}
                        </div>
                      ))}

                      {/* Calendar days */}
                      {calendarDays.map((item, index) => {
                        if (!item) {
                          return <div key={`empty-${index}`} className="aspect-square" />
                        }

                        const { day, date, attendanceData } = item
                        const isToday = new Date().toDateString() === date.toDateString()
                        const hasData = !!attendanceData

                        // Determine status color
                        let bgColor = 'bg-gray-50'
                        let textColor = 'text-gray-400'
                        let borderColor = 'border-gray-200'
                        let statusText = 'No Data'
                        let workedHoursHHMM = '0:00' // Initialize workedHoursHHMM outside the if block
                        let workedMinutes = 0 // For comparison

                        if (hasData) {
                          const status = attendanceData.status?.toLowerCase() || ''
                          workedHoursHHMM = getHHMM(attendanceData) // Get HH:MM format
                          workedMinutes = hhmmToMinutes(workedHoursHHMM) // Convert to minutes for comparison

                          // Color coding: Present - green, Absent - red, Admin selected - blue, WFH - Yellow
                          if (status.includes('wfh') || status.includes('work from home')) {
                            bgColor = 'bg-yellow-50'
                            textColor = 'text-yellow-900'
                            borderColor = 'border-yellow-300'
                            statusText = 'WFH'
                          } else if (status.includes('admin') || status.includes('assigned') || status.includes('selected')) {
                            bgColor = 'bg-blue-50'
                            textColor = 'text-blue-900'
                            borderColor = 'border-blue-300'
                            statusText = 'Admin Selected'
                          } else if (status.includes('absent') || workedMinutes === 0) {
                            bgColor = 'bg-red-50'
                            textColor = 'text-red-900'
                            borderColor = 'border-red-300'
                            statusText = 'Absent'
                          } else if (status.includes('present') || workedMinutes > 0) {
                            bgColor = 'bg-green-50'
                            textColor = 'text-green-900'
                            borderColor = 'border-green-300'
                            statusText = 'Present'
                          } else {
                            bgColor = 'bg-gray-50'
                            textColor = 'text-gray-900'
                            borderColor = 'border-gray-300'
                            statusText = status || 'Recorded'
                          }
                        }

                        return (
                          <div
                            key={day}
                            onClick={() => {
                              setSelectedDayForEdit({ day, date, attendanceData, dateKey: getDateKey(date) })
                              // Convert HH:MM to separate hours and minutes for display
                              const hoursHHMM = getHHMM(attendanceData || {})
                              const parts = hoursHHMM.split(':')
                              const hours = parseInt(parts[0], 10) || 0
                              const minutes = parseInt(parts[1], 10) || 0
                              setEditDayForm({
                                status: attendanceData?.status || '',
                                hours: hours || '',
                                minutes: minutes || '',
                                date: getDateKey(date)
                              })
                              setShowEditDayModal(true)
                            }}
                            className={`aspect-square border-2 ${borderColor} ${bgColor} rounded-lg p-2 cursor-pointer hover:shadow-md transition-all relative group ${
                              isToday ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                            }`}
                            title={hasData ? `${attendanceData.date || date.toLocaleDateString()}: ${attendanceData.status || 'N/A'} - Click to edit` : 'No data - Click to add'}
                          >
                            {/* Edit icon on hover */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit2 className="w-3 h-3 text-gray-600" />
                            </div>
                            <div className="text-xs font-semibold text-gray-700 mb-1">{day}</div>
                            {hasData && (
                              <div className="text-xs space-y-0.5">
                                <div className={`font-bold ${textColor}`}>
                                  {workedHoursHHMM}
                                </div>
                                {attendanceData.punches && (
                                  <div className="text-xs text-gray-500 truncate" title={attendanceData.punches}>
                                    {attendanceData.punches.length > 10 
                                      ? attendanceData.punches.substring(0, 10) + '...' 
                                      : attendanceData.punches}
                                  </div>
                                )}
                              </div>
                            )}
                            {!hasData && (
                              <div className="text-xs text-gray-400">-</div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Detailed List */}
                    <div className="mt-6">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4">Detailed Attendance Records</h5>
                      {userDailyData.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 mb-2">No attendance records yet</p>
                          <p className="text-sm text-gray-500">Click on any day in the calendar above to add attendance records</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punches</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {userDailyData
                                .sort((a, b) => new Date(a.date) - new Date(b.date))
                                .map((record, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {new Date(record.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                      {record.punches || record.punch_info || '-'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                      {getHHMM(record)} hrs
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        record.status?.toLowerCase().includes('present') || hhmmToMinutes(getHHMM(record)) > 0
                                          ? 'bg-green-100 text-green-800'
                                          : record.status?.toLowerCase().includes('absent')
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {record.status || 'N/A'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Edit Day Modal */}
      {showEditDayModal && selectedDayForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Edit Attendance - Day {selectedDayForEdit.day}
              </h3>
              <button
                onClick={() => {
                  setShowEditDayModal(false)
                  setSelectedDayForEdit(null)
                  setEditDayForm({ status: '', hours: '', minutes: '', date: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="text"
                  value={new Date(selectedDayForEdit.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  disabled
                  className="input-field bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editDayForm.status}
                  onChange={(e) => setEditDayForm({ ...editDayForm, status: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="WFH">WFH (Work From Home)</option>
                  <option value="Admin Selected">Admin Selected</option>
                  <option value="System Assigned – Missing Punch-Out">System Assigned – Missing Punch-Out</option>
                  <option value="Punch Error – Auto Assigned">Punch Error – Auto Assigned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours Worked <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Hours</label>
                    <input
                      type="number"
                      value={editDayForm.hours}
                      onChange={(e) => {
                        let value = parseInt(e.target.value, 10) || 0
                        if (value < 0) value = 0
                        if (value > 24) value = 24
                        setEditDayForm({ ...editDayForm, hours: value === 0 ? '' : value })
                      }}
                      min="0"
                      max="24"
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <span className="text-gray-500 font-semibold">:</span>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Minutes</label>
                    <input
                      type="number"
                      value={editDayForm.minutes}
                      onChange={(e) => {
                        let value = parseInt(e.target.value, 10) || 0
                        if (value < 0) value = 0
                        if (value >= 60) value = 59
                        setEditDayForm({ ...editDayForm, minutes: value === 0 ? '' : value })
                      }}
                      min="0"
                      max="59"
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter hours and minutes separately (e.g., 8 hours and 30 minutes)
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditDayModal(false)
                    setSelectedDayForEdit(null)
                    setEditDayForm({ status: '', hours: '', minutes: '', date: '' })
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!editDayForm.status || (editDayForm.hours === '' && editDayForm.minutes === '')) {
                      alert('Please fill in Status and at least Hours or Minutes')
                      return
                    }

                    // Convert hours and minutes to decimal hours
                    const hoursValue = parseInt(editDayForm.hours, 10) || 0
                    const minutesValue = parseInt(editDayForm.minutes, 10) || 0
                    
                    // Validate minutes (should be 0-59)
                    if (minutesValue < 0 || minutesValue >= 60) {
                      alert('Minutes must be between 0 and 59')
                      return
                    }
                    
                    // Validate hours (should be 0-24)
                    if (hoursValue < 0 || hoursValue > 24) {
                      alert('Hours must be between 0 and 24')
                      return
                    }

                    // Convert to HH:MM format directly
                    const hoursHm = hoursMinutesToHHMM(hoursValue, minutesValue)
                    const dateKey = selectedDayForEdit.dateKey
                    const isManualUser = Boolean(selectedUserForCalendar?.is_manual)

                    // Helper function to create date key
                    const getDateKeyLocal = (date) => {
                      const d = date instanceof Date ? date : new Date(date)
                      const y = d.getFullYear()
                      const m = String(d.getMonth() + 1).padStart(2, '0')
                      const day = String(d.getDate()).padStart(2, '0')
                      return `${y}-${m}-${day}`
                    }

                    // Handle manual users separately
                    if (isManualUser) {
                      const userId = String(selectedUserForCalendar.employee_id)
                      const currentRecords = manualUserDailyRecords[userId] || []
                      
                      // Find if record exists for this date
                      const existingIndex = currentRecords.findIndex(record => {
                        const recordDateKey = getDateKeyLocal(new Date(record.date))
                        return recordDateKey === dateKey
                      })

                      let updatedRecords
                      if (existingIndex >= 0) {
                        // Update existing record
                        updatedRecords = [...currentRecords]
                        updatedRecords[existingIndex] = {
                          ...updatedRecords[existingIndex],
                          status: editDayForm.status,
                          worked_hours: hoursHm, // Store as HH:MM format
                          hours_hm: hoursHm,
                          date: selectedDayForEdit.date instanceof Date 
                            ? selectedDayForEdit.date.toISOString() 
                            : selectedDayForEdit.date
                        }
                      } else {
                        // Create new record
                        const newRecord = {
                          employee_id: selectedUserForCalendar.employee_id,
                          employee_name: selectedUserForCalendar.employee_name,
                          date: selectedDayForEdit.date instanceof Date 
                            ? selectedDayForEdit.date.toISOString() 
                            : selectedDayForEdit.date,
                          status: editDayForm.status,
                          worked_hours: hoursHm, // Store as HH:MM format
                          hours_hm: hoursHm,
                          punches: '',
                          punch_info: 'Admin Edited'
                        }
                        updatedRecords = [...currentRecords, newRecord]
                      }

                      // Update manual user daily records
                      const updatedManualRecords = {
                        ...manualUserDailyRecords,
                        [userId]: updatedRecords
                      }
                      setManualUserDailyRecords(updatedManualRecords)
                      localStorage.setItem('manualUserDailyRecords', JSON.stringify(updatedManualRecords))

                      // Recalculate monthly summary for this manual user
                      let totalHoursHHMM = '0:00'
                      let presentDays = 0
                      let absentDays = 0
                      let autoAssignedDays = 0

                      updatedRecords.forEach(record => {
                        const recordHoursHHMM = getHHMM(record) // Get HH:MM format
                        totalHoursHHMM = addHHMM(totalHoursHHMM, recordHoursHHMM)
                        const recordMinutes = hhmmToMinutes(recordHoursHHMM)
                        const status = (record.status || '').toLowerCase()
                        
                        if (status.includes('absent') || (recordMinutes === 0 && !status.includes('admin'))) {
                          absentDays++
                        } else if (status.includes('present') || (recordMinutes > 0 && !status.includes('wfh') && !status.includes('admin'))) {
                          presentDays++
                        } else if (status.includes('auto') || status.includes('assigned') || status.includes('admin') || status.includes('wfh')) {
                          autoAssignedDays++
                        }
                      })

                      // Update manual user in the list
                      const updatedManualUsers = manualUsers.map(u => {
                        if (String(u.employee_id) === userId) {
                          return {
                            ...u,
                            total_hours: totalHoursHHMM, // Store as HH:MM format
                            present_days: presentDays,
                            absent_days: absentDays,
                            auto_assigned_days: autoAssignedDays
                          }
                        }
                        return u
                      })

                      setManualUsers(updatedManualUsers)
                      localStorage.setItem('manualUsers', JSON.stringify(updatedManualUsers))

                      // Update selectedUserForCalendar to reflect new totals
                      const updatedUser = updatedManualUsers.find(u => String(u.employee_id) === userId)
                      if (updatedUser) {
                        setSelectedUserForCalendar(updatedUser)
                      }

                      alert(`Successfully updated attendance for Day ${selectedDayForEdit.day}. Monthly summary has been recalculated.`)
                      setShowEditDayModal(false)
                      setSelectedDayForEdit(null)
                      setEditDayForm({ status: '', hours: '', minutes: '', date: '' })
                      return
                    }

                    // Update the daily_report data for regular users
                    if (data && data.daily_report) {
                      const updatedDailyReport = data.daily_report.map(record => {
                        const recordDateKey = getDateKeyLocal(new Date(record.date))
                        if (recordDateKey === dateKey && 
                            String(record.employee_id) === String(selectedUserForCalendar.employee_id)) {
                          // Hours already converted to HH:MM format above

                          return {
                            ...record,
                            status: editDayForm.status,
                            worked_hours: hoursHm, // Store as HH:MM format
                            hours_hm: hoursHm
                          }
                        }
                        return record
                      })

                      // Check if record exists, if not create new one
                      const existingRecord = updatedDailyReport.find(record => {
                        const recordDateKey = getDateKeyLocal(new Date(record.date))
                        return recordDateKey === dateKey && 
                               String(record.employee_id) === String(selectedUserForCalendar.employee_id)
                      })

                      if (!existingRecord) {
                        // Create new record
                        const newRecord = {
                          employee_id: selectedUserForCalendar.employee_id,
                          employee_name: selectedUserForCalendar.employee_name,
                          date: selectedDayForEdit.date,
                          status: editDayForm.status,
                          worked_hours: hoursHm, // Store as HH:MM format
                          hours_hm: hoursHm,
                          punches: '',
                          punch_info: 'Admin Edited'
                        }
                        updatedDailyReport.push(newRecord)
                      }

                      // Recalculate monthly summary for ALL employees based on updated daily report
                      const employeeId = selectedUserForCalendar.employee_id
                      
                      // Group records by employee
                      const employeeRecordsMap = new Map()
                      updatedDailyReport.forEach(record => {
                        const empId = String(record.employee_id)
                        if (!employeeRecordsMap.has(empId)) {
                          employeeRecordsMap.set(empId, [])
                        }
                        employeeRecordsMap.get(empId).push(record)
                      })
                      
                      // Recalculate summary for all employees
                      const updatedMonthlySummary = data.monthly_summary.map(emp => {
                        const empId = String(emp.employee_id)
                        const userRecords = employeeRecordsMap.get(empId) || []
                        
                        if (userRecords.length > 0) {
                          let totalHoursHHMM = '0:00'
                          let presentDays = 0
                          let absentDays = 0
                          let autoAssignedDays = 0
                          
                          userRecords.forEach(record => {
                            const recordHoursHHMM = getHHMM(record) // Get HH:MM format
                            totalHoursHHMM = addHHMM(totalHoursHHMM, recordHoursHHMM)
                            const recordMinutes = hhmmToMinutes(recordHoursHHMM)
                            const status = (record.status || '').toLowerCase()
                            
                            if (status.includes('absent') || (recordMinutes === 0 && !status.includes('admin'))) {
                              absentDays++
                            } else if (status.includes('present') || (recordMinutes > 0 && !status.includes('wfh') && !status.includes('admin'))) {
                              presentDays++
                            } else if (status.includes('auto') || status.includes('assigned') || status.includes('admin') || status.includes('wfh')) {
                              autoAssignedDays++
                            }
                          })
                          
                          return {
                            ...emp,
                            total_hours: totalHoursHHMM, // Store as HH:MM format
                            present_days: presentDays,
                            absent_days: absentDays,
                            auto_assigned_days: autoAssignedDays,
                            total_hours_hm: totalHoursHHMM
                          }
                        }
                        return emp
                      })
                      
                      // Recalculate overall statistics
                      const totalEmployees = updatedMonthlySummary.length
                      const totalHoursAll = updatedMonthlySummary.reduce((sum, emp) => sum + parseFloat(emp.total_hours || 0), 0)
                      const totalPresentDays = updatedMonthlySummary.reduce((sum, emp) => sum + (emp.present_days || 0), 0)
                      const totalAbsentDays = updatedMonthlySummary.reduce((sum, emp) => sum + (emp.absent_days || 0), 0)
                      const totalAutoAssignedDays = updatedMonthlySummary.reduce((sum, emp) => sum + (emp.auto_assigned_days || 0), 0)
                      const totalRecords = updatedDailyReport.length
                      const avgHoursPerEmployee = totalEmployees > 0 ? totalHoursAll / totalEmployees : 0
                      const avgPresentDays = totalEmployees > 0 ? totalPresentDays / totalEmployees : 0

                      // Update data state with recalculated values
                      const updatedData = {
                        ...data,
                        daily_report: updatedDailyReport,
                        monthly_summary: updatedMonthlySummary,
                        statistics: {
                          total_hours: totalHoursAll,
                          total_employees: totalEmployees,
                          total_records: totalRecords,
                          present_days: totalPresentDays,
                          absent_days: totalAbsentDays,
                          auto_assigned_days: totalAutoAssignedDays,
                          avg_hours_per_employee: avgHoursPerEmployee,
                          avg_present_days: avgPresentDays
                        }
                      }
                      setData(updatedData)
                      
                      // Save to localStorage
                      localStorage.setItem('lastProcessResult', JSON.stringify(updatedData))

                      // Update selectedUserForCalendar to reflect new totals
                      const updatedUser = updatedMonthlySummary.find(emp => 
                        String(emp.employee_id) === String(employeeId)
                      )
                      if (updatedUser) {
                        setSelectedUserForCalendar(updatedUser)
                      }

                      alert(`Successfully updated attendance for Day ${selectedDayForEdit.day}. Monthly summary has been recalculated.`)
                      setShowEditDayModal(false)
                      setSelectedDayForEdit(null)
                      setEditDayForm({ status: '', hours: '', minutes: '', date: '' })
                    }
                  }}
                  className="flex-1 btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

