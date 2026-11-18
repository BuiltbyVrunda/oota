import { useMemo } from 'react'
import { useActivity } from '../context/ActivityContext'
import { usePreferences } from '../context/PreferencesContext'
import { useReviews } from '../context/ReviewsContext'
import type { UserSignals } from '../utils/recommend'

export function useSignals(): UserSignals {
  const { prefs } = usePreferences()
  const { searches, views } = useActivity()
  const { mine } = useReviews()
  return useMemo(() => ({ prefs, searches, views, reviews: mine }), [prefs, searches, views, mine])
}
