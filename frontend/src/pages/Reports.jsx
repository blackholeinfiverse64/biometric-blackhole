import { useState, useEffect } from 'react'
import { Download, FileText, Users, Clock, TrendingUp, CheckCircle, Trash2, Save, Calendar } from 'lucide-react'
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
  const [confirmedSalaries, setConfirmedSalaries] = useState([]) // Array of confirmed salaries
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

  useEffect(() => {
    const stored = localStorage.getItem('lastProcessResult')
    if (stored) {
      setData(JSON.parse(stored))
      if (JSON.parse(stored).monthly_summary?.length > 0) {
        setSelectedEmployee(JSON.parse(stored).monthly_summary[0])
      }
    }
  }, [])

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

  const { monthly_summary, daily_report, statistics } = data

  // Prepare chart data
  const topEmployees = monthly_summary
    .sort((a, b) => b.total_hours - a.total_hours)
    .slice(0, 10)
    .map((emp) => ({
      name: emp.employee_name,
      hours: parseFloat(emp.total_hours),
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
              <p className="text-3xl font-bold">{statistics.total_hours.toFixed(2)}</p>
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
              <p className="text-3xl font-bold">{statistics.avg_hours_per_employee.toFixed(2)}</p>
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
                {parseFloat(selectedEmployee.total_hours).toFixed(2)}
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
                const salary = parseFloat(emp.total_hours) * rate
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {emp.employee_name}
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
                      {emp.present_days} days
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {emp.absent_days} days
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {parseFloat(emp.total_hours).toFixed(2)} hrs
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {hasSalary ? `₹${salary.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
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
                    const salary = parseFloat(emp.total_hours) * rate
                    return {
                      employee_id: emp.employee_id,
                      employee_name: emp.employee_name,
                      total_hours: parseFloat(emp.total_hours),
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
                    const salary = parseFloat(emp.total_hours) * rate
                    return {
                      employee_id: emp.employee_id,
                      employee_name: emp.employee_name,
                      total_hours: parseFloat(emp.total_hours),
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
                  return sum + (parseFloat(emp.total_hours) * rate)
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
                            {parseFloat(emp.total_hours || 0).toFixed(2)} hrs
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
                                    total_hours: emp.total_hours || '',
                                    hour_rate: emp.hour_rate || '',
                                    salary: emp.salary || ''
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
                      
                      // Get current month/year from data
                      const currentDate = new Date()
                      const monthKey = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                      
                      // Save to finalized salaries organized by month
                      const updatedFinalized = {
                        ...finalizedSalaries,
                        [monthKey]: {
                          month: currentDate.getMonth() + 1,
                          year: currentDate.getFullYear(),
                          finalized_at: new Date().toISOString(),
                          employees: confirmedSalaries,
                          total_salary: confirmedSalaries.reduce((sum, emp) => sum + emp.salary, 0)
                        }
                      }
                      
                      setFinalizedSalaries(updatedFinalized)
                      localStorage.setItem('finalizedSalariesByMonth', JSON.stringify(updatedFinalized))
                      
                      // Clear all report data after finalizing
                      setConfirmedSalaries([])
                      setData(null)
                      setHourRates({})
                      setSelectedEmployees({})
                      setSelectedEmployee(null)
                      
                      // Clear processed data from localStorage
                      localStorage.removeItem('processedReportData')
                      localStorage.removeItem('hourRates')
                      
                      alert(`Successfully finalized salaries for ${confirmedSalaries.length} employees for ${monthKey}! All report data has been cleared.`)
                      
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
                    Total Hours
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={editFormData.total_hours}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value) || 0
                        const rate = parseFloat(editFormData.hour_rate) || 0
                        setEditFormData({
                          ...editFormData,
                          total_hours: e.target.value,
                          salary: (hours * rate).toFixed(2)
                        })
                      }}
                      min="0"
                      step="0.01"
                      className="flex-1 input-field"
                      placeholder="Enter hours"
                    />
                    <span className="text-sm text-gray-600">hrs</span>
                  </div>
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
                        const hours = parseFloat(editFormData.total_hours) || 0
                        setEditFormData({
                          ...editFormData,
                          hour_rate: e.target.value,
                          salary: (hours * rate).toFixed(2)
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
                        const hours = parseFloat(editFormData.total_hours) || 0
                        const rate = hours > 0 ? (salary / hours).toFixed(2) : 0
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
                      return {
                        ...emp,
                        total_hours: parseFloat(editFormData.total_hours) || 0,
                        hour_rate: parseFloat(editFormData.hour_rate) || 0,
                        salary: parseFloat(editFormData.salary) || 0
                      }
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
                          doc.text(`${parseFloat(emp.total_hours || 0).toFixed(2)} hrs`, tableStartX + 75, yPos)
                          
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
              ).map(([monthKey, monthData]) => (
                  <div key={monthKey} className="bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Header Section with Gradient */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
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
                        <div className="flex items-center space-x-4">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-right">
                            <p className="text-xs text-primary-100 uppercase tracking-wide mb-1">Total Employees</p>
                            <p className="text-2xl font-bold text-white">{monthData.employees.length}</p>
                          </div>
                          <div className="bg-green-500/20 backdrop-blur-sm rounded-lg px-4 py-3 text-right">
                            <p className="text-xs text-green-100 uppercase tracking-wide mb-1">Total Salary</p>
                            <p className="text-2xl font-bold text-white">₹{monthData.total_salary.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => {
                              setMonthToDelete(monthKey)
                              setShowDeleteFinalizedModal(true)
                            }}
                            className="btn-danger flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700"
                            title="Delete this finalized salary report"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Table Section */}
                    <div className="p-6">
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
                                    {parseFloat(emp.total_hours || 0).toFixed(2)} <span className="text-gray-500 text-xs">hrs</span>
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
                  </div>
                ))}
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Finalized Salary</h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the finalized salary report for <strong>{monthToDelete}</strong>?
              </p>
              {finalizedSalaries[monthToDelete] && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-red-800">
                    This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                    <li>{finalizedSalaries[monthToDelete].employees.length} employee records</li>
                    <li>Total salary: ₹{finalizedSalaries[monthToDelete].total_salary.toFixed(2)}</li>
                  </ul>
                </div>
              )}
              <p className="text-sm text-gray-600 mt-3">
                This action cannot be undone.
              </p>
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
                  // Delete the month from finalized salaries
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
                  alert(`Successfully deleted finalized salary report for ${monthToDelete}`)
                }}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

