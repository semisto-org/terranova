import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Dashboard,
  ShapeUpWorkboard,
  MemberList,
  SemosDashboard,
  TimesheetList,
  CalendarView,
} from '../../lab-management/components'

const SECTION_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'shapeup', label: 'Shape Up' },
  { id: 'members', label: 'Membres' },
  { id: 'semos', label: 'Semos' },
  { id: 'timesheets', label: 'Timesheets' },
  { id: 'calendar', label: 'Calendrier' },
]

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const data = await response.json()
      if (data?.error) {
        message = data.error
      }
    } catch (_) {
      // ignore parse error
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export default function LabIndex({ milestone, stats, currentMemberId: initialMemberId }) {
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await apiRequest('/api/v1/lab/overview')
      setData(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const members = data?.members || []
  const currentMemberId = useMemo(() => {
    if (initialMemberId && members.some((m) => m.id === initialMemberId)) {
      return initialMemberId
    }
    return members[0]?.id || ''
  }, [initialMemberId, members])

  const currentMember = useMemo(
    () => members.find((member) => member.id === currentMemberId),
    [members, currentMemberId]
  )

  const runAndRefresh = useCallback(async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await loadOverview()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [loadOverview])

  const callbacks = useMemo(() => ({
    onCreatePitch: () => runAndRefresh(async () => {
      const title = window.prompt('Titre du pitch')
      if (!title) return
      const problem = window.prompt('Problem')
      const solution = window.prompt('Solution')
      const appetite = window.prompt('Appetite (2-weeks, 3-weeks, 6-weeks)', '6-weeks') || '6-weeks'

      await apiRequest('/api/v1/lab/pitches', {
        method: 'POST',
        body: JSON.stringify({
          title,
          problem: problem || '-',
          solution: solution || '-',
          appetite,
          author_id: currentMemberId,
          status: 'raw',
          rabbit_holes: [],
          no_gos: [],
        }),
      })
    }),
    onEditPitch: (pitchId) => runAndRefresh(async () => {
      const title = window.prompt('Nouveau titre')
      if (!title) return
      await apiRequest(`/api/v1/lab/pitches/${pitchId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      })
    }),
    onDeletePitch: (pitchId) => runAndRefresh(async () => {
      if (!window.confirm('Supprimer ce pitch ?')) return
      await apiRequest(`/api/v1/lab/pitches/${pitchId}`, { method: 'DELETE' })
    }),
    onPlaceBet: (pitchId, teamMemberIds) => runAndRefresh(async () => {
      const activeCycle = (data?.cycles || []).find((cycle) => cycle.status === 'active' || cycle.status === 'cooldown')
      if (!activeCycle) throw new Error('Aucun cycle actif/cooldown')

      await apiRequest('/api/v1/lab/bets', {
        method: 'POST',
        body: JSON.stringify({
          pitch_id: pitchId,
          cycle_id: activeCycle.id,
          team_member_ids: teamMemberIds,
          placed_by_id: currentMemberId,
          status: 'pending',
        }),
      })
    }),
    onRemoveBet: (betId) => runAndRefresh(() =>
      apiRequest(`/api/v1/lab/bets/${betId}`, { method: 'DELETE' })
    ),
    onCreateScope: (pitchId) => runAndRefresh(async () => {
      const name = window.prompt('Nom du scope')
      if (!name) return
      await apiRequest(`/api/v1/lab/pitches/${pitchId}/scopes`, {
        method: 'POST',
        body: JSON.stringify({ name, description: '', hill_position: 0 }),
      })
    }),
    onUpdateHillPosition: (scopeId, position) => runAndRefresh(() =>
      apiRequest(`/api/v1/lab/scopes/${scopeId}/hill-position`, {
        method: 'PATCH',
        body: JSON.stringify({ position }),
      })
    ),
    onAddTask: (scopeId) => runAndRefresh(async () => {
      const title = window.prompt('Titre de la tache')
      if (!title) return
      await apiRequest(`/api/v1/lab/scopes/${scopeId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title, is_nice_to_have: false, completed: false }),
      })
    }),
    onToggleTask: (_scopeId, taskId) => runAndRefresh(() =>
      apiRequest(`/api/v1/lab/tasks/${taskId}/toggle`, { method: 'PATCH' })
    ),
    onAddChowderItem: (pitchId) => runAndRefresh(async () => {
      const title = window.prompt('Item chowder')
      if (!title) return
      await apiRequest(`/api/v1/lab/pitches/${pitchId}/chowder-items`, {
        method: 'POST',
        body: JSON.stringify({ title, created_by_id: currentMemberId }),
      })
    }),
    onMoveChowderToScope: (chowderItemId, scopeId) => runAndRefresh(() =>
      apiRequest('/api/v1/lab/chowder-items/move-to-scope', {
        method: 'POST',
        body: JSON.stringify({ chowder_item_id: chowderItemId, scope_id: scopeId }),
      })
    ),
    onAddIdea: (listId, title) => runAndRefresh(() =>
      apiRequest('/api/v1/lab/idea-items', {
        method: 'POST',
        body: JSON.stringify({ idea_list_id: listId, title }),
      })
    ),
    onVoteIdea: (_listId, ideaId) => runAndRefresh(() =>
      apiRequest('/api/v1/lab/idea-items/vote', {
        method: 'POST',
        body: JSON.stringify({ idea_id: ideaId }),
      })
    ),
    onAddMember: () => runAndRefresh(async () => {
      const firstName = window.prompt('Prénom')
      const lastName = window.prompt('Nom')
      const email = window.prompt('Email')
      if (!firstName || !lastName || !email) return

      await apiRequest('/api/v1/lab/members', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          avatar: '',
          status: 'active',
          is_admin: false,
          joined_at: new Date().toISOString().slice(0, 10),
          roles: ['designer'],
          guild_ids: [],
        }),
      })
    }),
    onEditMember: (memberId) => runAndRefresh(async () => {
      const firstName = window.prompt('Nouveau prénom')
      if (!firstName) return
      await apiRequest(`/api/v1/lab/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ first_name: firstName }),
      })
    }),
    onTransferSemos: (toWalletId, amount, description) => runAndRefresh(() => {
      const fromWalletId = (data?.wallets || []).find((wallet) => wallet.memberId === currentMemberId)?.id
      if (!fromWalletId) throw new Error('Portefeuille courant introuvable')

      return apiRequest('/api/v1/lab/semos/transfer', {
        method: 'POST',
        body: JSON.stringify({ from_wallet_id: fromWalletId, to_wallet_id: toWalletId, amount, description }),
      })
    }),
    onEmitSemos: (walletId, amount, reason, description) => runAndRefresh(() =>
      apiRequest('/api/v1/lab/semos/emissions', {
        method: 'POST',
        body: JSON.stringify({ wallet_id: walletId, amount, reason, description, created_by_id: currentMemberId }),
      })
    ),
    onUpdateRate: (rateId, amount) => runAndRefresh(() =>
      apiRequest(`/api/v1/lab/semos/rates/${rateId}`, {
        method: 'PATCH',
        body: JSON.stringify({ amount }),
      })
    ),
    onCreateTimesheet: () => runAndRefresh(async () => {
      const hours = Number(window.prompt('Heures', '1'))
      const description = window.prompt('Description', 'Prestation')
      if (!hours || !description) return

      await apiRequest('/api/v1/lab/timesheets', {
        method: 'POST',
        body: JSON.stringify({
          member_id: currentMemberId,
          date: new Date().toISOString().slice(0, 10),
          hours,
          payment_type: 'invoice',
          category: 'design',
          description,
          invoiced: false,
          kilometers: 0,
        }),
      })
    }),
    onEditTimesheet: (timesheetId) => runAndRefresh(async () => {
      const description = window.prompt('Nouvelle description')
      if (!description) return
      await apiRequest(`/api/v1/lab/timesheets/${timesheetId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description }),
      })
    }),
    onDeleteTimesheet: (timesheetId) => runAndRefresh(async () => {
      if (!window.confirm('Supprimer cette prestation ?')) return
      await apiRequest(`/api/v1/lab/timesheets/${timesheetId}`, { method: 'DELETE' })
    }),
    onMarkInvoiced: (timesheetId) => runAndRefresh(() =>
      apiRequest(`/api/v1/lab/timesheets/${timesheetId}/mark-invoiced`, { method: 'PATCH' })
    ),
    onCreateEvent: () => runAndRefresh(async () => {
      const title = window.prompt('Titre de l\'événement')
      if (!title) return
      const now = new Date()
      const end = new Date(now.getTime() + 60 * 60 * 1000)

      await apiRequest('/api/v1/lab/events', {
        method: 'POST',
        body: JSON.stringify({
          title,
          event_type: 'project_meeting',
          start_date: now.toISOString(),
          end_date: end.toISOString(),
          location: 'Lab',
          description: '',
          attendee_ids: [currentMemberId],
        }),
      })
    }),
    onEditEvent: (eventId) => runAndRefresh(async () => {
      const title = window.prompt('Nouveau titre')
      if (!title) return
      await apiRequest(`/api/v1/lab/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      })
    }),
    onDeleteEvent: (eventId) => runAndRefresh(async () => {
      if (!window.confirm('Supprimer cet événement ?')) return
      await apiRequest(`/api/v1/lab/events/${eventId}`, { method: 'DELETE' })
    }),
  }), [currentMemberId, data, runAndRefresh])

  if (loading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1>{milestone}</h1>
        <p>Chargement...</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1>{milestone}</h1>
        <p style={{ color: '#b91c1c' }}>Erreur: {error || 'Données indisponibles'}</p>
        <button type="button" onClick={loadOverview}>Réessayer</button>
      </main>
    )
  }

  return (
    <main>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e7e5e4', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {SECTION_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #d6d3d1',
              background: tab === item.id ? '#5B5781' : '#ffffff',
              color: tab === item.id ? '#ffffff' : '#1c1917',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={loadOverview}
          disabled={busy}
          style={{ marginLeft: 'auto', padding: '0.45rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #d6d3d1', background: '#fff' }}
        >
          {busy ? 'Sync...' : 'Rafraîchir'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1.25rem', background: '#fee2e2', color: '#7f1d1d', borderBottom: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {tab === 'dashboard' && (
        <Dashboard
          members={data.members}
          cycles={data.cycles}
          guilds={data.guilds}
          pitches={data.pitches}
          bets={data.bets}
          scopes={data.scopes}
          events={data.events}
          wallets={data.wallets}
          semosTransactions={data.semosTransactions}
          semosEmissions={data.semosEmissions}
          currentMemberId={currentMemberId}
          onCreateEvent={callbacks.onCreateEvent}
        />
      )}

      {tab === 'shapeup' && (
        <ShapeUpWorkboard
          members={data.members}
          cycles={data.cycles}
          pitches={data.pitches}
          bets={data.bets}
          scopes={data.scopes}
          chowderItems={data.chowderItems}
          ideaLists={data.ideaLists}
          hillChartSnapshots={data.hillChartSnapshots}
          currentMemberId={currentMemberId}
          onCreatePitch={callbacks.onCreatePitch}
          onEditPitch={callbacks.onEditPitch}
          onDeletePitch={callbacks.onDeletePitch}
          onPlaceBet={callbacks.onPlaceBet}
          onRemoveBet={callbacks.onRemoveBet}
          onCreateScope={callbacks.onCreateScope}
          onUpdateHillPosition={callbacks.onUpdateHillPosition}
          onAddTask={callbacks.onAddTask}
          onToggleTask={callbacks.onToggleTask}
          onAddChowderItem={callbacks.onAddChowderItem}
          onMoveChowderToScope={callbacks.onMoveChowderToScope}
          onAddIdea={callbacks.onAddIdea}
          onVoteIdea={callbacks.onVoteIdea}
        />
      )}

      {tab === 'members' && (
        <MemberList
          members={data.members}
          guilds={data.guilds}
          wallets={data.wallets}
          currentMemberId={currentMemberId}
          onAddMember={callbacks.onAddMember}
          onEditMember={callbacks.onEditMember}
        />
      )}

      {tab === 'semos' && (
        <SemosDashboard
          members={data.members}
          wallets={data.wallets}
          transactions={data.semosTransactions}
          emissions={data.semosEmissions}
          rates={data.semosRates}
          currentMemberId={currentMemberId}
          onTransferSemos={callbacks.onTransferSemos}
          onEmitSemos={callbacks.onEmitSemos}
          onUpdateRate={callbacks.onUpdateRate}
        />
      )}

      {tab === 'timesheets' && (
        <TimesheetList
          timesheets={data.timesheets}
          members={data.members}
          guilds={data.guilds}
          currentMemberId={currentMemberId}
          isAdmin={Boolean(currentMember?.isAdmin)}
          onCreateTimesheet={callbacks.onCreateTimesheet}
          onEditTimesheet={callbacks.onEditTimesheet}
          onDeleteTimesheet={callbacks.onDeleteTimesheet}
          onMarkInvoiced={callbacks.onMarkInvoiced}
        />
      )}

      {tab === 'calendar' && (
        <CalendarView
          events={data.events}
          cycles={data.cycles}
          members={data.members}
          currentMemberId={currentMemberId}
          onCreateEvent={callbacks.onCreateEvent}
          onEditEvent={callbacks.onEditEvent}
          onDeleteEvent={callbacks.onDeleteEvent}
        />
      )}
    </main>
  )
}
