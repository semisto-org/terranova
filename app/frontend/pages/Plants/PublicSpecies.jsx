import { Head } from '@inertiajs/react'
import { HeroSection } from '@/plant-database/components/public/HeroSection'
import { ConditionsBlock } from '@/plant-database/components/public/ConditionsBlock'

export default function PublicSpecies({ species, photos = [] }) {
  return (
    <>
      <Head>
        <title>{`${species.commonNamesFr || species.latinName} — Semisto`}</title>
        <meta name="description" content={`Fiche botanique : ${species.latinName}`} />
      </Head>
      <main className="min-h-screen bg-stone-50">
        <HeroSection species={species} photos={photos} />
        <ConditionsBlock species={species} />
      </main>
    </>
  )
}
