import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/lib/auth/currentMember'
import { CravingBoard } from '@/components/auth/CravingBoard'
import { cravingWords } from '@/components/auth/cravingWords'
import { LoginForm } from '@/components/auth/LoginForm'
import { BrandMark } from '@/components/ui/BrandMark'

const houseRules = [
  'o sorteio escolhe, ninguém discute',
  'cada um ranqueia, a chance segue o rank',
  'quem ganhou semana passada dorme fora',
]

const formatRuleNumber = (position: number) => String(position + 1).padStart(2, '0')

const LoginPage = async () => {
  const member = await getCurrentMember()
  if (member) redirect('/')

  return (
    <main className="relative flex min-h-dvh flex-col px-5 py-6 lg:px-10">
      <header className="animate-fade-up mx-auto flex w-full max-w-5xl items-center justify-between">
        <span className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="font-display text-heading-md">Onde a gente come</span>
        </span>
        <span className="text-micro-cap text-ink-faint">Recife · desde sempre</span>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 py-10 lg:flex-row lg:items-center lg:gap-16">
        <section className="flex flex-col items-center text-center lg:flex-1 lg:items-start lg:text-left">
          <p className="animate-rise-in text-micro-cap text-accent">Hoje a mesa vai de</p>

          <div className="animate-rise-in mt-3 w-full" style={{ animationDelay: '80ms' }}>
            <CravingBoard cravings={cravingWords} />
          </div>

          <h1
            className="animate-rise-in font-display mt-8 text-display-hero lg:text-[4.25rem] lg:leading-[0.98]"
            style={{ animationDelay: '160ms' }}
          >
            Onde a gente <span className="highlighter-stroke">come</span>
            <span className="text-[var(--herb)]">?</span>
          </h1>

          <p
            className="animate-rise-in mt-4 max-w-[24rem] text-body-lg text-ink-muted"
            style={{ animationDelay: '220ms' }}
          >
            Chega de decidir no grupo. O sorteio escolhe, todo mundo aceita e a mesa tá marcada.
          </p>

          <ol
            className="animate-rise-in mt-7 hidden w-full max-w-[24rem] flex-col lg:flex"
            style={{ animationDelay: '280ms' }}
          >
            {houseRules.map((rule, position) => (
              <li
                key={rule}
                className="flex items-baseline gap-4 border-t border-dashed border-hairline-strong py-2.5 text-body-sm text-ink-muted last:border-b"
              >
                <span className="text-numeric text-caption text-accent">{formatRuleNumber(position)}</span>
                {rule}
              </li>
            ))}
          </ol>
        </section>

        <section className="w-full lg:w-[22rem] lg:shrink-0">
          <div
            className="animate-rise-in relative rounded-2xl border border-hairline-strong bg-[linear-gradient(165deg,var(--surface-2),var(--surface-1)_52%,var(--surface-sunken))] shadow-[var(--elevation-3)]"
            style={{ animationDelay: '200ms' }}
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
            style={{ animationDelay: '320ms' }}
          >
            6 amigos · 1 mesa · zero discussão
          </p>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
