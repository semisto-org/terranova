import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import {
  MemberList,
  SemosDashboard,
  TimesheetList,
  TimesheetForm,
  EventTypesAdmin,
  MemberForm,
  ExpenseList,
  RevenueList,
  RevenueDetailModal,
} from '../../lab-management/components'
import { ExpenseFormModal } from '../../components/shared/ExpenseFormModal'
import { RevenueFormModal } from '../../components/shared/RevenueFormModal'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

const SECTION_TABS = [
  { id: 'members', label: 'Membres' },
  { id: 'timesheets', label: 'Timesheets' },
  { id: 'expenses', label: 'Dépenses' },
  { id: 'revenues', label: 'Recettes' },
  { id: 'semos', label: 'Semos' },
  { id: 'event-types', label: 'Types d\'événements' },
]

export default function AdminSettings({ currentMemberId: initialMemberId }) {
  const [tab, setTab] = useState('members')
  useShellNav({ sections: SECTION_TABS, activeSection: tab, onSectionChange: setTab })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const [detailModal, setDetailModal] = useState(null)
  const [timesheetFormModal, setTimesheetFormModal] = useState(null)
  const [memberForm, setMemberForm] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [expenseFormModal, setExpenseFormModal] = useState(null)
  const [revenues, setRevenues] = useState([])
  const [revenuesLoading, setRevenuesLoading] = useState(false)
  const [revenueFormModal, setRevenueFormModal] = useState(null)
  const [revenueDetailModal, setRevenueDetailModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const loadOverview = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const payload = await apiRequest('/api/v1/lab/overview')
      setData(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const loadExpenses = useCallback(async () => {
    setExpensesLoading(true)
    try {
      const res = await apiRequest('/api/v1/lab/expenses')
      setExpenses(res.items || [])
    } catch {
      setExpenses([])
    } finally {
      setExpensesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'expenses') loadExpenses()
  }, [tab, loadExpenses])

  const loadRevenues = useCallback(async () => {
    setRevenuesLoading(true)
    try {
      const res = await apiRequest('/api/v1/lab/revenues')
      setRevenues(res.items || [])
    } catch {
      setRevenues([])
    } finally {
      setRevenuesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'revenues') loadRevenues()
  }, [tab, loadRevenues])

  const members = data?.members || []
  const timesheets = data?.timesheets || []

  const currentMemberId = useMemo(() => {
    if (initialMemberId && members.some((m) => m.id === initialMemberId)) return initialMemberId
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

  const showDetailFromApi = useCallback(async (title, path) => {
    setBusy(true)
    setError(null)
    try {
      const payload = await apiRequest(path)
      setDetailModal({ title, data: payload })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [])

  const callbacks = useMemo(() => ({
    onAddMember: () => {
      setMemberForm({
        member: null,
        onSubmit: async (values) => {
          const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          if (values.avatar_file) {
            const body = new FormData()
            body.append('first_name', values.first_name)
            body.append('last_name', values.last_name)
            body.append('email', values.email)
            body.append('avatar_image', values.avatar_file)
            body.append('status', 'active')
            body.append('is_admin', String(values.is_admin))
            body.append('joined_at', new Date().toISOString().slice(0, 10))
            values.roles.forEach((role) => body.append('roles[]', role))
            const response = await fetch('/api/v1/lab/members', {
              method: 'POST',
              headers: { 'X-CSRF-Token': csrfToken },
              body,
            })
            if (!response.ok) {
              const data = await response.json().catch(() => ({}))
              throw new Error(data.error || `${response.status} ${response.statusText}`)
            }
          } else {
            await apiRequest('/api/v1/lab/members', {
              method: 'POST',
              body: JSON.stringify({
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                avatar: '',
                status: 'active',
                is_admin: values.is_admin,
                joined_at: new Date().toISOString().slice(0, 10),
                roles: values.roles,
                guild_ids: [],
              }),
            })
          }
        },
      })
    },

    onEditMember: (memberId) => {
      const member = members.find((item) => item.id === memberId)
      if (!member) return
      setMemberForm({
        member,
        onSubmit: async (values) => {
          const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          if (values.remove_avatar && !values.avatar_file) {
            const removeResp = await fetch(`/api/v1/lab/members/${memberId}/avatar`, {
              method: 'DELETE',
              headers: { 'X-CSRF-Token': csrfToken },
            })
            if (!removeResp.ok) {
              const data = await removeResp.json().catch(() => ({}))
              throw new Error(data.error || 'Erreur lors de la suppression de l\'avatar')
            }
          }
          if (values.avatar_file) {
            const body = new FormData()
            body.append('first_name', values.first_name)
            body.append('last_name', values.last_name)
            body.append('is_admin', String(values.is_admin))
            body.append('avatar_image', values.avatar_file)
            values.roles.forEach((role) => body.append('roles[]', role))
            const response = await fetch(`/api/v1/lab/members/${memberId}`, {
              method: 'PATCH',
              headers: { 'X-CSRF-Token': csrfToken },
              body,
            })
            if (!response.ok) {
              const data = await response.json().catch(() => ({}))
              throw new Error(data.error || `${response.status} ${response.statusText}`)
            }
          } else {
            await apiRequest(`/api/v1/lab/members/${memberId}`, {
              method: 'PATCH',
              body: JSON.stringify({
                first_name: values.first_name,
                last_name: values.last_name,
                is_admin: values.is_admin,
                roles: values.roles,
              }),
            })
          }
        },
      })
    },

    onViewMember: (memberId) => showDetailFromApi('Détail membre', `/api/v1/lab/members/${memberId}`),

    onTransferSemos: (toWalletId, amount, description) =>
      runAndRefresh(() => {
        const fromWalletId = (data?.wallets || []).find((wallet) => wallet.memberId === currentMemberId)?.id
        if (!fromWalletId) throw new Error('Portefeuille courant introuvable')
        return apiRequest('/api/v1/lab/semos/transfer', {
          method: 'POST',
          body: JSON.stringify({ from_wallet_id: fromWalletId, to_wallet_id: toWalletId, amount, description }),
        })
      }),

    onEmitSemos: (walletId, amount, reason, description) =>
      runAndRefresh(() =>
        apiRequest('/api/v1/lab/semos/emissions', {
          method: 'POST',
          body: JSON.stringify({ wallet_id: walletId, amount, reason, description, created_by_id: currentMemberId }),
        })
      ),

    onUpdateRate: (rateId, amount) =>
      runAndRefresh(() =>
        apiRequest(`/api/v1/lab/semos/rates/${rateId}`, {
          method: 'PATCH',
          body: JSON.stringify({ amount }),
        })
      ),

    onCreateTimesheet: () => setTimesheetFormModal({ timesheet: null }),
    onEditTimesheet: (timesheetId) => {
      const timesheet = timesheets.find((item) => item.id === timesheetId)
      if (timesheet) setTimesheetFormModal({ timesheet })
    },

    onDeleteTimesheet: (timesheetId) => {
      setDeleteConfirm({
        title: 'Supprimer cette prestation ?',
        message: 'Cette prestation sera supprimée définitivement.',
        action: () => runAndRefresh(() => apiRequest(`/api/v1/lab/timesheets/${timesheetId}`, { method: 'DELETE' })),
      })
    },

    onMarkInvoiced: (timesheetId) =>
      runAndRefresh(() =>
        apiRequest(`/api/v1/lab/timesheets/${timesheetId}/mark-invoiced`, { method: 'PATCH' })
      ),

    onCreateExpense: () => setExpenseFormModal({ expense: null }),
    onEditExpense: (expense) => setExpenseFormModal({ expense }),
    onDeleteExpense: (expenseId) => {
      setDeleteConfirm({
        title: 'Supprimer cette dépense ?',
        message: 'Cette dépense sera supprimée définitivement.',
        action: () => runAndRefresh(async () => {
          await apiRequest(`/api/v1/lab/expenses/${expenseId}`, { method: 'DELETE' })
          loadExpenses()
        }),
      })
    },

    onCreateRevenue: () => setRevenueFormModal({ revenue: null }),
    onEditRevenue: (revenue) => setRevenueFormModal({ revenue }),
    onViewRevenue: (revenue) => setRevenueDetailModal(revenue),
    onDeleteRevenue: (revenueId) => {
      setDeleteConfirm({
        title: 'Supprimer cette recette ?',
        message: 'Cette recette sera supprimée définitivement.',
        action: () => runAndRefresh(async () => {
          await apiRequest(`/api/v1/lab/revenues/${revenueId}`, { method: 'DELETE' })
          loadRevenues()
        }),
      })
    },

    onViewGuild: (guildId) => {
      const guild = (data?.guilds || []).find((item) => item.id === guildId)
      if (!guild) return
      setDetailModal({ title: 'Détail guilde', data: guild })
    },
  }), [currentMemberId, data, loadExpenses, loadRevenues, members, runAndRefresh, showDetailFromApi, timesheets])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-stone-500">Chargement...</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-8">
        <p className="text-red-700">Erreur: {error || 'Données indisponibles'}</p>
        <button type="button" onClick={loadOverview} className="mt-2 text-sm underline text-stone-600">Réessayer</button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      {error && (
        <div style={{ padding: '0.75rem 1.25rem', background: '#fee2e2', color: '#7f1d1d', borderBottom: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {tab === 'members' && (
        <MemberList
          members={data.members}
          guilds={data.guilds}
          wallets={data.wallets}
          currentMemberId={currentMemberId}
          onAddMember={callbacks.onAddMember}
          onViewMember={callbacks.onViewMember}
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

      {tab === 'expenses' && (
        <ExpenseList
          expenses={expenses}
          loading={expensesLoading}
          onCreateExpense={callbacks.onCreateExpense}
          onEditExpense={callbacks.onEditExpense}
          onDeleteExpense={callbacks.onDeleteExpense}
          trainingOptions={[]}
          designProjectOptions={[]}
        />
      )}

      {tab === 'revenues' && (
        <RevenueList
          revenues={revenues}
          loading={revenuesLoading}
          onCreateRevenue={callbacks.onCreateRevenue}
          onEditRevenue={callbacks.onEditRevenue}
          onDeleteRevenue={callbacks.onDeleteRevenue}
          onViewRevenue={callbacks.onViewRevenue}
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
          onViewMember={callbacks.onViewMember}
          onViewGuild={callbacks.onViewGuild}
        />
      )}

      {tab === 'event-types' && (
        <EventTypesAdmin busy={busy} />
      )}

      {detailModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={() => setDetailModal(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl border border-stone-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-stone-200">
              <h2 className="text-xl font-bold text-stone-900 m-0">{detailModal.title}</h2>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">
              <pre className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs overflow-auto max-h-full">
                {JSON.stringify(detailModal.data, null, 2)}
              </pre>
            </div>
            <div className="shrink-0 px-4 py-3 border-t border-stone-200 flex justify-end">
              <button type="button" onClick={() => setDetailModal(null)} className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-700 font-medium">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {timesheetFormModal && (
        <TimesheetForm
          timesheet={timesheetFormModal.timesheet}
          onSubmit={async (values) => {
            setBusy(true)
            setError(null)
            try {
              if (timesheetFormModal.timesheet) {
                await apiRequest(`/api/v1/lab/timesheets/${timesheetFormModal.timesheet.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ description: values.description }),
                })
              } else {
                await apiRequest('/api/v1/lab/timesheets', {
                  method: 'POST',
                  body: JSON.stringify({
                    member_id: currentMemberId,
                    date: values.date,
                    hours: Number(values.hours),
                    payment_type: values.payment_type,
                    category: values.category,
                    description: values.description,
                    invoiced: false,
                    kilometers: Number(values.kilometers || 0),
                  }),
                })
              }
              setTimesheetFormModal(null)
              await loadOverview()
            } catch (err) {
              setError(err.message)
            } finally {
              setBusy(false)
            }
          }}
          onCancel={() => setTimesheetFormModal(null)}
          busy={busy}
        />
      )}

      {memberForm && (
        <MemberForm
          member={memberForm.member}
          onSubmit={async (values) => {
            await runAndRefresh(async () => {
              await memberForm.onSubmit(values)
            })
            setMemberForm(null)
          }}
          onCancel={() => setMemberForm(null)}
          busy={busy}
        />
      )}

      {deleteConfirm && (
        <ConfirmDeleteModal
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          onConfirm={() => {
            deleteConfirm.action()
            setDeleteConfirm(null)
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {expenseFormModal && (
        <ExpenseFormModal
          expense={expenseFormModal.expense}
          contactOptions={(data?.contacts || []).map((c) => ({ id: c.id, name: c.name, contactType: c.contactType }))}
          onCreateContact={async ({ name, contact_type }) => {
            const contact = await apiRequest('/api/v1/lab/contacts', {
              method: 'POST',
              body: JSON.stringify({ name, contact_type }),
            })
            return { id: contact.id, name: contact.name, contactType: contact.contactType }
          }}
          showTrainingLink={true}
          showDesignProjectLink={true}
          trainingOptions={[]}
          designProjectOptions={[]}
          accentColor="#64748B"
          onSubmit={async (payload) => {
            const isEdit = Boolean(expenseFormModal.expense?.id)
            const documentFile = payload.document
            const body = {
              supplier: payload.supplier,
              supplier_contact_id: payload.supplier_contact_id,
              status: payload.status,
              invoice_date: payload.invoice_date,
              category: payload.category,
              expense_type: payload.expense_type,
              billing_zone: payload.billing_zone,
              payment_date: payload.payment_date || null,
              payment_type: payload.payment_type || null,
              amount_excl_vat: payload.amount_excl_vat,
              vat_rate: payload.vat_rate || null,
              vat_6: payload.vat_6,
              vat_12: payload.vat_12,
              vat_21: payload.vat_21,
              total_incl_vat: payload.total_incl_vat,
              eu_vat_rate: payload.eu_vat_rate || null,
              eu_vat_amount: payload.eu_vat_amount,
              paid_by: payload.paid_by || null,
              reimbursed: payload.reimbursed,
              reimbursement_date: payload.reimbursement_date || null,
              billable_to_client: payload.billable_to_client,
              rebilling_status: payload.rebilling_status || null,
              name: payload.name || '',
              notes: payload.notes || '',
              poles: payload.poles || [],
              training_id: payload.training_id || null,
              design_project_id: payload.design_project_id || null,
            }
            setBusy(true)
            setError(null)
            try {
              if (documentFile) {
                const formData = new FormData()
                Object.entries(body).forEach(([k, v]) => {
                  if (v === null || v === undefined) return
                  if (Array.isArray(v)) v.forEach((x) => formData.append(`${k}[]`, x))
                  else formData.append(k, v)
                })
                if (documentFile instanceof File) formData.append('document', documentFile)
                const url = isEdit ? `/api/v1/lab/expenses/${expenseFormModal.expense.id}` : '/api/v1/lab/expenses'
                await apiRequest(url, {
                  method: isEdit ? 'PATCH' : 'POST',
                  body: formData,
                })
              } else {
                const url = isEdit ? `/api/v1/lab/expenses/${expenseFormModal.expense.id}` : '/api/v1/lab/expenses'
                await apiRequest(url, {
                  method: isEdit ? 'PATCH' : 'POST',
                  body: JSON.stringify(body),
                })
              }
              setExpenseFormModal(null)
              await loadExpenses()
            } catch (err) {
              setError(err.message)
              throw err
            } finally {
              setBusy(false)
            }
          }}
          onCancel={() => setExpenseFormModal(null)}
          busy={busy}
        />
      )}

      {revenueDetailModal && (
        <RevenueDetailModal
          revenue={revenueDetailModal}
          onClose={() => setRevenueDetailModal(null)}
          onEdit={() => {
            const rev = revenueDetailModal
            setRevenueDetailModal(null)
            setRevenueFormModal({ revenue: rev })
          }}
        />
      )}

      {revenueFormModal && (
        <RevenueFormModal
          revenue={revenueFormModal.revenue}
          contacts={(data?.contacts || []).map((c) => ({ value: c.id, label: c.name }))}
          onSave={async (formData) => {
            setBusy(true)
            try {
              const existing = revenueFormModal.revenue
              if (existing) {
                await apiRequest(`/api/v1/lab/revenues/${existing.id}`, { method: 'PATCH', body: JSON.stringify(formData) })
              } else {
                await apiRequest('/api/v1/lab/revenues', { method: 'POST', body: JSON.stringify(formData) })
              }
              setRevenueFormModal(null)
              loadRevenues()
            } catch (err) {
              alert(err.message || 'Erreur')
            } finally {
              setBusy(false)
            }
          }}
          onCancel={() => setRevenueFormModal(null)}
          busy={busy}
        />
      )}
    </div>
  )
}
