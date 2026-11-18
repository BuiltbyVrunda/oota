import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { endpoints } from '../api/endpoints'
import { useResource } from '../hooks/useResource'
import type { Preferences } from '../types'
import { useAuth } from './AuthContext'

export const emptyPreferences: Preferences = { cuisineIds: [], diet: 'any', allergens: [], spiceLevel: 1, flavours: [], onboarded: false }

interface PrefsValue { prefs: Preferences; status: 'loading' | 'ready' | 'error'; savePrefs: (p: Preferences) => Promise<void> }
const Ctx = createContext<PrefsValue | null>(null)

/** Stored in MongoDB (user_preferences, _id = Postgres user_id). */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const r = useResource(user ? `prefs:${user.id}` : null, endpoints.preferences)
  const { mutate } = r
  const savePrefs = useCallback(async (p: Preferences) => {
    mutate(() => p) // optimistic
    const saved = await endpoints.savePreferences(p)
    mutate(() => saved)
  }, [mutate])
  return <Ctx.Provider value={{ prefs: r.data ?? emptyPreferences, status: user ? r.status : 'ready', savePrefs }}>{children}</Ctx.Provider>
}

export function usePreferences(): PrefsValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePreferences outside PreferencesProvider')
  return v
}
