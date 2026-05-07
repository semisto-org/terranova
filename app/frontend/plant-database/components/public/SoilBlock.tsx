const TEXTURE = ['light', 'balanced', 'heavy']
const TEXTURE_FR: Record<string, string> = { light: 'Léger', balanced: 'Équilibré', heavy: 'Lourd' }
const HUMUS = ['poor', 'moderate', 'rich']
const HUMUS_FR: Record<string, string> = { poor: 'Pauvre', moderate: 'Moyen', rich: 'Riche' }
const PH = ['acid', 'neutral', 'basic']
const PH_FR: Record<string, string> = { acid: 'Acide', neutral: 'Neutre', basic: 'Basique' }
const ROOT_FR: Record<string, string> = {
  taproot: 'Pivotant', fibrous: 'Fasciculé', spreading: 'Traçant',
  shallow: 'Superficiel', deep: 'Profond',
}

function Scale({ values, order, labels }: { values: string[] | undefined; order: string[]; labels: Record<string, string> }) {
  const active = new Set(values || [])
  return (
    <div className="grid grid-cols-3 gap-1">
      {order.map((key) => (
        <div key={key} className="text-center">
          <div className={`h-2 rounded ${active.has(key) ? 'bg-[#234766]' : 'bg-stone-200'}`} />
          <div className="text-[10px] mt-1 text-stone-500">{labels[key]}</div>
        </div>
      ))}
    </div>
  )
}

export function SoilBlock({ species }: { species: any }) {
  const hasData = (species.soilTexture?.length ?? 0) > 0 ||
                   species.soilRichness ||
                   (species.soilPh?.length ?? 0) > 0 ||
                   species.rootSystem
  if (!hasData) return null

  return (
    <section className="px-6 md:px-12 py-8 max-w-3xl mx-auto border-t border-stone-200">
      <h2 className="font-serif text-2xl text-stone-900 mb-6">Sol</h2>
      <div className="space-y-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">Texture</div>
          <Scale values={species.soilTexture} order={TEXTURE} labels={TEXTURE_FR} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">Humus</div>
          <Scale values={species.soilRichness ? [species.soilRichness] : []} order={HUMUS} labels={HUMUS_FR} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">pH</div>
          <Scale values={species.soilPh} order={PH} labels={PH_FR} />
        </div>
        {species.rootSystem && (
          <div className="pt-2">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Racines : </span>
            <span className="font-semibold">{ROOT_FR[species.rootSystem] || species.rootSystem}</span>
          </div>
        )}
      </div>
    </section>
  )
}
