import { redirect } from 'next/navigation'
import { UtensilsCrossed } from 'lucide-react'
import { getCurrentMember } from '@/lib/auth/currentMember'
import { LoginForm } from '@/components/auth/LoginForm'

const cravingWords = [
  'pizza',
  'tapioca',
  'sushi',
  'carne de sol',
  'hambúrguer',
  'feijoada',
  'yakisoba',
  'açaí',
  'pastel',
  'churrasco',
]

const marqueeSeparator = ' • '

const houseRules = [
  'o sorteio escolhe, ninguém discute',
  'cada um ranqueia, a chance segue o rank',
  'quem ganhou semana passada dorme fora',
]

const MarqueeRow = () => (
  <span className="font-display shrink-0 whitespace-nowrap px-4 text-4xl font-semibold lowercase text-accent">
    {cravingWords.join(marqueeSeparator)}
    {marqueeSeparator}
  </span>
)

const LoginPage = async () => {
  const member = await getCurrentMember()
  if (member) redirect('/')

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-5 py-10">
      <div
        aria-hidden
        className="dotted-field pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_55%_at_50%_18%,#000,transparent)]"
      />
      <div
        aria-hidden
        className="animate-glow-breathe pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-accent opacity-50 blur-[120px] lg:left-[28%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-20%] bottom-2 -rotate-3 opacity-[0.1] [mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)]"
      >
        <div className="marquee-track">
          <MarqueeRow />
          <MarqueeRow />
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center lg:max-w-4xl lg:flex-row lg:items-center lg:gap-16">
        <section className="animate-rise-in mb-9 text-center lg:mb-0 lg:flex-1 lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-pill border border-hairline-strong bg-surface-1 px-3 py-1.5 text-micro-cap text-ink-muted">
            <span className="animate-tilt-wobble flex h-5 w-5 items-center justify-center rounded-[0.4rem] bg-[linear-gradient(140deg,var(--accent-hover),var(--accent-press))] text-on-accent">
              <UtensilsCrossed size={11} strokeWidth={2.6} />
            </span>
            Recife · desde sempre
          </span>

          <h1 className="font-display mt-5 text-display-hero lg:text-[3.6rem]">
            Onde a<br />
            gente <span className="text-accent">come</span>
            <span className="text-[var(--herb)]">?</span>
          </h1>

          <p className="mx-auto mt-4 max-w-[21rem] text-body-lg text-ink-muted lg:mx-0">
            Chega de decidir no grupo. O sorteio escolhe, todo mundo aceita e a mesa tá marcada.
          </p>

          <ul className="mx-auto mt-6 hidden max-w-[22rem] flex-col gap-2 lg:mx-0 lg:flex">
            {houseRules.map((rule) => (
              <li key={rule} className="flex items-baseline gap-2.5 text-body-sm text-ink-muted">
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {rule}
              </li>
            ))}
          </ul>
        </section>

        <section className="lg:w-[22rem] lg:shrink-0">
          <div
            className="animate-rise-in relative rounded-2xl border border-hairline-strong bg-[linear-gradient(165deg,var(--surface-2),var(--surface-1)_52%,var(--surface-sunken))] shadow-[var(--elevation-3)]"
            style={{ animationDelay: '140ms' }}
          >
            <div className="flex items-center justify-between px-6 pt-6">
              <span className="text-micro-cap text-ink-muted">Comanda do rolê</span>
              <span className="flex gap-1" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--herb)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--berry)]" />
              </span>
            </div>

            <div className="px-6 pb-6 pt-5">
              <LoginForm />
            </div>

            <div className="relative border-t border-dashed border-hairline-strong px-6 py-4">
              <span aria-hidden className="ticket-notch -left-3 top-1/2 -translate-y-1/2" />
              <span aria-hidden className="ticket-notch -right-3 top-1/2 -translate-y-1/2" />
              <p className="text-center text-caption">
                Sem conta nova. Use o usuário que o grupo te deu.
              </p>
            </div>
          </div>

          <p
            className="animate-rise-in mt-8 text-center text-micro-cap text-ink-faint"
            style={{ animationDelay: '260ms' }}
          >
            6 amigos · 1 mesa · zero discussão
          </p>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
