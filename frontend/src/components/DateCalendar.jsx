import { useState } from 'react'
import { Calendar as CalendarIcon, X } from 'lucide-react'

export default function DateCalendar({ year, month, selectedDates, onDatesChange }) {
  const [isOpen, setIsOpen] = useState(false)

  // Get days in the month
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

  const toggleDate = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const newDates = selectedDates.includes(dateStr)
      ? selectedDates.filter(d => d !== dateStr)
      : [...selectedDates, dateStr]
    onDatesChange(newDates)
  }

  const clearAll = () => {
    onDatesChange([])
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full input-field flex items-center justify-between cursor-pointer"
      >
        <span className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4" />
          <span>
            {selectedDates.length === 0
              ? 'Select dates (8 hours for all)'
              : `${selectedDates.length} date${selectedDates.length !== 1 ? 's' : ''} selected`}
          </span>
        </span>
        {selectedDates.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              clearAll()
            }}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {monthNames[month - 1]} {year}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isSelected = selectedDates.includes(dateStr)
                const isToday = new Date().toISOString().split('T')[0] === dateStr

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDate(day)}
                    className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : isToday
                        ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Selected dates summary */}
            {selectedDates.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Selected Dates:</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedDates
                    .sort()
                    .map(dateStr => {
                      const date = new Date(dateStr)
                      return (
                        <span
                          key={dateStr}
                          className="inline-flex items-center px-2 py-1 rounded bg-primary-50 text-primary-700 text-xs"
                        >
                          {date.getDate()} {monthNames[date.getMonth()].substring(0, 3)}
                          <button
                            type="button"
                            onClick={() => toggleDate(date.getDate())}
                            className="ml-1 text-primary-500 hover:text-primary-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )
                    })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These dates will be marked as 8 hours for all employees and excluded from absent days.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

