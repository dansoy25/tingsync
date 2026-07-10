import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { fetchProfile, logActivity, createOrganization } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    try {
      const p = await fetchProfile(userId)
      setProfile(p)
    } catch (e) {
      // A signed-up user with no org yet (mid-onboarding) has no profile row.
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess)
      if (sess?.user) {
        await loadProfile(sess.user.id)
      } else {
        setProfile(null)
      }
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const p = await fetchProfile(data.user.id)
    setProfile(p)
    logActivity({ orgId: p.org_id, actorId: p.id, actorName: p.full_name, type: 'login' })
    return data
  }, [])

  // Employee mobile login: company code + employee ID + PIN → session (via employee-login edge fn).
  const signInWithPin = useCallback(async (companyCode, employeeId, pin) => {
    let res
    try {
      res = await fetch(`${SUPABASE_URL}/functions/v1/employee-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ company_code: companyCode, employee_id: employeeId, pin }),
      })
    } catch {
      throw new Error('Network error. Check your connection and try again.')
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Sign in failed. Please try again.')

    const { error } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
    if (error) throw error
    const { data: sess } = await supabase.auth.getSession()
    if (sess?.session?.user) {
      const p = await fetchProfile(sess.session.user.id)
      setProfile(p)
      logActivity({ orgId: p.org_id, actorId: p.id, actorName: p.full_name, type: 'login' })
    }
    return data
  }, [])

  // Creates the auth user only. Onboarding (createWorkspace) provisions the org + profile.
  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }, [])

  const createWorkspace = useCallback(async (payload) => {
    const result = await createOrganization(payload)
    if (session?.user) await loadProfile(session.user.id)
    return result
  }, [session, loadProfile])

  const signOut = useCallback(async () => {
    if (profile) {
      await logActivity({ orgId: profile.org_id, actorId: profile.id, actorName: profile.full_name, type: 'logout' })
    }
    await supabase.auth.signOut()
    setProfile(null)
  }, [profile])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [session, loadProfile])

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signIn, signInWithPin, signUp, createWorkspace, signOut, refreshProfile, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
