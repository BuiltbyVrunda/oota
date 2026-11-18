import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { firstName } from '../../utils/format'
import { TasteStrip } from './TasteStrip'

function greeting(h = new Date().getHours()) {
  if (h < 5) return 'Late-night cravings'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function WelcomeHeader({ fact }: { fact: string }) {
  const { user } = useAuth()
  return (
    <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      className="flex flex-col gap-4 pb-2 pt-6 sm:pt-10">
      <h1 className="text-[36px] leading-[1.02] sm:text-[52px]">
        {greeting()}, <span className="text-haldi-ink">{user ? firstName(user.fullName) : 'there'}</span>.
      </h1>
      <p className="measure text-[17px] text-ink-2">{fact}</p>
      <TasteStrip />
    </motion.header>
  )
}
