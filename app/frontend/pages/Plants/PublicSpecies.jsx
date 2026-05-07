import { Head } from '@inertiajs/react'

export default function PublicSpecies({ species }) {
  return (
    <>
      <Head>
        <title>{`${species.latinName} — Semisto`}</title>
        <meta name="description" content={`Fiche botanique : ${species.latinName}`} />
      </Head>
      <main className="min-h-screen bg-stone-50 p-6">
        <h1 className="text-3xl font-serif italic">{species.latinName}</h1>
      </main>
    </>
  )
}
