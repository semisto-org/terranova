import { Head } from '@inertiajs/react'
import { HeroSection } from '@/plant-database/components/public/HeroSection'
import { ConditionsBlock } from '@/plant-database/components/public/ConditionsBlock'
import { SoilBlock } from '@/plant-database/components/public/SoilBlock'
import { CalendarBlock } from '@/plant-database/components/public/CalendarBlock'
import { PollinationBlock } from '@/plant-database/components/public/PollinationBlock'
import { EcosystemBlock } from '@/plant-database/components/public/EcosystemBlock'
import { ResourcesBlock } from '@/plant-database/components/public/ResourcesBlock'
import { CautionsBlock } from '@/plant-database/components/public/CautionsBlock'
import { VarietiesBlock } from '@/plant-database/components/public/VarietiesBlock'
import { PublicFooter } from '@/plant-database/components/public/PublicFooter'

export default function PublicSpecies({ species, photos = [], varieties = [] }) {
  return (
    <>
      <Head>
        <title>{`${species.commonNamesFr || species.latinName} — Semisto`}</title>
        <meta name="description" content={`Fiche botanique : ${species.latinName}`} />
      </Head>
      <main className="min-h-screen bg-stone-50">
        <HeroSection species={species} photos={photos} />
        <ConditionsBlock species={species} />
        <SoilBlock species={species} />
        <CalendarBlock species={species} />
        <PollinationBlock species={species} />
        <EcosystemBlock species={species} />
        <ResourcesBlock species={species} />
        <CautionsBlock species={species} />
        <VarietiesBlock varieties={varieties} />
        <PublicFooter />
      </main>
    </>
  )
}
