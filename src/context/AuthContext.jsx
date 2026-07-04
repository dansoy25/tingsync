import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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
      value={{ session, profile, loading, signIn, signUp, createWorkspace, signOut, refreshProfile, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
