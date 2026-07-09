import { supabase } from './supabase'

const manilaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

function shiftDays(isoDate, delta) {
  const d = new Date(isoDate + 'T00:00:00+08:00')
  d.setDate(d.getDate() + delta)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

// ---------- Profile / org ----------
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, organization:organizations(id, code, name)')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function fetchOrganization() {
  const { data, error } = await supabase.from('organizations').select('*').maybeSingle()
  if (error) throw error
  return data
}

export async function updateCompanyCode(orgId, code) {
  const clean = (code || '').trim().toUpperCase()
  if (!clean) throw new Error('Company code cannot be empty.')
  const { data, error } = await supabase
    .from('organizations')
    .update({ code: clean })
    .eq('id', orgId)
    .select('id, code')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Not permitted to change the company code.')
  return data[0]
}

// Creates a brand-new organization + owner profile for a freshly signed-up user.
export async function createOrganization(payload) {
  const { data, error } = await supabase.functions.invoke('create-organization', { body: payload })
  if (error) {
    let msg = error.message
    try {
      const ctx = await error.context?.json?.()
      if (ctx?.error) msg = ctx.error
    } catch (_) {}
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export async function logActivity({ orgId, actorId, actorName, type, message }) {
  if (!orgId) return
  await supabase.from('notifications').insert({
    org_id: orgId,
    actor_id: actorId || null,
    actor_name: actorName || null,
    type,
    message: message || null,
  })
}

// ---------- Dashboard ----------
export async function fetchDashboard() {
  const today = manilaToday()
  const monthStart = today.slice(0, 8) + '01'
  const [
    { data: profiles }, { data: todayAtt }, { data: leavePending }, { data: leaveApproved },
    { data: trendRows }, { data: run }, tasksOpen, tasksDoneWeek,
    { data: expensesMonth }, { data: inventory }, { data: activity },
  ] = await Promise.all([
    supabase.from('profiles').select('id, is_admin, status'),
    supabase.from('attendance').select('id, status, profile_id').eq('work_date', today),
    supabase
      .from('leave_requests')
      .select('id, status, date_from, date_to, days, reason, profile:profiles(full_name, position, avatar_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase.from('leave_requests').select('id, date_from, date_to').eq('status', 'approved'),
    supabase.from('attendance').select('work_date').gte('work_date', shiftDays(today, -29)),
    supabase.from('payroll_runs').select('*').order('period_start', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).neq('status', 'done'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'done').gte('updated_at', shiftDays(today, -6)),
    supabase.from('expenses').select('amount, category, spent_on').gte('spent_on', monthStart),
    supabase.from('inventory_items').select('id, status'),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(8),
  ])

  const employees = (profiles || []).filter((p) => !p.is_admin && p.status === 'active')
  const present = (todayAtt || []).filter((a) => a.status === 'present' || a.status === 'ongoing').length
  const late = (todayAtt || []).filter((a) => a.status === 'late').length
  const onLeave = (leaveApproved || []).filter((l) => l.date_from <= today && l.date_to >= today).length
  const absent = Math.max(0, employees.length - present - late - onLeave)

  const buildTrend = (days) => {
    const counts = {}
    for (let i = days - 1; i >= 0; i--) counts[shiftDays(today, -i)] = 0
    ;(trendRows || []).forEach((r) => {
      if (counts[r.work_date] != null) counts[r.work_date]++
    })
    return Object.entries(counts).map(([date, count]) => ({ date, count }))
  }

  const expenseTotal = (expensesMonth || []).reduce((s, e) => s + Number(e.amount || 0), 0)
  const expenseToday = (expensesMonth || [])
    .filter((e) => e.spent_on === today)
    .reduce((s, e) => s + Number(e.amount || 0), 0)
  const byCategory = {}
  ;(expensesMonth || []).forEach((e) => {
    const c = e.category || 'other'
    byCategory[c] = (byCategory[c] || 0) + Number(e.amount || 0)
  })
  const expenseBreakdown = Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount, pct: expenseTotal ? Math.round((amount / expenseTotal) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const inventoryCount = (inventory || []).length
  const lowStock = (inventory || []).filter((i) => i.status === 'low' || i.status === 'critical').length

  return {
    employeeCount: employees.length,
    present,
    late,
    absent,
    onLeave,
    pending: leavePending || [],
    pendingCount: (leavePending || []).length,
    trend7: buildTrend(7),
    trend30: buildTrend(30),
    run,
    today,
    tasksOpenCount: tasksOpen?.count ?? 0,
    tasksDoneWeekCount: tasksDoneWeek?.count ?? 0,
    expenseTotal,
    expenseToday,
    expenseBreakdown,
    inventoryCount,
    lowStock,
    activity: activity || [],
  }
}

// ---------- Attendance ----------
export async function fetchTodayAttendance() {
  return fetchAttendanceByDate(manilaToday())
}

export async function fetchAttendanceByDate(workDate) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, profile:profiles(full_name, position, avatar_url), site:sites(name)')
    .eq('work_date', workDate)
    .order('clock_in', { ascending: true })
  if (error) throw error
  return data
}

export { manilaToday, shiftDays }

// ---------- Employees ----------
export async function fetchEmployees() {
  const today = manilaToday()
  const [{ data: profiles }, { data: att }, { data: leaveApproved }] = await Promise.all([
    supabase.from('profiles').select('*, site:sites(name)').order('full_name'),
    supabase.from('attendance').select('profile_id, status').eq('work_date', today),
    supabase.from('leave_requests').select('profile_id, date_from, date_to').eq('status', 'approved'),
  ])
  const attBy = {}
  ;(att || []).forEach((a) => (attBy[a.profile_id] = a.status))
  const onLeave = new Set(
    (leaveApproved || []).filter((l) => l.date_from <= today && l.date_to >= today).map((l) => l.profile_id)
  )
  return (profiles || []).map((p) => ({
    ...p,
    today: onLeave.has(p.id) ? 'on_leave' : attBy[p.id] || 'absent',
  }))
}

export async function fetchProfilesLite() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, avatar_url, is_admin').order('full_name')
  if (error) throw error
  return data
}

export async function createEmployee(payload) {
  const { data, error } = await supabase.functions.invoke('create-employee', { body: payload })
  if (error) {
    let msg = error.message
    try {
      const ctx = await error.context?.json?.()
      if (ctx?.error) msg = ctx.error
    } catch (_) {}
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

// ---------- Tasks ----------
export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assignee_id_fkey(full_name, avatar_url), project:projects(name, accent, icon)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createTask(orgId, t, createdBy) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      org_id: orgId,
      title: t.title,
      description: t.description || null,
      assignee_id: t.assignee_id || null,
      project_id: t.project_id || null,
      priority: t.priority || 'medium',
      status: t.status || 'todo',
      due_date: t.due_date || null,
      created_by: createdBy,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id, patch) {
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select('*')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Not permitted to update this task.')
  return data[0]
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ---------- Leave ----------
export async function fetchLeaveQueue() {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, profile:profiles(full_name, position, avatar_url, site:sites(name)), leave_type:leave_types(name, color)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchTeamBalances() {
  const { data, error } = await supabase
    .from('leave_balances')
    .select('balance, profile:profiles(site:sites(name))')
  if (error) throw error
  const bySite = {}
  ;(data || []).forEach((b) => {
    const s = b.profile?.site?.name || 'Unassigned'
    ;(bySite[s] = bySite[s] || []).push(Number(b.balance || 0))
  })
  return Object.entries(bySite).map(([name, arr]) => ({
    name,
    avg: Math.round((arr.reduce((a, c) => a + c, 0) / arr.length) * 10) / 10,
  }))
}

export async function decideLeave(id, decision, reviewerName, note) {
  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: decision,
      reviewer_name: reviewerName,
      decided_at: new Date().toISOString(),
      decision_note: note || null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function fetchLeaveTypes() {
  const { data, error } = await supabase.from('leave_types').select('*').order('name')
  if (error) throw error
  return data
}

// ---------- Payroll ----------
export async function fetchPayrollRun() {
  const { data: run } = await supabase
    .from('payroll_runs')
    .select('*')
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, position, daily_rate, is_admin, avatar_url')
    .eq('status', 'active')
  const { data: settings } = await supabase.from('org_settings').select('*').maybeSingle()

  const otMult = Number(settings?.ot_multiplier || 1.25)
  const meal = Number(settings?.meal_allowance || 70)

  const rows = (profiles || [])
    .filter((p) => !p.is_admin && Number(p.daily_rate) > 0)
    .map((p) => {
      const rate = Number(p.daily_rate)
      const hourly = rate / 8
      const regH = 88
      const otH = 6
      const gross = Math.round(hourly * regH + hourly * otMult * otH + meal * 11)
      const statutory = Math.round(gross * 0.092)
      const net = gross - statutory
      return { ...p, regH, otH, gross, statutory, late: 0, net }
    })

  const totals = rows.reduce(
    (t, r) => ({ gross: t.gross + r.gross, statutory: t.statutory + r.statutory, net: t.net + r.net }),
    { gross: 0, statutory: 0, net: 0 }
  )

  return { run, rows, totals, count: rows.length }
}

export async function lockPayrollRun(id, dates) {
  const patch = { status: 'locked', locked_at: new Date().toISOString() }
  if (dates?.from) patch.period_start = dates.from
  if (dates?.to) patch.period_end = dates.to
  const { error } = await supabase.from('payroll_runs').update(patch).eq('id', id)
  if (error) throw error
}

export async function fetchOrgSettings() {
  const { data, error } = await supabase.from('org_settings').select('*').maybeSingle()
  if (error) throw error
  return data
}

export async function updateOrgSettings(orgId, patch) {
  const { error } = await supabase.from('org_settings').update(patch).eq('org_id', orgId)
  if (error) throw error
}

// ---------- Expenses ----------
export async function fetchExpenses({ projectId } = {}) {
  let q = supabase
    .from('expenses')
    .select('*, project:projects(name, accent, icon), creator:profiles(full_name)')
    .order('spent_on', { ascending: false })
    .limit(200)
  if (projectId) q = q.eq('project_id', projectId)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function createExpense(orgId, exp, createdBy) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      org_id: orgId,
      project_id: exp.project_id || null,
      category: exp.category || 'other',
      vendor: exp.vendor || null,
      amount: Number(exp.amount) || 0,
      spent_on: exp.spent_on,
      description: exp.description || null,
      receipt_url: exp.receipt_url || null,
      created_by: createdBy,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

// ---------- Inventory ----------
export async function fetchInventory() {
  const { data, error } = await supabase.from('inventory_items').select('*').order('name')
  if (error) throw error
  return data
}

export async function createInventoryItem(orgId, it) {
  const stock = Number(it.stock) || 0
  const reorder = Number(it.reorder_level) || 0
  const status = stock <= 0 ? 'critical' : stock <= reorder ? 'low' : 'in_stock'
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      org_id: orgId,
      name: it.name,
      sku: it.sku || null,
      icon: it.icon || '📦',
      stock,
      capacity: Number(it.capacity) || Math.max(stock, 100),
      unit: it.unit || 'pcs',
      location: it.location || null,
      reorder_level: reorder,
      status,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------- Sites (for QR generation) ----------
export async function fetchSites() {
  const { data, error } = await supabase.from('sites').select('*').order('name')
  if (error) throw error
  return data
}

export async function createSite(orgId, s) {
  const payload = String(crypto.randomUUID())
  const { data, error } = await supabase
    .from('sites')
    .insert({
      org_id: orgId,
      name: s.name,
      address: s.address || null,
      lat: s.lat || 0,
      lng: s.lng || 0,
      radius_m: s.radius_m || 120,
      qr_payload: payload,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------- Roles ----------
export async function fetchRoles() {
  const { data, error } = await supabase.from('roles').select('*').order('sort')
  if (error) throw error
  return data
}

// ---------- Reports ----------
export async function fetchDepartmentReport() {
  const [{ data: profiles }, { data: att }] = await Promise.all([
    supabase.from('profiles').select('id, position, status').eq('status', 'active'),
    supabase.from('attendance').select('profile_id, hours, status').gte('work_date', shiftDays(manilaToday(), -30)),
  ])
  const hoursBy = {}
  const attendedBy = {}
  ;(att || []).forEach((a) => {
    hoursBy[a.profile_id] = (hoursBy[a.profile_id] || 0) + Number(a.hours || 0)
    if (a.status === 'present' || a.status === 'ongoing' || a.status === 'late') {
      attendedBy[a.profile_id] = (attendedBy[a.profile_id] || 0) + 1
    }
  })
  const byDept = {}
  ;(profiles || []).forEach((p) => {
    const dept = p.position || 'Unassigned'
    if (!byDept[dept]) byDept[dept] = { department: dept, headcount: 0, hours: 0, attended: 0 }
    byDept[dept].headcount += 1
    byDept[dept].hours += hoursBy[p.id] || 0
    byDept[dept].attended += attendedBy[p.id] || 0
  })
  return Object.values(byDept).map((d) => ({
    ...d,
    hours: Math.round(d.hours),
    attendanceRate: d.headcount ? Math.round((d.attended / (d.headcount * 22)) * 100) : 0,
  }))
}
