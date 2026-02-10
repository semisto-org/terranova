import { PlaceholderPage } from '@/components/ui/PlaceholderPage'

export default async function SpeciesDetailPage({ params }: { params: Promise<{ speciesId: string }> }) {
  const { speciesId } = await params
  return <PlaceholderPage title={`Espèce ${speciesId}`} pole="Plant Database" poleColor="#AFBD00" />
}
