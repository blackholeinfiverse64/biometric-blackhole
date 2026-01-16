import { useState, useEffect } from 'react'
import { Download, FileText, Users, Clock, TrendingUp } from 'lucide-react'
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

      {/* Monthly Summary Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auto-Assigned
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthly_summary.map((emp) => {
                const rate = parseFloat(hourRates[emp.employee_id]) || 0
                const salary = parseFloat(emp.total_hours) * rate
                return (
                  <tr key={emp.employee_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {emp.employee_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {emp.employee_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {emp.present_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {emp.absent_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {emp.auto_assigned_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {parseFloat(emp.total_hours).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={hourRates[emp.employee_id] || ''}
                        onChange={(e) => {
                          setHourRates({
                            ...hourRates,
                            [emp.employee_id]: e.target.value
                          })
                        }}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {rate > 0 ? salary.toFixed(2) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {Object.keys(hourRates).length > 0 && Object.values(hourRates).some(rate => rate && parseFloat(rate) > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Salary:</span>
              <span className="text-xl font-bold text-green-600">
                {monthly_summary.reduce((sum, emp) => {
                  const rate = parseFloat(hourRates[emp.employee_id]) || 0
                  return sum + (parseFloat(emp.total_hours) * rate)
                }, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

