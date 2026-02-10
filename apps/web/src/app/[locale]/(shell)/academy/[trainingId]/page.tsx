import { PlaceholderPage } from '@/components/ui/PlaceholderPage'

export default async function TrainingDetailPage({ params }: { params: Promise<{ trainingId: string }> }) {
  const { trainingId } = await params
  return <PlaceholderPage title={`Formation ${trainingId}`} pole="Academy" poleColor="#B01A19" />
}
