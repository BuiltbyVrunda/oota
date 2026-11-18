import { Compass, RotateCcw, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { Rail } from '../components/common/Rail'
import { CuisineTiles } from '../components/dashboard/CuisineTiles'
import { DishCard } from '../components/dashboard/DishCard'
import { RecentStrip } from '../components/dashboard/RecentStrip'
import { RestaurantCard } from '../components/dashboard/RestaurantCard'
import { Tier } from '../components/dashboard/Tier'
import { TrendingList } from '../components/dashboard/TrendingList'
import { WelcomeHeader } from '../components/dashboard/WelcomeHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { useActivity } from '../context/ActivityContext'
import { useCatalog } from '../context/CatalogContext'
import { useRecommendations } from '../hooks/useRecommendations'

export function DashboardPage() {
  const { data, status, error } = useRecommendations()
  const { views } = useActivity()
  const { refresh } = useCatalog()

  if (status === 'loading' || (!data && status !== 'error')) return <DashboardSkeleton />
  if (status === 'error' || !data) {
    return (
      <PageContainer className="pt-16">
        <EmptyState icon={<RotateCcw className="size-6" />} title="Couldn’t load your picks" actions={<Button onClick={refresh}>Try again</Button>}>
          {error ?? 'Something went wrong while loading restaurants.'}
        </EmptyState>
      </PageContainer>
    )
  }
  const { searched, top, trending, recent, cuisines } = data

  return (
    <PageContainer className="flex flex-col gap-6">
      <WelcomeHeader fact={data.fact} />

      {/* 1 — Because you searched X : a feature card + matching dishes */}
      <Tier id="t-searched" index={0} tint="haldi" title={searched.title} reason={searched.reason} signals={searched.signals}>
        {searched.items.length === 0 && searched.dishes.length === 0 ? (
          <EmptyState icon={<Search className="size-6" />} title="Nothing nearby matched that search" className="py-6"
            actions={<Link to="/discover"><Button variant="secondary" icon={<Compass className="size-4" />}>Search something else</Button></Link>}>
            Try a dish name like “dosa” or a cuisine like “Andhra”.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            {searched.items[0] && <RestaurantCard rec={searched.items[0]} variant="feature" eager />}
            <div className="flex flex-col gap-3">
              {(searched.dishes.length ? searched.dishes.slice(0, 4) : []).map((d) => <DishCard key={d.item.id} rec={d} />)}
              {searched.items.length > 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {searched.items.slice(1, searched.dishes.length ? 3 : 5).map((r, _i, arr) => (
                    <div key={r.item.id} className={arr.length === 1 ? 'col-span-2' : undefined}>
                      <RestaurantCard rec={r} variant={arr.length === 1 ? 'wide' : 'grid'} />
                    </div>
                  ))}
                </div>
              )}
              {searched.query && (
                <Link to={`/discover?q=${encodeURIComponent(searched.query)}`} className="self-start text-[14px] font-semibold text-haldi-ink hover:underline">
                  See all results for “{searched.query}”
                </Link>
              )}
            </div>
          </div>
        )}
      </Tier>

      {/* 2 — Top-rated for your tastes : portrait rail */}
      <Tier id="t-top" index={1} tint="chilli" title={top.title} reason={top.reason} signals={top.signals}>
        <Rail label={top.title}>{top.items.map((r, i) => <RestaurantCard key={r.item.id} rec={r} eager={i < 3} />)}</Rail>
      </Tier>

      {/* 3 — Trending : wide rail + ranked dish list */}
      <Tier id="t-trending" index={2} tint="kokum" title={trending.title} reason={trending.reason} signals={trending.signals}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="min-w-0"><Rail label="Trending restaurants">{trending.items.map((r) => <RestaurantCard key={r.item.id} rec={r} variant="wide" />)}</Rail></div>
          <div>
            <h3 className="mb-2 font-sans text-[15px] font-semibold tracking-normal text-ink-2">Dishes everyone’s ordering</h3>
            <TrendingList items={trending.dishes} />
          </div>
        </div>
      </Tier>

      {/* 4 — Recently viewed : small pills */}
      {recent.items.length > 0 && (
        <Tier id="t-recent" index={3} tint="coconut" title={recent.title} reason={recent.reason} signals={recent.signals}>
          <RecentStrip items={recent.items} views={views} />
        </Tier>
      )}

      {/* 5 — Your cuisines : photo tiles */}
      <Tier id="t-cuisines" index={4} tint="leaf" title={cuisines.title} reason={cuisines.reason} signals={cuisines.signals}>
        <CuisineTiles items={cuisines.items} />
      </Tier>
    </PageContainer>
  )
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true"><PageContainer className="flex flex-col gap-6 pt-10">
      <Skeleton className="h-14 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="liquid rounded-tier p-6">
          <Skeleton className="h-8 w-64" />
          <div className="mt-5 flex gap-4">{[0, 1, 2].map((j) => <Skeleton key={j} className="aspect-[4/5] w-[260px] rounded-card" />)}</div>
        </div>
      ))}
    </PageContainer></div>
  )
}
