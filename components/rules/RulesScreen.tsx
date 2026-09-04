import { Card } from '@/components/ui/Card'
import {
  drawConfiguration,
  rankingConfiguration,
  ratingConfiguration,
  ratingCriteria,
} from '@/lib/scoring/configuration'

const percentage = (value: number) => `${Math.round(value * 100)}%`

const Step = ({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) => (
  <div className="flex gap-3">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-black">
      {number}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-1 flex flex-col gap-1 text-xs leading-relaxed text-[var(--muted)]">
        {children}
      </div>
    </div>
  </div>
)

const Formula = ({ children }: { children: React.ReactNode }) => (
  <p className="overflow-x-auto rounded-lg bg-[var(--surface-raised)] px-3 py-2 font-mono text-[11px] text-[var(--foreground)]">
    {children}
  </p>
)

export const RulesScreen = () => (
  <div className="flex flex-col gap-5">
    <div>
      <h1 className="text-lg font-semibold">Como funciona</h1>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Todos os números aqui vêm direto da configuração do app. Se mudarem, esta tela muda junto.
      </p>
    </div>

    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">O sorteio</h2>
      <Card className="flex flex-col gap-4">
        <Step number={1} title="O admin abre a rodada">
          <p>Só o admin abre. Quem não entrar na sessão fica de fora do sorteio.</p>
        </Step>

        <Step number={2} title="Cada um coloca lugares e monta seu rank">
          <p>
            O lugar que você adiciona entra no fim do seu rank automaticamente. Os que outros
            colocaram você precisa posicionar — se não posicionar, ele não recebe ponto seu.
          </p>
        </Step>

        <Step number={3} title="Os pontos são somados (Borda)">
          <p>
            Cada pessoa distribui exatamente 1 ponto no total, não importa quantos lugares
            ranqueou. Quem lista 6 não tem mais voz que quem lista 1.
          </p>
          <Formula>ponto = (tamanho da lista − posição + 1) ÷ soma de 1 até o tamanho</Formula>
          <p>
            Numa lista de 3: 1º vale 0,50 · 2º vale 0,33 · 3º vale 0,17. Somando 1,00.
          </p>
        </Step>

        <Step number={4} title="O peso final de cada lugar">
          <Formula>peso = pontos Borda × peso da pessoa × penalidade de já ter ido</Formula>
          <p>A chance de cada lugar é o peso dele dividido pela soma de todos.</p>
        </Step>

        <Step number={5} title="Banimento por votação">
          <p>
            Votar é opcional, 1 voto por pessoa. O mais votado fica fora do sorteio. Só 1 lugar é
            banido por rodada. Se der empate em primeiro, ninguém é banido.
          </p>
        </Step>

        <Step number={6} title="Quórum de metade do grupo">
          <p>
            O sorteio só acontece com pelo menos{' '}
            <strong className="text-[var(--foreground)]">
              {percentage(drawConfiguration.minimumQuorumRatio)}
            </strong>{' '}
            dos membros na sessão, arredondando para cima. Com 4 pessoas, precisa de 2.
          </p>
        </Step>

        <Step number={7} title="Sorteia quando todos derem ready">
          <p>Batido o quórum, o botão destrava com todo mundo da sessão pronto.</p>
        </Step>
      </Card>
    </section>

    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">O peso de cada pessoa</h2>
      <Card className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--muted)]">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Quem está sem ganhar sobe</p>
          <p className="mt-1">
            Cada rodada sem ganhar soma{' '}
            <strong className="text-[var(--foreground)]">
              +{percentage(drawConfiguration.weightIncreasePerRoundWithoutWinning)}
            </strong>
            , até o teto de{' '}
            <strong className="text-[var(--foreground)]">
              {drawConfiguration.maximumMemberWeight}x
            </strong>
            . Quem ganha volta para {drawConfiguration.baseMemberWeight}x.
          </p>
          <Formula>
            peso = min({drawConfiguration.baseMemberWeight} + rodadas sem ganhar ×{' '}
            {drawConfiguration.weightIncreasePerRoundWithoutWinning},{' '}
            {drawConfiguration.maximumMemberWeight})
          </Formula>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Quem indica bem ganha um empurrão
          </p>
          <p className="mt-1">
            Se a média dos lugares que você indicou está acima da média do grupo, seu peso sobe;
            abaixo, desce. Limitado entre{' '}
            <strong className="text-[var(--foreground)]">
              {drawConfiguration.minimumQualityMultiplier}x
            </strong>{' '}
            e{' '}
            <strong className="text-[var(--foreground)]">
              {drawConfiguration.maximumQualityMultiplier}x
            </strong>
            .
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Quem não entrou não conta</p>
          <p className="mt-1">
            Sem rank, você não participa do sorteio — e também não acumula rodadas sem ganhar.
            Ficar de fora não vira vantagem depois.
          </p>
        </div>
      </Card>
    </section>

    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">Lugar onde já fomos</h2>
      <Card className="flex flex-col gap-2 text-xs leading-relaxed text-[var(--muted)]">
        <p>
          Logo depois de uma visita o lugar cai para{' '}
          <strong className="text-[var(--foreground)]">
            {percentage(drawConfiguration.recentlyVisitedPenalty)}
          </strong>{' '}
          do peso, e vai voltando ao normal ao longo de{' '}
          <strong className="text-[var(--foreground)]">
            {drawConfiguration.monthsToFullyRecoverFromVisit} meses
          </strong>
          . Quanto mais vezes vocês foram, menor a chance de repetir.
        </p>
        <Formula>peso = (penalidade + recuperação pelo tempo) ÷ número de visitas</Formula>
      </Card>
    </section>

    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">A nota</h2>
      <Card className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--muted)]">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {ratingCriteria.length} critérios, de {ratingConfiguration.minimumScore} a{' '}
            {ratingConfiguration.maximumScore}
          </p>
          <p className="mt-1">
            {ratingCriteria.map((criterion) => criterion.label).join(' · ')}. Sua nota é a média
            simples dos {ratingCriteria.length}.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Ninguém vê antes da hora</p>
          <p className="mt-1">
            As notas ficam escondidas até todo mundo dar a sua. Só então a nota final aparece.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Quem indicou pesa menos na nota
          </p>
          <p className="mt-1">
            Quem colocou o lugar pesa{' '}
            <strong className="text-[var(--foreground)]">
              {ratingConfiguration.recommenderWeight}x
            </strong>{' '}
            e todo mundo pesa{' '}
            <strong className="text-[var(--foreground)]">
              {ratingConfiguration.nonRecommenderWeight}x
            </strong>
            , para o entusiasmo de quem escolheu não inflar a nota.
          </p>
          <Formula>nota final = Σ(nota × peso) ÷ Σ(peso)</Formula>
        </div>
      </Card>
    </section>

    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">O ranking dos lugares</h2>
      <Card className="flex flex-col gap-2 text-xs leading-relaxed text-[var(--muted)]">
        <p>
          Um lugar com uma visita só não sobe ao topo por sorte. A nota é puxada para{' '}
          <strong className="text-[var(--foreground)]">
            {rankingConfiguration.bayesianPriorScore},0
          </strong>{' '}
          até acumular avaliações — quanto mais vezes vocês vão, mais a nota real dele prevalece.
        </p>
        <Formula>
          score = ({rankingConfiguration.bayesianConfidenceConstant} ×{' '}
          {rankingConfiguration.bayesianPriorScore} + Σ notas) ÷ (
          {rankingConfiguration.bayesianConfidenceConstant} + nº de notas)
        </Formula>
      </Card>
    </section>

  </div>
)
