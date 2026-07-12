import type { ReactNode } from 'react'
import type { MuscleReadinessItem, MuscleReadinessStatus } from '../types'

const statusClass: Record<MuscleReadinessStatus, string> = {
  ready: 'ready',
  available: 'available',
  recovering: 'recovering',
  rest: 'rest'
}

function Zone({ item, children }: { item: MuscleReadinessItem; children: ReactNode }) {
  return <g className={`muscle-zone ${statusClass[item.status]}`} data-muscle={item.muscle} aria-label={`${item.label}: ${item.score}% ready`}>
    <title>{item.label}: {item.score}% ready</title>
    {children}
  </g>
}

export function MuscleReadinessMap({ items }: { items: MuscleReadinessItem[] }) {
  const byMuscle = Object.fromEntries(items.map((item) => [item.muscle, item])) as Record<MuscleReadinessItem['muscle'], MuscleReadinessItem>
  return <div className="muscle-map-wrap">
    <div className="body-view"><span>Front</span><svg viewBox="0 0 150 320" role="img" aria-label="Front muscle readiness map">
      <circle className="body-neutral" cx="75" cy="25" r="17" />
      <path className="body-neutral" d="M62 44 Q75 38 88 44 L96 91 Q91 115 87 137 L63 137 Q59 112 54 91Z" />
      <Zone item={byMuscle.shoulders}><ellipse cx="52" cy="61" rx="15" ry="12" /><ellipse cx="98" cy="61" rx="15" ry="12" /></Zone>
      <Zone item={byMuscle.chest}><path d="M58 61 Q68 53 74 64 L73 91 Q62 92 57 82Z" /><path d="M92 61 Q82 53 76 64 L77 91 Q88 92 93 82Z" /></Zone>
      <Zone item={byMuscle.biceps}><path d="M39 70 Q48 68 51 80 L47 122 Q37 124 33 114Z" /><path d="M111 70 Q102 68 99 80 L103 122 Q113 124 117 114Z" /></Zone>
      <Zone item={byMuscle.triceps}><path d="M31 116 Q41 112 47 122 L43 159 Q33 162 28 151Z" /><path d="M119 116 Q109 112 103 122 L107 159 Q117 162 122 151Z" /></Zone>
      <Zone item={byMuscle.core}><rect x="63" y="91" width="24" height="48" rx="10" /></Zone>
      <Zone item={byMuscle.quads}><path d="M57 143 Q69 138 73 151 L69 220 Q55 224 48 210Z" /><path d="M93 143 Q81 138 77 151 L81 220 Q95 224 102 210Z" /></Zone>
      <Zone item={byMuscle.calves}><path d="M49 218 Q60 213 68 224 L64 291 Q53 298 47 285Z" /><path d="M101 218 Q90 213 82 224 L86 291 Q97 298 103 285Z" /></Zone>
      <path className="body-neutral" d="M47 287 L65 287 L64 305 L43 305Z" /><path className="body-neutral" d="M103 287 L85 287 L86 305 L107 305Z" />
    </svg></div>

    <div className="body-view"><span>Back</span><svg viewBox="0 0 150 320" role="img" aria-label="Back muscle readiness map">
      <circle className="body-neutral" cx="75" cy="25" r="17" />
      <path className="body-neutral" d="M62 44 Q75 38 88 44 L96 91 Q91 115 87 137 L63 137 Q59 112 54 91Z" />
      <Zone item={byMuscle.shoulders}><ellipse cx="52" cy="61" rx="15" ry="12" /><ellipse cx="98" cy="61" rx="15" ry="12" /></Zone>
      <Zone item={byMuscle.back}><path d="M58 58 Q75 44 92 58 L88 107 Q75 119 62 107Z" /></Zone>
      <Zone item={byMuscle.triceps}><path d="M39 70 Q48 68 51 80 L47 122 Q37 124 33 114Z" /><path d="M111 70 Q102 68 99 80 L103 122 Q113 124 117 114Z" /></Zone>
      <Zone item={byMuscle.core}><path d="M63 104 Q75 116 87 104 L87 137 L63 137Z" /></Zone>
      <Zone item={byMuscle.glutes}><ellipse cx="63" cy="153" rx="15" ry="17" /><ellipse cx="87" cy="153" rx="15" ry="17" /></Zone>
      <Zone item={byMuscle.hamstrings}><path d="M52 168 Q64 162 72 174 L68 224 Q56 229 49 216Z" /><path d="M98 168 Q86 162 78 174 L82 224 Q94 229 101 216Z" /></Zone>
      <Zone item={byMuscle.calves}><path d="M49 218 Q60 213 68 224 L64 291 Q53 298 47 285Z" /><path d="M101 218 Q90 213 82 224 L86 291 Q97 298 103 285Z" /></Zone>
      <path className="body-neutral" d="M47 287 L65 287 L64 305 L43 305Z" /><path className="body-neutral" d="M103 287 L85 287 L86 305 L107 305Z" />
    </svg></div>

    <div className="muscle-legend" aria-label="Readiness legend"><span><i className="ready" />Ready</span><span><i className="available" />Available</span><span><i className="recovering" />Recovering</span><span><i className="rest" />Rest</span></div>
  </div>
}
