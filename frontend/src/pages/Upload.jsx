import { useState } from 'react'
import { Upload as UploadIcon, File, Calendar, X, Download, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import DateCalendar from '../components/DateCalendar'
import config from '../config'

export default function Upload() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [selectedDates, setSelectedDates] = useState([])
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)')
        setFile(null)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setProcessing(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('year', year)
    formData.append('month', month)
    formData.append('selected_dates', JSON.stringify(selectedDates))

    try {
      const response = await axios.post(config.getApiUrl('/api/process'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setResult(response.data)
      // Store result in localStorage for reports page
      localStorage.setItem('lastProcessResult', JSON.stringify(response.data))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process file. Please try again.')
      console.error('Error:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (result?.output_file) {
      const filename = result.output_file.split(/[/\\]/).pop()
      window.open(config.getApiUrl(`/api/download?filename=${filename}`), '_blank')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Attendance File</h1>
        <p className="text-gray-600">Process your biometric attendance data with intelligent automation</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
              <div className="space-y-1 text-center">
                {file ? (
                  <div className="flex items-center justify-center space-x-2 text-primary-600">
                    <File className="w-8 h-8" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">Excel files only (.xlsx, .xls)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => {
                  setYear(parseInt(e.target.value))
                  setSelectedDates([]) // Clear selected dates when year changes
                }}
                className="input-field"
                min="2020"
                max="2030"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Month
              </label>
              <select
                value={month}
                onChange={(e) => {
                  setMonth(parseInt(e.target.value))
                  setSelectedDates([]) // Clear selected dates when month changes
                }}
                className="input-field"
                required
              >
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Selection Calendar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Select Dates (8 hours for all employees)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Select dates that should be marked as 8 hours for all employees and excluded from absent days (e.g., holidays, company events)
            </p>
            <DateCalendar
              year={year}
              month={month}
              selectedDates={selectedDates}
              onDatesChange={setSelectedDates}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={processing || !file}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <UploadIcon className="w-5 h-5" />
                <span>Process Attendance File</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-green-900 mb-2">
                ✓ Processing Complete!
              </h3>
              <p className="text-green-700">
                Successfully processed {result.statistics.total_employees} employees
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Report</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.statistics.total_hours.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.statistics.total_records}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Present Days</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.statistics.present_days}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Absent Days</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.statistics.absent_days}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/reports')}
            className="mt-6 w-full btn-secondary"
          >
            View Detailed Reports
          </button>
        </div>
      )}
    </div>
  )
}

