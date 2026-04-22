import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useUrlState } from '@/hooks/useUrlState'
import { apiRequest } from '@/lib/api'
import { useShellNav } from '../../components/shell/ShellContext'
import {
  MemberList,
  SemosDashboard,
  TimesheetList,
  TimesheetForm,
  MemberForm,
  ExpenseList,
  RevenueList,
  RevenueDetailModal,
  AlbumList,
  ContactList,
  ContactDetail,
  ContactForm,
  BankSection,
  ShopSection,
  CashSection,
  ExpenseNoteList,
  ExpenseNoteForm,
  OrganizationList,
  OrganizationForm,
} from '../../lab-management/components'
import { ExpenseFormModal } from '../../components/shared/ExpenseFormModal'
import { RevenueFormModal } from '../../components/shared/RevenueFormModal'
import { ExpenseCategoriesAdmin } from '../../lab-management/components/ExpenseCategoriesAdmin'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

const SECTION_TABS = [
  { id: 'members', label: 'Membres' },
  { id: 'timesheets', label: 'Timesheets' },
  { id: 'expenses', label: 'Dépenses' },
  { id: 'revenues', label: 'Recettes' },
  { id: 'shop', label: 'Shop' },
  { id: 'cash', label: 'Caisse' },
  { id: 'semos', label: 'Semos' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'albums', label: 'Albums' },
  { id: 'bank', label: 'Banque' },
  { id: 'expense_notes', label: 'Notes de frais' },
  { id: 'organizations', label: 'Structures' },
]

export default function AdminSettings({ currentMemberId: initialMemberId }) {
  const [tab, setTab] = useUrlState('tab', 'members')
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
  const [expenseLinkOptions, setExpenseLinkOptions] = useState({ trainings: [], designProjects: [] })
  const [expenseCategories, setExpenseCategories] = useState([])
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false)
  const [revenues, setRevenues] = useState([])
  const [revenuesLoading, setRevenuesLoading] = useState(false)
  const [revenueFormModal, setRevenueFormModal] = useState(null)
  const [revenueDetailModal, setRevenueDetailModal] = useState(null)
  const [contactDetailModal, setContactDetailModal] = useState(null)
  const [contactFormModal, setContactFormModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [expenseNotes, setExpenseNotes] = useState([])
  const [expenseNotesLoading, setExpenseNotesLoading] = useState(false)
  const [expenseNoteFormModal, setExpenseNoteFormModal] = useState(null)
  const [organizations, setOrganizations] = useState([])
  const [organizationFormModal, setOrganizationFormModal] = useState(null)

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

  const loadExpenseCategories = useCallback(async () => {
    try {
      const res = await apiRequest('/api/v1/lab/expense-categories')
      setExpenseCategories((res.items || []).map((c) => ({ id: c.id, label: c.label })))
    } catch {
      setExpenseCategories([])
    }
  }, [])

  useEffect(() => {
    if (tab === 'expenses') {
      loadExpenses()
      loadExpenseCategories()
    }
  }, [tab, loadExpenses, loadExpenseCategories])

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

  const loadExpenseNotes = useCallback(async () => {
    setExpenseNotesLoading(true)
    try {
      const res = await apiRequest('/api/v1/expense_notes')
      setExpenseNotes(res.items || [])
    } catch {
      setExpenseNotes([])
    } finally {
      setExpenseNotesLoading(false)
    }
  }, [])

  const loadOrganizations = useCallback(async () => {
    try {
      const res = await apiRequest('/api/v1/organizations')
      setOrganizations(res.items || [])
    } catch {
      setOrganizations([])
    }
  }, [])

  useEffect(() => {
    if (tab === 'expense_notes') {
      loadExpenseNotes()
      loadOrganizations()
    }
    if (tab === 'organizations') loadOrganizations()
    if (tab === 'expenses' || tab === 'revenues') loadOrganizations()
  }, [tab, loadExpenseNotes, loadOrganizations])

  useEffect(() => {
    // Pre-load project link options when the modal is about to open or is open.
    // The modal itself also self-loads these if the parent doesn't supply them,
    // so this is a perf optimisation to avoid the brief empty-state flash.
    if (!expenseFormModal) return
    let cancelled = false

    ;(async () => {
      try {
        const [academyPayload, designPayload] = await Promise.all([
          apiRequest('/api/v1/academy'),
          apiRequest('/api/v1/design'),
        ])
        if (cancelled) return
        setExpenseLinkOptions({
          trainings: (academyPayload?.trainings || []).map((t) => ({ value: t.id, label: t.title })),
          designProjects: (designPayload?.projects || []).map((p) => ({ value: p.id, label: p.name })),
        })
      } catch {
        if (!cancelled) setExpenseLinkOptions({ trainings: [], designProjects: [] })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [expenseFormModal])

  const members = data?.members || []
  const timesheets = data?.timesheets || []
  const contacts = data?.contacts || []

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
            body.append('status', values.status)
            body.append('is_admin', String(values.is_admin))
            body.append('joined_at', new Date().toISOString().slice(0, 10))
            body.append('membership_type', values.membership_type)
            body.append('member_kind', 'human')
            values.roles.forEach((role) => body.append('roles[]', role))
            const response = await fetch('/api/v1/lab/members', {
              method: 'POST',
              headers: { 'X-CSRF-Token': csrfToken },
              body,
            })
            if (!response.ok) {
              const d = await response.json().catch(() => ({}))
              throw new Error(d.error || `${response.status} ${response.statusText}`)
            }
          } else {
            await apiRequest('/api/v1/lab/members', {
              method: 'POST',
              body: JSON.stringify({
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                avatar: '',
                status: values.status,
                is_admin: values.is_admin,
                joined_at: new Date().toISOString().slice(0, 10),
                membership_type: values.membership_type,
                member_kind: 'human',
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
              const d = await removeResp.json().catch(() => ({}))
              throw new Error(d.error || "Erreur lors de la suppression de l'avatar")
            }
          }
          if (values.avatar_file) {
            const body = new FormData()
            body.append('first_name', values.first_name)
            body.append('last_name', values.last_name)
            body.append('is_admin', String(values.is_admin))
            body.append('status', values.status)
            body.append('membership_type', values.membership_type)
            body.append('slack_user_id', values.slack_user_id)
            body.append('avatar_image', values.avatar_file)
            values.roles.forEach((role) => body.append('roles[]', role))
            const response = await fetch(`/api/v1/lab/members/${memberId}`, {
              method: 'PATCH',
              headers: { 'X-CSRF-Token': csrfToken },
              body,
            })
            if (!response.ok) {
              const d = await response.json().catch(() => ({}))
              throw new Error(d.error || `${response.status} ${response.statusText}`)
            }
          } else {
            await apiRequest(`/api/v1/lab/members/${memberId}`, {
              method: 'PATCH',
              body: JSON.stringify({
                first_name: values.first_name,
                last_name: values.last_name,
                is_admin: values.is_admin,
                status: values.status,
                membership_type: values.membership_type,
                slack_user_id: values.slack_user_id,
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
    onInlineExpenseUpdate: async (expenseId, changes) => {
      const payload = {
        ...(changes.status ? { status: changes.status } : {}),
        ...(Object.prototype.hasOwnProperty.call(changes, 'categoryId')
          ? { expense_category_id: changes.categoryId || null }
          : Object.prototype.hasOwnProperty.call(changes, 'category')
            ? { category: changes.category || '' }
            : {}),
        ...(changes.poles ? { poles: changes.poles } : {}),
        ...(Object.prototype.hasOwnProperty.call(changes, 'reimbursed')
          ? { reimbursed: changes.reimbursed }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(changes, 'reimbursementDate')
          ? { reimbursement_date: changes.reimbursementDate }
          : Object.prototype.hasOwnProperty.call(changes, 'reimbursement_date')
            ? { reimbursement_date: changes.reimbursement_date }
            : {}),
      }
      if (!Object.keys(payload).length) return
      await runAndRefresh(async () => {
        await apiRequest(`/api/v1/lab/expenses/${expenseId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        await loadExpenses()
      })
    },
    onBulkExpenseUpdate: async (ids, changes) => {
      const payload = {
        ...(changes.status ? { status: changes.status } : {}),
        ...(Object.prototype.hasOwnProperty.call(changes, 'categoryId')
          ? { expense_category_id: changes.categoryId || null }
          : Object.prototype.hasOwnProperty.call(changes, 'category')
            ? { category: changes.category || '' }
            : {}),
        ...(changes.poles ? { poles: changes.poles } : {}),
      }
      if (!Object.keys(payload).length || !ids?.length) return
      await runAndRefresh(async () => {
        await Promise.all(ids.map((id) => apiRequest(`/api/v1/lab/expenses/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })))
        await loadExpenses()
      })
    },
    onBulkExpenseDelete: (ids) => {
      if (!ids?.length) return
      setDeleteConfirm({
        title: `Supprimer ${ids.length} dépenses ?`,
        message: 'Cette action est définitive. Confirmez la suppression en lot.',
        action: () => runAndRefresh(async () => {
          await Promise.all(ids.map((id) => apiRequest(`/api/v1/lab/expenses/${id}`, { method: 'DELETE' })))
          await loadExpenses()
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

    onUpdateRevenue: (revenueId, patch) =>
      runAndRefresh(async () => {
        const body = {
          status: patch.status,
          pole: patch.pole,
          category: patch.category,
          date: patch.date,
          amount_excl_vat: patch.amountExclVat,
          amount: patch.amount,
        }
        await apiRequest(`/api/v1/lab/revenues/${revenueId}`, { method: 'PATCH', body: JSON.stringify(body) })
        await loadRevenues()
      }),

    onBulkUpdateRevenues: async (ids, patch) => {
      await runAndRefresh(async () => {
        const body = {
          status: patch.status,
          pole: patch.pole,
          category: patch.category,
          date: patch.date,
        }
        await Promise.all(ids.map((id) => apiRequest(`/api/v1/lab/revenues/${id}`, { method: 'PATCH', body: JSON.stringify(body) })))
        await loadRevenues()
      })
    },

    onViewGuild: (guildId) => {
      const guild = (data?.guilds || []).find((item) => item.id === guildId)
      if (!guild) return
      setDetailModal({ title: 'Détail guilde', data: guild })
    },

    onCreateContact: () => setContactFormModal({ contact: null }),
    onViewContact: async (contactId) => {
      setBusy(true)
      try {
        const payload = await apiRequest(`/api/v1/lab/contacts/${contactId}`)
        setContactDetailModal({ contact: payload.contact, linkedActivities: payload.linkedActivities })
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(false)
      }
    },
    onEditContact: (contactId) => {
      const contact = contacts.find((c) => c.id === contactId)
      setContactFormModal({ contact: contact || null })
    },
    onDeleteContact: (contactId) => {
      const contact = contacts.find((c) => c.id === contactId)
      setDeleteConfirm({
        title: 'Supprimer ce contact ?',
        message: `Le contact « ${contact?.name || ''} » sera supprimé définitivement.`,
        action: () => runAndRefresh(() => apiRequest(`/api/v1/lab/contacts/${contactId}`, { method: 'DELETE' })),
      })
    },
  }), [contacts, currentMemberId, data, loadExpenses, loadRevenues, members, runAndRefresh, showDetailFromApi, timesheets])

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
          categories={expenseCategories}
          isAdmin={Boolean(currentMember?.isAdmin)}
          onCreateExpense={callbacks.onCreateExpense}
          onEditExpense={callbacks.onEditExpense}
          onDeleteExpense={callbacks.onDeleteExpense}
          onInlineUpdate={callbacks.onInlineExpenseUpdate}
          onBulkUpdate={callbacks.onBulkExpenseUpdate}
          onBulkDelete={callbacks.onBulkExpenseDelete}
          onManageCategories={() => setCategoriesModalOpen(true)}
          trainingOptions={expenseLinkOptions.trainings}
          designProjectOptions={expenseLinkOptions.designProjects}
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
          onUpdateRevenue={callbacks.onUpdateRevenue}
          onBulkUpdateRevenues={callbacks.onBulkUpdateRevenues}
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

      {tab === 'contacts' && (
        <ContactList
          contacts={contacts}
          onCreateContact={callbacks.onCreateContact}
          onViewContact={callbacks.onViewContact}
          onEditContact={callbacks.onEditContact}
          onDeleteContact={callbacks.onDeleteContact}
        />
      )}

      {tab === 'albums' && (
        <AlbumList
          albums={data?.albums ?? []}
          onRefresh={() => loadOverview(false)}
        />
      )}

      {tab === 'bank' && <BankSection />}

      {tab === 'shop' && <ShopSection />}

      {tab === 'cash' && <CashSection />}

      {tab === 'expense_notes' && (
        <ExpenseNoteList
          notes={expenseNotes}
          loading={expenseNotesLoading}
          onCreate={() => setExpenseNoteFormModal({ note: null })}
          onOpen={async (id) => {
            try {
              const note = await apiRequest(`/api/v1/expense_notes/${id}`)
              setExpenseNoteFormModal({ note })
            } catch (err) {
              setError(err.message)
            }
          }}
          onDelete={(id) => {
            const note = expenseNotes.find((n) => n.id === id)
            setDeleteConfirm({
              title: 'Supprimer cette note de frais ?',
              message: `La note ${note?.number || ''} sera supprimée définitivement.`,
              action: async () => {
                try {
                  await apiRequest(`/api/v1/expense_notes/${id}`, { method: 'DELETE' })
                  await loadExpenseNotes()
                } catch (err) {
                  setError(err.message)
                }
              },
            })
          }}
        />
      )}

      {tab === 'organizations' && (
        <OrganizationList
          organizations={organizations}
          onCreate={() => setOrganizationFormModal({ organization: null })}
          onEdit={(id) => {
            const org = organizations.find((o) => o.id === id)
            setOrganizationFormModal({ organization: org || null })
          }}
          onDelete={(id) => {
            const org = organizations.find((o) => o.id === id)
            setDeleteConfirm({
              title: 'Supprimer cette structure ?',
              message: `La structure « ${org?.name || ''} » sera supprimée (ou archivée si elle est rattachée à des notes).`,
              action: async () => {
                try {
                  await apiRequest(`/api/v1/organizations/${id}`, { method: 'DELETE' })
                  await loadOrganizations()
                } catch (err) {
                  setError(err.message)
                }
              },
            })
          }}
        />
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
          categoryOptions={expenseCategories}
          organizationOptions={organizations.map((o) => ({ value: o.id, label: o.name, vatSubject: o.vatSubject }))}
          defaultOrganizationId={organizations.find((o) => o.isDefault)?.id || null}
          onCreateContact={async ({ name, contact_type }) => {
            const contact = await apiRequest('/api/v1/lab/contacts', {
              method: 'POST',
              body: JSON.stringify({ name, contact_type }),
            })
            return { id: contact.id, name: contact.name, contactType: contact.contactType }
          }}
          showTrainingLink={true}
          showDesignProjectLink={true}
          trainingOptions={expenseLinkOptions.trainings}
          designProjectOptions={expenseLinkOptions.designProjects}
          accentColor="#64748B"
          onSubmit={async (payload) => {
            const isEdit = Boolean(expenseFormModal.expense?.id)
            const documentFile = payload.document
            const body = {
              supplier: payload.supplier,
              supplier_contact_id: payload.supplier_contact_id,
              status: payload.status,
              invoice_date: payload.invoice_date,
              expense_category_id: payload.expense_category_id ?? null,
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
              organization_id: payload.organization_id || null,
              project_allocations: payload.project_allocations || [],
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

      <ExpenseCategoriesAdmin
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        onCategoriesChanged={async () => {
          await loadExpenseCategories()
          await loadExpenses()
        }}
      />

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
          organizations={organizations.map((o) => ({ value: o.id, label: o.name, vatSubject: o.vatSubject }))}
          defaultOrganizationId={organizations.find((o) => o.isDefault)?.id || null}
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

      {contactDetailModal && (
        <ContactDetail
          contact={contactDetailModal.contact}
          linkedActivities={contactDetailModal.linkedActivities}
          onClose={() => setContactDetailModal(null)}
          onEdit={() => {
            setContactDetailModal(null)
            callbacks.onEditContact(contactDetailModal.contact.id)
          }}
        />
      )}

      {expenseNoteFormModal && (
        <ExpenseNoteForm
          initialValues={
            expenseNoteFormModal.note
              ? {
                  id: expenseNoteFormModal.note.id,
                  number: expenseNoteFormModal.note.number,
                  subject: expenseNoteFormModal.note.subject,
                  noteDate: expenseNoteFormModal.note.noteDate,
                  status: expenseNoteFormModal.note.status,
                  contactId: expenseNoteFormModal.note.contactId,
                  organizationId: expenseNoteFormModal.note.organizationId,
                  notes: expenseNoteFormModal.note.notes || '',
                  lines: (expenseNoteFormModal.note.lines || []).map((l) => ({
                    id: l.id,
                    label: l.label,
                    quantity: l.quantity,
                    unitAmountCents: l.unitAmountCents,
                    position: l.position,
                  })),
                }
              : undefined
          }
          contacts={contacts.map((c) => ({ id: c.id, name: c.name }))}
          organizations={organizations.map((o) => ({ id: o.id, name: o.name, isDefault: o.isDefault }))}
          busy={busy}
          onSave={async (values) => {
            setBusy(true)
            setError(null)
            try {
              const payload = {
                expense_note: {
                  subject: values.subject,
                  note_date: values.noteDate,
                  contact_id: values.contactId,
                  organization_id: values.organizationId,
                  notes: values.notes,
                  lines_attributes: values.lines.map((l, idx) => ({
                    id: l.id,
                    label: l.label,
                    quantity: l.quantity,
                    unit_amount_cents: l.unitAmountCents,
                    position: idx,
                    _destroy: l._destroy ? '1' : undefined,
                  })),
                },
              }
              if (values.id) {
                const updated = await apiRequest(`/api/v1/expense_notes/${values.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify(payload),
                })
                setExpenseNoteFormModal({ note: updated })
              } else {
                await apiRequest('/api/v1/expense_notes', {
                  method: 'POST',
                  body: JSON.stringify(payload),
                })
                setExpenseNoteFormModal(null)
              }
              await loadExpenseNotes()
            } catch (err) {
              setError(err.message)
              throw err
            } finally {
              setBusy(false)
            }
          }}
          onTransition={async (status) => {
            if (!expenseNoteFormModal.note?.id) return
            setBusy(true)
            try {
              const updated = await apiRequest(`/api/v1/expense_notes/${expenseNoteFormModal.note.id}/update_status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
              })
              setExpenseNoteFormModal({ note: updated })
              await loadExpenseNotes()
            } catch (err) {
              setError(err.message)
            } finally {
              setBusy(false)
            }
          }}
          onDownloadPdf={() => {
            if (!expenseNoteFormModal.note?.id) return
            window.open(`/api/v1/expense_notes/${expenseNoteFormModal.note.id}/pdf?download=1`, '_blank')
          }}
          onCancel={() => setExpenseNoteFormModal(null)}
        />
      )}

      {organizationFormModal && (
        <OrganizationForm
          organization={organizationFormModal.organization}
          busy={busy}
          onSave={async (values) => {
            setBusy(true)
            setError(null)
            try {
              const orgId = organizationFormModal.organization?.id
              const url = orgId ? `/api/v1/organizations/${orgId}` : '/api/v1/organizations'
              const method = orgId ? 'PATCH' : 'POST'
              const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

              if (values.logoFile || values.removeLogo) {
                const body = new FormData()
                body.append('organization[name]', values.name)
                body.append('organization[legal_form]', values.legalForm || '')
                body.append('organization[registration_number]', values.registrationNumber || '')
                body.append('organization[address]', values.address || '')
                body.append('organization[iban]', values.iban || '')
                body.append('organization[email]', values.email || '')
                body.append('organization[phone]', values.phone || '')
                body.append('organization[is_default]', String(values.isDefault))
                body.append('organization[vat_subject]', String(values.vatSubject))
                if (values.logoFile) body.append('logo', values.logoFile)
                if (values.removeLogo) body.append('remove_logo', 'true')
                const resp = await fetch(url, { method, headers: { 'X-CSRF-Token': csrfToken }, body })
                if (!resp.ok) {
                  const d = await resp.json().catch(() => ({}))
                  throw new Error(d.error || `${resp.status} ${resp.statusText}`)
                }
              } else {
                await apiRequest(url, {
                  method,
                  body: JSON.stringify({
                    organization: {
                      name: values.name,
                      legal_form: values.legalForm,
                      registration_number: values.registrationNumber,
                      address: values.address,
                      iban: values.iban,
                      email: values.email,
                      phone: values.phone,
                      is_default: values.isDefault,
                      vat_subject: values.vatSubject,
                    },
                  }),
                })
              }
              setOrganizationFormModal(null)
              await loadOrganizations()
            } catch (err) {
              setError(err.message)
              throw err
            } finally {
              setBusy(false)
            }
          }}
          onCancel={() => setOrganizationFormModal(null)}
        />
      )}

      {contactFormModal && (
        <ContactForm
          contact={contactFormModal.contact}
          organizations={contacts.filter((c) => c.contactType === 'organization')}
          onSubmit={async (values) => {
            const payload = {
              contact_type: values.contactType,
              name: values.name,
              email: values.email,
              phone: values.phone,
              address: values.address,
              organization_type: values.organizationType,
              organization_id: values.organizationId || null,
              notes: values.notes,
              notes_html: values.notesHtml,
              tag_names: values.tagNames,
              iban: values.iban,
            }
            setBusy(true)
            setError(null)
            try {
              if (contactFormModal.contact) {
                await apiRequest(`/api/v1/lab/contacts/${contactFormModal.contact.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify(payload),
                })
              } else {
                await apiRequest('/api/v1/lab/contacts', {
                  method: 'POST',
                  body: JSON.stringify(payload),
                })
              }
              setContactFormModal(null)
              await loadOverview()
            } catch (err) {
              setError(err.message)
            } finally {
              setBusy(false)
            }
          }}
          onCancel={() => setContactFormModal(null)}
          busy={busy}
        />
      )}
    </div>
  )
}
