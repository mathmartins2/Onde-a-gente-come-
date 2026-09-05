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
          <p>
            Enquanto a rodada está aberta,{' '}
            <strong className="text-[var(--foreground)]">
              ninguém vê quem indicou o quê
            </strong>{' '}
            — nem aqui, nem na tela de Lugares. É pra votar no lugar, não na pessoa.
          </p>
        </Step>

        <Step number={3} title="Os pontos são somados (Borda)">
          <p>
            Cada pessoa distribui exatamente 1 ponto no total, não importa quantos lugares
            ranqueou. Quem lista 6 não tem mais voz que quem lista 1.
          </p>
          <Formula>ponto = (tamanho da lista − posição + 1) ÷ soma de 1 até o tamanho</Formula>
          <p>Numa lista de 3: 1º vale 0,50 · 2º vale 0,33 · 3º vale 0,17. Somando 1,00.</p>
          <p className="text-[var(--warning)]">
            Por isso um 1º lugar não vale sempre o mesmo: quem ranqueia poucos lugares concentra
            mais ponto em cada um.
          </p>
          <div className="flex flex-col gap-0.5 rounded-lg bg-[var(--surface-raised)] px-3 py-2 font-mono text-[11px]">
            <span>lista de 1 lugar → 1º vale 1,000</span>
            <span>lista de 2 lugares → 1º vale 0,667</span>
            <span>lista de 3 lugares → 1º vale 0,500</span>
            <span>lista de 5 lugares → 1º vale 0,333</span>
          </div>
        </Step>

        <Step number={4} title="O peso final de cada lugar">
          <Formula>peso = pontos Borda × peso da pessoa × penalidade de já ter ido</Formula>
          <p>A chance de cada lugar é o peso dele dividido pela soma de todos.</p>
        </Step>

        <Step number={5} title="Banimento por votação">
          <p>
            Votar é opcional, 1 voto por pessoa, e dá pra trocar ou tirar o voto até o sorteio. O
            mais votado fica fora, e só 1 lugar é banido por rodada.
          </p>
          <p>
            <strong className="text-[var(--foreground)]">Ninguém vê os votos antes do sorteio</strong>
            {' '}— nem a contagem — pra ninguém votar reagindo ao placar.
          </p>
          <p>
            Se der empate em primeiro, a rodada entra em{' '}
            <strong className="text-[var(--foreground)]">segundo turno</strong>: todo mundo perde o
            ready e vota de novo, só entre os empatados. Empatou de novo, ninguém é banido.
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
          <p>
            Adicionar um lugar novo derruba o ready de todos — assim ninguém fica &quot;pronto&quot;
            sem ter ranqueado o que entrou depois.
          </p>
        </Step>

        <Step number={8} title="Sai o vencedor e o plano B">
          <p>
            O sorteio escolhe também um{' '}
            <strong className="text-[var(--foreground)]">segundo lugar</strong>, pelo mesmo peso,
            para o caso do primeiro não rolar. Na hora de dar a nota vocês dizem em qual foram, e a
            nota vai para o lugar certo.
          </p>
          <p>
            Só no sorteio o painel revela, em sequência: o banido, o plano B e o vencedor — com a
            chance que ele tinha e quem indicou cada um.
          </p>
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
        <p className="text-[var(--foreground)]">
          <strong>O lugar da última rodada não pode sair de novo.</strong> Ele fica de fora do
          sorteio seguinte, sem exceção — só volta se for a única opção da roda.
        </p>
        <p>
          Depois disso, o lugar cai para{' '}
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
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ratingCriteria.map((criterion) => (
              <span
                key={criterion.key}
                className="rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--foreground)]"
              >
                {criterion.label}
              </span>
            ))}
          </div>
          <p className="mt-2">
            Sua nota é a média simples dos {ratingCriteria.length}, com meio ponto de precisão.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            O rascunho salva sozinho
          </p>
          <p className="mt-1">
            Cada slider que você move é guardado no servidor. Dá pra fechar o app, trocar de
            aparelho e continuar de onde parou. O rascunho é só seu — ninguém mais vê, nem depois
            da revelação.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Ninguém vê antes da hora</p>
          <p className="mt-1">
            As notas ficam escondidas até todo mundo dar a sua. Só então a nota final aparece. Nem o
            ranking nem as estatísticas enxergam nota de rolê ainda não revelado.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">O lugar é de quem cadastrou</p>
          <p className="mt-1">
            Quem registrou o restaurante é o indicador dele, mesmo que outra pessoa tenha trazido
            para a rodada. É esse crédito que conta para o peso e para a nota.
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
      <Card className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--muted)]">
        <p>
          <strong className="text-[var(--foreground)]">
            O número grande do ranking não é a nota do lugar.
          </strong>{' '}
          É um score que mistura a nota real com uma âncora neutra de{' '}
          {rankingConfiguration.bayesianPriorScore},0, para um lugar com uma visita só não subir ao
          topo por sorte. Quanto mais vezes vocês vão, mais a nota real prevalece e mais o score se
          aproxima dela.
        </p>
        <Formula>
          score = ({rankingConfiguration.bayesianConfidenceConstant} ×{' '}
          {rankingConfiguration.bayesianPriorScore} + Σ notas) ÷ (
          {rankingConfiguration.bayesianConfidenceConstant} + nº de notas)
        </Formula>

        <div className="flex flex-col gap-1 rounded-lg bg-[var(--surface-raised)] px-3 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
            exemplo com 3 votos
          </p>
          <p className="font-mono text-[11px] text-[var(--foreground)]">
            nota real 3,39 → score 3,16
          </p>
          <p className="text-[11px]">
            A âncora ainda pesa mais que 3 votos. Com mais visitas, o score sobe rumo à nota.
          </p>
        </div>
      </Card>
    </section>

  </div>
)
