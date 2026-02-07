import { supabase } from '../lib/supabase'

// Get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id
}

// Attendance Reports
export const saveAttendanceReport = async (reportData) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('attendance_reports')
    .upsert({
      user_id: userId,
      year: reportData.year,
      month: reportData.month,
      daily_report: reportData.daily_report,
      monthly_summary: reportData.monthly_summary,
      statistics: reportData.statistics,
      output_file: reportData.output_file,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,year,month'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getAttendanceReport = async (year, month) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('attendance_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Helper: Convert HH:MM string to decimal hours for storage
const hhmmToDecimal = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string') return 0
  const parts = hhmm.trim().split(':')
  if (parts.length !== 2) {
    // Try parsing as decimal number
    const num = parseFloat(hhmm)
    return isNaN(num) ? 0 : num
  }
  const hours = parseInt(parts[0], 10) || 0
  const minutes = parseInt(parts[1], 10) || 0
  // Convert to decimal: 8:30 -> 8.5 (not 8.30!)
  return hours + (minutes / 60)
}

// Manual Users
export const saveManualUsers = async (users) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Delete existing and insert new
  await supabase.from('manual_users').delete().eq('user_id', userId)
  
  if (users.length > 0) {
    const usersWithUserId = users.map(user => ({
      user_id: userId,
      employee_id: user.employee_id,
      employee_name: user.employee_name,
      // Properly convert HH:MM to decimal hours for storage
      total_hours: typeof user.total_hours === 'string' ? hhmmToDecimal(user.total_hours) : (user.total_hours || 0),
      hour_rate: user.hour_rate ? parseFloat(user.hour_rate) : null,
      present_days: user.present_days || 0,
      absent_days: user.absent_days || 0,
      auto_assigned_days: user.auto_assigned_days || 0,
      daily_records: user.daily_records || [],
    }))
    
    const { error } = await supabase
      .from('manual_users')
      .insert(usersWithUserId)
    
    if (error) throw error
  }
}

export const getManualUsers = async () => {
  const userId = await getUserId()
  if (!userId) {
    console.warn('⚠️ getManualUsers: User not authenticated')
    throw new Error('User not authenticated')
  }

  console.log(`📥 Fetching manual users for user: ${userId}`)
  const { data, error } = await supabase
    .from('manual_users')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Error fetching manual users:', error)
    throw error
  }
  
  console.log(`✅ Fetched ${data?.length || 0} manual users from Supabase`)
  
  // Convert total_hours back to HH:MM format if needed
  // If stored as decimal (e.g., 25.0), convert to HH:MM (e.g., "25:00")
  // If already in HH:MM format, keep as is
  const formatted = (data || []).map(user => {
    let totalHours = user.total_hours
    
    // If it's a number (decimal), convert to HH:MM format
    if (typeof totalHours === 'number') {
      const hours = Math.floor(totalHours)
      const minutes = Math.round((totalHours - hours) * 60)
      totalHours = `${hours}:${String(minutes).padStart(2, '0')}`
    } else if (typeof totalHours === 'string' && !totalHours.includes(':')) {
      // If it's a string number, convert to HH:MM
      const num = parseFloat(totalHours) || 0
      const hours = Math.floor(num)
      const minutes = Math.round((num - hours) * 60)
      totalHours = `${hours}:${String(minutes).padStart(2, '0')}`
    }
    
    return {
      ...user,
      is_manual: true, // Add flag for manual users
      total_hours: totalHours, // Now in HH:MM format
    }
  })
  
  console.log('📋 Formatted manual users:', formatted.map(u => ({
    id: u.employee_id,
    name: u.employee_name,
    total_hours: u.total_hours
  })))
  
  return formatted
}

// Finalized Salaries
export const saveFinalizedSalaries = async (finalizedSalaries) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Convert object to array and save
  const entries = Object.entries(finalizedSalaries).map(([monthKey, data]) => ({
    user_id: userId,
    month_key: monthKey,
    month: data.month,
    year: data.year,
    employees: data.employees,
    total_salary: data.total_salary,
    finalized_at: data.finalized_at,
  }))

  // Delete existing and insert new
  await supabase.from('finalized_salaries').delete().eq('user_id', userId)
  
  if (entries.length > 0) {
    const { error } = await supabase
      .from('finalized_salaries')
      .insert(entries)
    
    if (error) throw error
  }
}

export const getFinalizedSalaries = async () => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('finalized_salaries')
    .select('*')
    .eq('user_id', userId)
    .order('finalized_at', { ascending: false })

  if (error) throw error
  
  // Convert array back to object
  const result = {}
  data.forEach(item => {
    result[item.month_key] = {
      month: item.month,
      year: item.year,
      finalized_at: item.finalized_at,
      employees: item.employees,
      total_salary: item.total_salary,
    }
  })
  
  return result
}

// Hour Rates
export const saveHourRates = async (hourRates) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const entries = Object.entries(hourRates).map(([employeeId, rate]) => ({
    user_id: userId,
    employee_id: parseInt(employeeId),
    hour_rate: parseFloat(rate),
  }))

  if (entries.length > 0) {
    const { error } = await supabase
      .from('hour_rates')
      .upsert(entries, { onConflict: 'user_id,employee_id' })
    
    if (error) throw error
  }
}

export const getHourRates = async () => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('hour_rates')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  
  const result = {}
  data.forEach(item => {
    result[item.employee_id] = item.hour_rate
  })
  
  return result
}

// Confirmed Salaries
export const saveConfirmedSalaries = async (confirmedSalaries) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Delete existing and insert new
  await supabase.from('confirmed_salaries').delete().eq('user_id', userId)
  
  if (confirmedSalaries.length > 0) {
    const entries = confirmedSalaries.map(salary => ({
      user_id: userId,
      employee_id: salary.employee_id,
      employee_name: salary.employee_name,
      total_hours: salary.total_hours,
      hour_rate: salary.hour_rate,
      salary: salary.salary,
      confirmed_at: salary.confirmed_at || new Date().toISOString(),
    }))
    
    const { error } = await supabase
      .from('confirmed_salaries')
      .insert(entries)
    
    if (error) throw error
  }
}

export const getConfirmedSalaries = async () => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('confirmed_salaries')
    .select('*')
    .eq('user_id', userId)
    .order('confirmed_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Manual User Daily Records (stored as JSONB in manual_users table)
export const saveManualUserDailyRecords = async (dailyRecords) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Get all manual users for this user
  const { data: manualUsers, error: fetchError } = await supabase
    .from('manual_users')
    .select('id, employee_id')
    .eq('user_id', userId)

  if (fetchError) throw fetchError

  // Update each manual user with their daily records
  for (const [employeeId, records] of Object.entries(dailyRecords)) {
    const employeeIdNum = parseInt(employeeId)
    const manualUser = manualUsers.find(u => 
      u.employee_id === employeeIdNum || String(u.employee_id) === String(employeeId)
    )
    
    if (manualUser) {
      const { error } = await supabase
        .from('manual_users')
        .update({ 
          daily_records: records,
          updated_at: new Date().toISOString()
        })
        .eq('id', manualUser.id)
      
      if (error) {
        console.error(`Error updating daily records for employee ${employeeId}:`, error)
        throw error
      }
      console.log(`✅ Saved daily records for employee ${employeeId}: ${records.length} records`)
    } else {
      console.warn(`⚠️ Manual user with employee_id ${employeeId} not found in database. Records not saved.`)
      // Don't throw error, just log warning - the user might have been deleted
    }
  }
}

export const getManualUserDailyRecords = async () => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('manual_users')
    .select('employee_id, daily_records')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching manual user daily records:', error)
    throw error
  }
  
  const result = {}
  if (data && Array.isArray(data)) {
    data.forEach(item => {
      // Handle both string and number employee_id - use string as key for consistency
      const empId = String(item.employee_id)
      if (item.daily_records && Array.isArray(item.daily_records)) {
        result[empId] = item.daily_records
      } else {
        // Initialize with empty array if no records exist yet
        result[empId] = []
      }
    })
    console.log(`✅ Loaded daily records for ${Object.keys(result).length} manual users`)
  }
  
  return result
}

// Save last process result (attendance report data)
export const saveLastProcessResult = async (reportData) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Extract year and month from reportData if available
  const year = reportData.year || new Date().getFullYear()
  const month = reportData.month || new Date().getMonth() + 1

  try {
    const { data, error } = await supabase
      .from('attendance_reports')
      .upsert({
        user_id: userId,
        year: year,
        month: month,
        daily_report: reportData.daily_report || [],
        monthly_summary: reportData.monthly_summary || [],
        statistics: reportData.statistics || {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,year,month'
      })
      .select()
      .single()

    if (error) {
      // If table doesn't exist (406 error), save to user-specific localStorage
      if (error.status === 406 || error.code === '42P01') {
        console.warn('Supabase table not available, using localStorage fallback')
        const userKey = `lastProcessResult_${userId}`
        localStorage.setItem(userKey, JSON.stringify(reportData))
        return null
      }
      throw error
    }
    
    // Clear user-specific localStorage after successful Supabase save
    const userKey = `lastProcessResult_${userId}`
    localStorage.removeItem(userKey)
    localStorage.removeItem('lastProcessResult') // Also clear old global key
    
    return data
  } catch (error) {
    // Fallback to user-specific localStorage
    console.error('Error saving to Supabase, using localStorage:', error)
    const userKey = `lastProcessResult_${userId}`
    localStorage.setItem(userKey, JSON.stringify(reportData))
    return null
  }
}

export const getLastProcessResult = async () => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  try {
    // Get the most recent attendance report
    const { data, error } = await supabase
      .from('attendance_reports')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() // Use maybeSingle instead of single to avoid error if no rows

    // If table doesn't exist or RLS blocks, return null gracefully
    if (error) {
      // 406 = Not Acceptable (usually means table doesn't exist or RLS issue)
      // PGRST116 = No rows returned (this is OK)
      if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 406) {
        console.warn('Attendance reports table may not exist or RLS is blocking:', error.message)
        return null
      }
      throw error
    }
    
    if (data) {
      return {
        daily_report: data.daily_report || [],
        monthly_summary: data.monthly_summary || [],
        statistics: data.statistics || {},
        year: data.year,
        month: data.month,
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting last process result:', error)
    return null
  }
}

// Paid Employees (tracks which employees have been paid for each month)
export const savePaidEmployees = async (paidEmployees) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Always save to localStorage as backup
  try {
    localStorage.setItem(`paidEmployees_${userId}`, JSON.stringify(paidEmployees))
  } catch (e) {
    console.warn('Could not save to localStorage:', e)
  }

  // Convert object to array format for storage
  const entries = Object.entries(paidEmployees).map(([monthKey, employeeIds]) => ({
    user_id: userId,
    month_key: monthKey,
    employee_ids: employeeIds, // Array of employee IDs
  }))

  // Delete existing and insert new
  const { error: deleteError } = await supabase.from('paid_employees').delete().eq('user_id', userId)
  
  if (deleteError) {
    // If table doesn't exist, localStorage fallback is already saved
    if (deleteError.code === '42P01' || deleteError.message?.includes('does not exist')) {
      console.warn('paid_employees table does not exist, using localStorage fallback')
      return
    }
    console.error('Error deleting paid employees:', deleteError)
  }
  
  if (entries.length > 0) {
    const { error } = await supabase
      .from('paid_employees')
      .insert(entries)
    
    if (error) {
      // If table doesn't exist, localStorage fallback is already saved
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('paid_employees table does not exist, using localStorage fallback')
        return
      }
      console.error('Error inserting paid employees:', error)
    }
  }
}

export const getPaidEmployees = async () => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Try Supabase first
  const { data, error } = await supabase
    .from('paid_employees')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    // If table doesn't exist, try localStorage fallback
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('paid_employees table does not exist, using localStorage fallback')
      const stored = localStorage.getItem(`paidEmployees_${userId}`)
      return stored ? JSON.parse(stored) : {}
    }
    // For other errors, also try localStorage
    console.error('Error fetching paid employees from Supabase:', error)
    const stored = localStorage.getItem(`paidEmployees_${userId}`)
    return stored ? JSON.parse(stored) : {}
  }
  
  // If Supabase returned data, use it
  if (data && data.length > 0) {
    // Convert array back to object
    const result = {}
    data.forEach(item => {
      result[item.month_key] = item.employee_ids || []
    })
    return result
  }
  
  // If Supabase has no data, check localStorage (migration scenario)
  const stored = localStorage.getItem(`paidEmployees_${userId}`)
  if (stored) {
    const parsed = JSON.parse(stored)
    // If we have localStorage data but no Supabase data, try to migrate it
    if (Object.keys(parsed).length > 0) {
      console.log('Migrating paid employees from localStorage to Supabase')
      try {
        await savePaidEmployees(parsed)
      } catch (e) {
        console.warn('Could not migrate paid employees to Supabase:', e)
      }
    }
    return parsed
  }
  
  return {}
}
