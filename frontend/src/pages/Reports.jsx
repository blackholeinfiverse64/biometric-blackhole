import { useState, useEffect } from 'react'
import { Download, FileText, Users, Clock, TrendingUp, CheckCircle, Trash2, Save } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('summary') // 'summary' or 'confirmed'
  const [confirmedSalaries, setConfirmedSalaries] = useState([]) // Array of confirmed salaries
  const [selectedEmployees, setSelectedEmployees] = useState({}) // Object with employee_id as key for selection
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEmployeeForAction, setSelectedEmployeeForAction] = useState(null)
  const [editFormData, setEditFormData] = useState({ total_hours: '', hour_rate: '', salary: '' })

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
      window.open(`/api/download?filename=${filename}`, '_blank')
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
                      // You can add additional logic here like saving to backend
                      alert(`Finalizing salaries for ${confirmedSalaries.length} employees`)
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
    </div>
  )
}

