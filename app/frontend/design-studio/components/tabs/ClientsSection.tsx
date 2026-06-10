import { useState, useEffect, useCallback } from 'react'
import { Contact, Star, Trash2, Loader2 } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { EmptyState } from '../shared/EmptyState'
import { ContactPicker, type ContactPickerSelection } from '../shared/ContactPicker'

interface ClientContact {
  id: string
  contactId: string
  name: string
  email: string
  phone: string
  isPrimary: boolean
  position: number
}

// Section « Clients / porteurs » d'un projet design : liste les contacts
// clients (badge « Principal »), permet d'en ajouter (existant ou inline via
// ContactPicker), de définir le principal et de retirer (avec confirmation).
// Composant autonome : il gère son propre état via les endpoints clients.
export function ClientsSection({ projectId }: { projectId: string }) {
  const [clients, setClients] = useState<ClientContact[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiRequest(`/api/v1/design/${projectId}/clients`)
      setClients(data?.items || [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const addClient = async (payload: ContactPickerSelection) => {
    setBusy(true)
    setError(null)
    try {
      const data = await apiRequest(`/api/v1/design/${projectId}/clients`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setClients(data?.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'ajouter le client")
    } finally {
      setBusy(false)
    }
  }

  const setPrimary = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      const data = await apiRequest(`/api/v1/design/${projectId}/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_primary: true }),
      })
      setClients(data?.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de définir le principal')
    } finally {
      setBusy(false)
    }
  }

  const removeClient = async (id: string) => {
    if (!window.confirm('Retirer ce client du projet ? Le contact n’est pas supprimé.')) return
    setBusy(true)
    setError(null)
    try {
      const data = await apiRequest(`/api/v1/design/${projectId}/clients/${id}`, {
        method: 'DELETE',
      })
      setClients(data?.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de retirer le client')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="relative">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-100 text-sky-700">
          <Contact className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-900 tracking-tight">
            Clients / porteurs
          </h2>
          <p className="text-sm text-stone-500">
            Les contacts à l’origine du projet — le principal pilote les coordonnées client
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-stone-50/30 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="p-5 border-b border-stone-100 bg-white/60">
          <ContactPicker
            onSelect={addClient}
            excludeContactIds={clients.map((c) => c.contactId)}
            busy={busy}
          />
        </div>

        {error && (
          <div className="px-5 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        <div className="p-5 min-h-[120px]">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-stone-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={<Contact className="w-10 h-10 text-stone-400" />}
              title="Aucun client lié"
              description="Ajoutez le ou les porteurs du projet via la recherche ci-dessus."
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="rounded-xl border border-stone-200 bg-white p-4 flex items-start justify-between gap-3 group hover:border-stone-300/80 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-stone-900 truncate">
                        {client.name || '(sans nom)'}
                      </p>
                      {client.isPrimary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700">
                          <Star className="w-3 h-3 fill-sky-500 text-sky-500" />
                          Principal
                        </span>
                      )}
                    </div>
                    {client.email && (
                      <p className="text-xs text-stone-500 truncate mt-1">{client.email}</p>
                    )}
                    {client.phone && (
                      <p className="text-xs text-stone-400 truncate">{client.phone}</p>
                    )}
                    {!client.isPrimary && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPrimary(client.id)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#5B5781] hover:underline disabled:opacity-50"
                      >
                        <Star className="w-3.5 h-3.5" />
                        Définir comme principal
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeClient(client.id)}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 disabled:opacity-50"
                    title="Retirer du projet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
