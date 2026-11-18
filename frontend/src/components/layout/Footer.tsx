import { PageContainer } from './PageContainer'

export function Footer() {
  return (
    <footer className="mt-20 pb-28 md:pb-10">
      <PageContainer className="flex flex-col gap-2 border-t border-seam pt-6 text-[13px] text-ink-3 sm:flex-row sm:justify-between">
        <p>Oota · personalised food discovery for Bengaluru. Restaurants, people and reviews are fictional demo data.</p>
        <p>Designed &amp; built by Vrunda · Photography from <a className="underline hover:text-ink" href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a></p>
      </PageContainer>
    </footer>
  )
}
