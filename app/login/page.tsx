import { redirect } from 'next/navigation'
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

const MarqueeRow = () => (
  <span className="font-display shrink-0 whitespace-nowrap px-4 text-3xl font-semibold lowercase text-[var(--accent)]">
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
      className="animate-glow-breathe pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-50 blur-[110px]"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-[-20%] bottom-2 -rotate-3 opacity-[0.11] [mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)]"
    >
      <div className="marquee-track">
        <MarqueeRow />
        <MarqueeRow />
      </div>
    </div>

    <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
      <div className="animate-rise-in mb-9 text-center">
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          <span className="animate-tilt-wobble text-sm">🍽️</span>
          Recife · desde sempre
        </span>

        <h1 className="font-display mt-5 text-[2.9rem] font-semibold leading-[0.92] tracking-[-0.03em]">
          Onde a<br />
          gente <span className="text-[var(--accent)]">come</span>
          <span className="text-[var(--herb)]">?</span>
        </h1>

        <p className="mx-auto mt-4 max-w-[19rem] text-sm leading-relaxed text-[var(--muted)]">
          Chega de decidir no grupo. O sorteio escolhe, todo mundo aceita e a mesa tá marcada.
        </p>
      </div>

      <div
        className="animate-rise-in relative rounded-[var(--radius-large)] border border-[var(--border-strong)] bg-[linear-gradient(165deg,var(--surface-raised),var(--surface)_52%,var(--surface-sunken))] shadow-[var(--shadow-lifted)]"
        style={{ animationDelay: '140ms' }}
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
            Comanda do rolê
          </span>
          <span className="flex gap-1" aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--herb)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--berry)]" />
          </span>
        </div>

        <div className="px-6 pb-6 pt-5">
          <LoginForm />
        </div>

        <div className="relative border-t border-dashed border-[var(--border-strong)] px-6 py-4">
          <span aria-hidden className="ticket-notch -left-3 top-1/2 -translate-y-1/2" />
          <span aria-hidden className="ticket-notch -right-3 top-1/2 -translate-y-1/2" />
          <p className="text-center text-[11px] leading-relaxed text-[var(--muted)]">
            Sem conta nova. Use o usuário que o grupo te deu.
          </p>
        </div>
      </div>

      <p
        className="animate-rise-in mt-8 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-[color-mix(in_srgb,var(--muted)_75%,transparent)]"
        style={{ animationDelay: '260ms' }}
      >
        6 amigos · 1 mesa · zero discussão
      </p>
    </div>
  </main>
  )
}

export default LoginPage
