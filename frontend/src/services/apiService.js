import { authFetch } from '../lib/auth'

// --- Attendance Reports ---

export const saveAttendanceReport = async (reportData) => {
  const res = await authFetch('/api/data/attendance-reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  })
  if (!res.ok) throw new Error('Failed to save attendance report')
  return await res.json()
}

export const getAttendanceReport = async (year, month) => {
  const res = await authFetch(`/api/data/attendance-reports?year=${year}&month=${month}`)
  if (!res.ok) throw new Error('Failed to get attendance report')
  return await res.json()
}

// --- Manual Users ---

export const saveManualUsers = async (users) => {
  const res = await authFetch('/api/data/manual-users', {
    method: 'POST',
    body: JSON.stringify(users),
  })
  if (!res.ok) throw new Error('Failed to save manual users')
  return await res.json()
}

export const getManualUsers = async () => {
  const res = await authFetch('/api/data/manual-users')
  if (!res.ok) throw new Error('Failed to get manual users')
  return await res.json()
}

// --- Finalized Salaries ---

export const saveFinalizedSalaries = async (finalizedSalaries) => {
  const res = await authFetch('/api/data/finalized-salaries', {
    method: 'POST',
    body: JSON.stringify(finalizedSalaries),
  })
  if (!res.ok) throw new Error('Failed to save finalized salaries')
  return await res.json()
}

export const getFinalizedSalaries = async () => {
  const res = await authFetch('/api/data/finalized-salaries')
  if (!res.ok) throw new Error('Failed to get finalized salaries')
  return await res.json()
}

// --- Hour Rates ---

export const saveHourRates = async (hourRates) => {
  const res = await authFetch('/api/data/hour-rates', {
    method: 'POST',
    body: JSON.stringify(hourRates),
  })
  if (!res.ok) throw new Error('Failed to save hour rates')
  return await res.json()
}

export const getHourRates = async () => {
  const res = await authFetch('/api/data/hour-rates')
  if (!res.ok) throw new Error('Failed to get hour rates')
  return await res.json()
}

// --- Confirmed Salaries ---

export const saveConfirmedSalaries = async (confirmedSalaries) => {
  const res = await authFetch('/api/data/confirmed-salaries', {
    method: 'POST',
    body: JSON.stringify(confirmedSalaries),
  })
  if (!res.ok) throw new Error('Failed to save confirmed salaries')
  return await res.json()
}

export const getConfirmedSalaries = async () => {
  const res = await authFetch('/api/data/confirmed-salaries')
  if (!res.ok) throw new Error('Failed to get confirmed salaries')
  return await res.json()
}

// --- Manual User Daily Records ---

export const saveManualUserDailyRecords = async (dailyRecords) => {
  const res = await authFetch('/api/data/manual-user-daily-records', {
    method: 'POST',
    body: JSON.stringify(dailyRecords),
  })
  if (!res.ok) throw new Error('Failed to save daily records')
  return await res.json()
}

export const getManualUserDailyRecords = async () => {
  const res = await authFetch('/api/data/manual-user-daily-records')
  if (!res.ok) throw new Error('Failed to get daily records')
  return await res.json()
}

// --- Clear All Data (before new upload) ---

export const clearAllData = async () => {
  const res = await authFetch('/api/data/clear-all', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to clear data')
  return await res.json()
}

// --- Last Process Result ---

export const saveLastProcessResult = async (reportData) => {
  const year = reportData.year || new Date().getFullYear()
  const month = reportData.month || new Date().getMonth() + 1

  try {
    const res = await authFetch('/api/data/attendance-reports', {
      method: 'POST',
      body: JSON.stringify({
        year,
        month,
        daily_report: reportData.daily_report || [],
        monthly_summary: reportData.monthly_summary || [],
        statistics: reportData.statistics || {},
      }),
    })

    if (!res.ok) {
      console.warn('API save failed, using localStorage fallback')
      localStorage.setItem('lastProcessResult', JSON.stringify(reportData))
      return null
    }

    localStorage.removeItem('lastProcessResult')
    return await res.json()
  } catch (error) {
    console.error('Error saving process result:', error)
    localStorage.setItem('lastProcessResult', JSON.stringify(reportData))
    return null
  }
}

export const getLastProcessResult = async () => {
  try {
    const res = await authFetch('/api/data/last-process-result')
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('Error getting last process result:', error)
    return null
  }
}
