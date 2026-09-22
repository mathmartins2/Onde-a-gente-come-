import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { UtensilsCrossed } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Meter } from '@/components/ui/Meter'
import { RestaurantPhoto } from '@/components/ui/RestaurantPhoto'
import { ScoreRating } from '@/components/ui/ScoreRating'
import { ratingConfiguration } from '@/lib/scoring/configuration'
import { formatHalfStarScore, roundToHalfStar } from '@/lib/scoring/roundToHalfStar'
import { loadPublicRestaurantSummary, type PublicRestaurantSummary } from '@/lib/services/publicRestaurantService'
import { formatLongDayInAppTimeZone } from '@/lib/utilities/appTimeZone'
import { classNames } from '@/lib/utilities/classNames'
import { scoreTextClassFor } from '@/lib/utilities/scoreTone'

const describeLocation = (restaurant: PublicRestaurantSummary) =>
  [restaurant.neighborhood, restaurant.city].filter((part): part is string => Boolean(part)).join(' · ')

const describeVisitCount = (count: number) => (count === 1 ? '1 visita da mesa' : `${count} visitas da mesa`)

export const generateMetadata = async (props: PageProps<'/r/[shareToken]'>): Promise<Metadata> => {
  const { shareToken } = await props.params
  const restaurant = await loadPublicRestaurantSummary(shareToken)
  if (!restaurant) return { title: 'Onde a gente come' }

  const title = `${restaurant.name}: nota ${formatHalfStarScore(restaurant.overallScore)} · Onde a gente come`
  const description = `A nota completa de ${restaurant.name}: sabor, preço, atendimento e mais.`
  return { title, description, openGraph: { title, description }, robots: { index: false } }
}

const PublicRestaurantPage = async (props: PageProps<'/r/[shareToken]'>) => {
  const { shareToken } = await props.params
  const restaurant = await loadPublicRestaurantSummary(shareToken)
  if (!restaurant) notFound()

  const roundedOverallScore = roundToHalfStar(restaurant.overallScore)
  const location = describeLocation(restaurant)

  return (
    <main className="relative min-h-dvh overflow-hidden px-4 pb-12 pt-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-accent opacity-40 blur-[120px]"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-5">
        <span className="inline-flex items-center gap-2 self-start rounded-pill border border-hairline-strong bg-surface-1 px-3 py-1.5 text-micro-cap text-ink-muted">
          <UtensilsCrossed size={12} strokeWidth={2.6} className="text-accent" />
          Onde a gente come
        </span>

        <header className="flex items-center gap-4">
          <RestaurantPhoto name={restaurant.name} photoUrl={restaurant.photoUrl} className="h-20 w-20 rounded-xl" />
          <div className="min-w-0">
            <h1 className="font-display text-[1.9rem] font-black leading-[1.05] tracking-tight">{restaurant.name}</h1>
            {location ? <p className="mt-1 text-body-sm text-ink-muted">{location}</p> : null}
            {restaurant.cuisines.length > 0 ? (
              <p className="mt-0.5 text-caption text-ink-faint">{restaurant.cuisines.join(' · ')}</p>
            ) : null}
          </div>
        </header>

        <Card className="flex flex-col gap-2 p-5">
          <p className="text-micro-cap text-ink-muted">nota da mesa</p>
          <div className="flex items-end gap-3">
            <span className={classNames('text-numeric text-[3.5rem] font-bold leading-none', scoreTextClassFor(roundedOverallScore))}>
              {formatHalfStarScore(restaurant.overallScore)}
            </span>
            <span className="pb-2 text-body-sm text-ink-faint">de {ratingConfiguration.maximumScore}</span>
          </div>
          <ScoreRating score={roundedOverallScore} size={20} />
          <p className="text-caption text-ink-muted">
            {describeVisitCount(restaurant.scoredVisitCount)} · última em {formatLongDayInAppTimeZone(restaurant.lastVisitedAt)}
          </p>
        </Card>

        {restaurant.criteria.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-micro-cap text-ink-muted">nota por critério</h2>
            <Card className="flex flex-col gap-4 p-5">
              {restaurant.criteria.map((criterion) => (
                <div key={criterion.key} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-body-sm">{criterion.label}</span>
                    <span className={classNames('text-numeric font-semibold', scoreTextClassFor(roundToHalfStar(criterion.score)))}>
                      {formatHalfStarScore(criterion.score)}
                    </span>
                  </div>
                  <Meter value={roundToHalfStar(criterion.score) / ratingConfiguration.maximumScore} />
                </div>
              ))}
            </Card>
          </section>
        ) : null}

        {restaurant.comments.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-micro-cap text-ink-muted">o que a mesa disse</h2>
            <ul className="flex flex-col gap-2.5">
              {restaurant.comments.map((comment) => (
                <li
                  key={`${comment.authorName}-${comment.visitedAt.toISOString()}-${comment.text}`}
                  className="rounded-xl border border-hairline bg-surface-1 px-4 py-3"
                >
                  <p className="text-body-sm">“{comment.text}”</p>
                  <p className="mt-1 text-caption text-ink-faint">
                    {comment.authorName} · {formatLongDayInAppTimeZone(comment.visitedAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="text-center text-caption text-ink-faint">
          Notas de 0 a {ratingConfiguration.maximumScore}, arredondadas para meia estrela.
        </p>
      </div>
    </main>
  )
}

export default PublicRestaurantPage
