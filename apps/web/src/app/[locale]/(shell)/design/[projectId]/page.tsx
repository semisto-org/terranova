import { PlaceholderPage } from '@/components/ui/PlaceholderPage'

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  return <PlaceholderPage title={`Projet ${projectId}`} pole="Design Studio" poleColor="#AFBD00" />
}
