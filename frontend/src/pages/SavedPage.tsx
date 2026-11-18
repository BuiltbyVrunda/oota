import { Heart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { RestaurantCard } from '../components/dashboard/RestaurantCard'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { useCatalog } from '../context/CatalogContext'
import { useFavourites } from '../context/FavouritesContext'
import { useSignals } from '../hooks/useSignals'
import { buildCtx, scoreRestaurant } from '../utils/recommend'
import { plural } from '../utils/format'

export function SavedPage() {
  const { ids } = useFavourites()
  const cat = useCatalog()
  const sig = useSignals()
  const [now] = useState(() => Date.now())
  const recs = useMemo(() => {
    const ctx = buildCtx({ cuisines: cat.cuisines, restaurants: cat.restaurants, dishes: cat.dishes }, sig, now)
    return ids.map((id) => cat.byId(id)).filter((r) => r !== undefined).map((r) => scoreRestaurant(ctx, r))
  }, [ids, cat, sig, now])
  return (
    <PageContainer className="pt-6 sm:pt-10">
      <h1 className="text-[34px] sm:text-[48px]">Saved</h1>
      <p className="mt-1 text-[16px] text-ink-2">{recs.length ? `${plural(recs.length, 'place')} you want to try or go back to.` : 'Places you heart show up here.'}</p>
      {recs.length === 0 ? (
        <div className="liquid mt-8 rounded-tier">
          <div className="relative z-[2]">
            <EmptyState icon={<Heart className="size-6" />} title="Nothing saved yet" actions={<Link to="/discover"><Button variant="accent">Find somewhere good</Button></Link>}>
              Tap the heart on any restaurant to keep it here for later.
            </EmptyState>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recs.map((r, i) => <li key={r.item.id}><RestaurantCard rec={r} variant="grid" eager={i < 3} /></li>)}
        </ul>
      )}
    </PageContainer>
  )
}
