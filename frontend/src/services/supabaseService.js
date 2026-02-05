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
      total_hours: typeof user.total_hours === 'string' ? parseFloat(user.total_hours.replace(':', '.')) || 0 : (user.total_hours || 0),
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
  if (!userId) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('manual_users')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  
  // Convert total_hours back to HH:MM format if needed
  const formatted = (data || []).map(user => ({
    ...user,
    is_manual: true, // Add flag for manual users
    total_hours: user.total_hours, // Keep as is (will be converted in component if needed)
  }))
  
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
    const manualUser = manualUsers.find(u => u.employee_id === parseInt(employeeId))
    if (manualUser) {
      const { error } = await supabase
        .from('manual_users')
        .update({ 
          daily_records: records,
          updated_at: new Date().toISOString()
        })
        .eq('id', manualUser.id)
      
      if (error) throw error
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

  if (error) throw error
  
  const result = {}
  data.forEach(item => {
    if (item.daily_records) {
      result[item.employee_id] = item.daily_records
    }
  })
  
  return result
}

// Save last process result (attendance report data)
export const saveLastProcessResult = async (reportData) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Extract year and month from reportData if available
  const year = reportData.year || new Date().getFullYear()
  const month = reportData.month || new Date().getMonth() + 1

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

  if (error) throw error
  return data
}

export const getLastProcessResult = async () => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Get the most recent attendance report
  const { data, error } = await supabase
    .from('attendance_reports')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  
  if (data) {
    return {
      daily_report: data.daily_report,
      monthly_summary: data.monthly_summary,
      statistics: data.statistics,
      year: data.year,
      month: data.month,
    }
  }
  
  return null
}

