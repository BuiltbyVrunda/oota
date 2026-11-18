import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { SEED } from '../data/seedWorld'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Preferences } from '../types'
import { useAuth } from './AuthContext'

export const emptyPreferences: Preferences = { cuisineIds: [], diet: 'any', allergens: [], spiceLevel: 1, flavours: [], onboarded: false }

interface PrefsValue { prefs: Preferences; savePrefs: (p: Preferences) => Promise<void> }
const Ctx = createContext<PrefsValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.id ?? 0
  const [prefs, setPrefs] = useLocalStorage<Preferences>(`oota:v1:prefs:${uid}`, () =>
    SEED.demo.find((d) => d.userId === uid)?.preferences ?? emptyPreferences)
  const savePrefs = useCallback(async (p: Preferences) => setPrefs(p), [setPrefs])
  return <Ctx.Provider value={{ prefs, savePrefs }}>{children}</Ctx.Provider>
}

export function usePreferences(): PrefsValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePreferences outside PreferencesProvider')
  return v
}
