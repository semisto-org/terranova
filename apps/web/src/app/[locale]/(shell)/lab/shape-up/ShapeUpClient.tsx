'use client'

import { useRouter } from 'next/navigation'
import type { Pitch, Bet, Cycle, Member, IdeaList } from '@terranova/types'
import { ShapeUpWorkboard } from '@/components/lab/ShapeUpWorkboard'
import { deletePitch, removeBet } from '@/actions/lab-management'

interface ShapeUpClientProps {
  pitches: Pitch[]
  bets: Bet[]
  cycles: Cycle[]
  members: Member[]
  ideaLists: IdeaList[]
  currentMember: Member
}

export function ShapeUpClient({
  pitches,
  bets,
  cycles,
  members,
  ideaLists,
  currentMember,
}: ShapeUpClientProps) {
  const router = useRouter()

  const handleDeletePitch = async (pitchId: string) => {
    if (!confirm('Are you sure you want to delete this pitch?')) return

    try {
      await deletePitch(pitchId)
      router.refresh()
    } catch (error) {
      alert('Error deleting pitch: ' + (error as Error).message)
    }
  }

  const handleRemoveBet = async (betId: string) => {
    if (!confirm('Are you sure you want to remove this bet?')) return

    try {
      await removeBet(betId)
      router.refresh()
    } catch (error) {
      alert('Error removing bet: ' + (error as Error).message)
    }
  }

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <ShapeUpWorkboard
      pitches={pitches}
      bets={bets}
      cycles={cycles}
      members={members}
      ideaLists={ideaLists}
      currentMemberId={currentMember.id}
      onDeletePitch={
        currentMember.isAdmin ? handleDeletePitch : undefined
      }
      onRemoveBet={currentMember.isAdmin ? handleRemoveBet : undefined}
      onRefresh={handleRefresh}
    />
  )
}
