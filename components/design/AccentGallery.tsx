'use client'

import { useState } from 'react'
import { Dices, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Meter } from '@/components/ui/Meter'
import { SectionHeading } from '@/components/ui/SectionHeading'

type AccentCandidate = {
  key: string
  name: string
  rationale: string
  accent: string
  accentHover: string
  accentPress: string
  onAccent: string
  contrastOnCanvas: string
}

const accentCandidates: AccentCandidate[] = [
  {
    key: 'brasa',
    name: 'Brasa',
    rationale: 'A identidade de hoje, com os degraus arrumados. Continuidade total.',
    accent: '#ff6b35',
    accentHover: '#ff8352',
    accentPress: '#d64a17',
    onAccent: '#1d0c04',
    contrastOnCanvas: '7.4:1',
  },
  {
    key: 'pimenta',
    name: 'Pimenta',
    rationale: 'Mais festivo e menos comum que laranja. Puxa pro clima de rolê.',
    accent: '#ff4d6d',
    accentHover: '#ff7189',
    accentPress: '#c9184a',
    onAccent: '#1f0508',
    contrastOnCanvas: '6.1:1',
  },
  {
    key: 'limao',
    name: 'Limão',
    rationale: 'O maior contraste dos três no escuro. Lê como comida fresca.',
    accent: '#a8dd52',
    accentHover: '#c2ea7d',
    accentPress: '#7fb02f',
    onAccent: '#101806',
    contrastOnCanvas: '12.8:1',
  },
]

const toAccentStyle = (candidate: AccentCandidate) =>
  ({
    '--accent': candidate.accent,
    '--accent-hover': candidate.accentHover,
    '--accent-press': candidate.accentPress,
    '--on-accent': candidate.onAccent,
    '--accent-tint': `color-mix(in srgb, ${candidate.accent} 14%, transparent)`,
  }) as React.CSSProperties

const AccentPreview = ({ candidate }: { candidate: AccentCandidate }) => (
  <div style={toAccentStyle(candidate)} className="flex flex-col gap-4">
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-heading-lg font-display">{candidate.name}</h2>
      <Badge tone="accent" size="small">
        {candidate.contrastOnCanvas}
      </Badge>
    </div>

    <p className="text-body-sm text-ink-muted">{candidate.rationale}</p>

    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-micro-cap text-ink-faint">rodada 12</span>
        <span className="text-caption text-ink-faint">sorteio 18 set às 13:58 · fomos 19 set</span>
      </div>

      <p className="text-heading-md">Forneria1121</p>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-body-sm">Forneria1121</span>
          <span className="text-numeric text-body-sm text-accent">82.4%</span>
        </div>
        <Meter value={0.824} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-body-sm text-ink-muted">Entre Amigos</span>
          <span className="text-numeric text-body-sm text-ink-muted">15.6%</span>
        </div>
        <Meter value={0.156} tone="muted" />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Badge tone="accent" size="small">
          seu voto
        </Badge>
        <Badge tone="danger" size="small">
          <Ban size={11} />
          banido
        </Badge>
        <Badge tone="success" size="small">
          4.8
        </Badge>
        <Badge tone="neutral" size="small">
          japonesa
        </Badge>
      </div>
    </Card>

    <div className="flex gap-2">
      <Button variant="secondary" size="medium" className="flex-1">
        Tô pronto
      </Button>
      <Button size="medium" className="flex-1">
        <Dices size={18} />
        Sortear
      </Button>
    </div>
  </div>
)

export const AccentGallery = () => {
  const [focusedKey, setFocusedKey] = useState<string | null>(null)
  const visibleCandidates = accentCandidates.filter(
    (candidate) => focusedKey === null || candidate.key === focusedKey,
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-display-large font-display">Escolha do accent</h1>
        <p className="text-body-sm text-ink-muted">
          Cada opção aplicada em componentes reais. O número é o contraste da cor sobre o fundo
          escuro — todos passam em AA para texto grande e elemento gráfico.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={focusedKey === null ? 'primary' : 'ghost'}
          size="small"
          onClick={() => setFocusedKey(null)}
        >
          Ver os três
        </Button>
        {accentCandidates.map((candidate) => (
          <Button
            key={candidate.key}
            variant={focusedKey === candidate.key ? 'primary' : 'ghost'}
            size="small"
            onClick={() => setFocusedKey(candidate.key)}
          >
            {candidate.name}
          </Button>
        ))}
      </div>

      <SectionHeading title="Candidatos" hint={`${visibleCandidates.length} em tela`} />

      <div className="grid gap-8 lg:grid-cols-3">
        {visibleCandidates.map((candidate) => (
          <AccentPreview key={candidate.key} candidate={candidate} />
        ))}
      </div>
    </div>
  )
}
