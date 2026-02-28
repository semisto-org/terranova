import { useState, useEffect, useMemo } from 'react'
import { Users, Trash2, MapPin, Loader2, Camera } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import type { TeamMember, TeamRole } from '../../types'
import { EmptyState } from '../shared/EmptyState'

interface ProjectAddress {
  street?: string
  number?: string
  city?: string
  postcode?: string
  countryName?: string
  coordinates?: { lat: number; lng: number }
  googlePhotosUrl?: string | null
}

const roleLabels: Record<TeamRole, string> = {
  'project-manager': 'Project Manager',
  designer: 'Designer',
  butineur: 'Butineur',
}

const roleBadgeClass: Record<TeamRole, string> = {
  'project-manager': 'bg-[#AFBD00]/20 text-[#6B7A00]',
  designer: 'bg-[#5B5781]/20 text-[#5B5781]',
  butineur: 'bg-stone-100 text-stone-700',
}

interface SemistoMember {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface SettingsTabProps {
  project: ProjectAddress
  teamMembers: TeamMember[]
  projectPhase: string
  projectId: string
  onUpdateAddress: (values: {
    street: string
    number: string
    city: string
    postcode: string
    country_name: string
    latitude: number
    longitude: number
  }) => void
  onAddTeamMember: (values: {
    member_id: string
    role: TeamRole
    is_paid: boolean
  }) => void
  onRemoveTeamMember: (memberId: string) => void
}

export function SettingsTab({
  project,
  teamMembers,
  projectPhase,
  projectId,
  onUpdateAddress,
  onAddTeamMember,
  onRemoveTeamMember,
}: SettingsTabProps) {
  const [members, setMembers] = useState<SemistoMember[]>([])
  const [addressForm, setAddressForm] = useState({
    street: project.street || '',
    number: project.number || '',
    city: project.city || '',
    postcode: project.postcode || '',
    country_name: project.countryName || '',
    latitude: project.coordinates?.lat != null ? String(project.coordinates.lat) : '',
    longitude: project.coordinates?.lng != null ? String(project.coordinates.lng) : '',
  })
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [addressSaving, setAddressSaving] = useState(false)
  const [googlePhotosUrl, setGooglePhotosUrl] = useState(project.googlePhotosUrl || '')
  const [photosSaving, setPhotosSaving] = useState(false)
  const [photosNotice, setPhotosNotice] = useState<string | null>(null)
  const [form, setForm] = useState({
    member_id: '',
    role: 'designer' as TeamRole,
    is_paid: true,
  })

  useEffect(() => {
    apiRequest('/api/v1/lab/members')
      .then((data: { items?: SemistoMember[] }) => setMembers(data?.items ?? []))
      .catch(() => setMembers([]))
  }, [])

  useEffect(() => {
    setGooglePhotosUrl(project.googlePhotosUrl || '')
  }, [project.googlePhotosUrl])

  const handleSaveGooglePhotos = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhotosSaving(true)
    setPhotosNotice(null)
    try {
      await apiRequest(`/api/v1/design/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ google_photos_url: googlePhotosUrl }),
      })
      setPhotosNotice('Lien album sauvegardé.')
      setTimeout(() => setPhotosNotice(null), 3000)
    } catch {
      setPhotosNotice('Erreur lors de la sauvegarde.')
    } finally {
      setPhotosSaving(false)
    }
  }

  useEffect(() => {
    setAddressForm({
      street: project.street || '',
      number: project.number || '',
      city: project.city || '',
      postcode: project.postcode || '',
      country_name: project.countryName || '',
      latitude: project.coordinates?.lat != null ? String(project.coordinates.lat) : '',
      longitude: project.coordinates?.lng != null ? String(project.coordinates.lng) : '',
    })
  }, [project.street, project.number, project.city, project.postcode, project.countryName, project.coordinates?.lat, project.coordinates?.lng])

  const buildAddress = () => {
    const parts = [addressForm.street, addressForm.number, addressForm.postcode, addressForm.city, addressForm.country_name].filter(Boolean)
    return parts.join(', ')
  }

  const geocodeAddress = async () => {
    const addr = buildAddress()
    if (!addr.trim()) {
      setGeocodeError('Saisissez une adresse avant de géolocaliser.')
      return
    }
    setGeocoding(true)
    setGeocodeError(null)
    try {
      const data = await apiRequest(`/api/v1/geocoding?address=${encodeURIComponent(addr.trim())}`)
      const results = data?.results || []
      if (results.length > 0) {
        setAddressForm((p) => ({
          ...p,
          latitude: parseFloat(results[0].lat).toFixed(6),
          longitude: parseFloat(results[0].lng).toFixed(6),
        }))
      } else {
        setGeocodeError('Aucun résultat trouvé pour cette adresse.')
      }
    } catch (err) {
      setGeocodeError(err instanceof Error ? err.message : 'Erreur lors de la géolocalisation.')
    } finally {
      setGeocoding(false)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddressSaving(true)
    setGeocodeError(null)
    try {
      await onUpdateAddress({
        street: addressForm.street,
        number: addressForm.number,
        city: addressForm.city,
        postcode: addressForm.postcode,
        country_name: addressForm.country_name,
        latitude: parseFloat(addressForm.latitude) || 0,
        longitude: parseFloat(addressForm.longitude) || 0,
      })
    } catch (err) {
      setGeocodeError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.')
    } finally {
      setAddressSaving(false)
    }
  }

  const assignedMemberIds = useMemo(
    () => new Set(teamMembers.map((m) => m.memberId)),
    [teamMembers]
  )

  const availableMembers = useMemo(() => {
    return members
      .filter((m) => !assignedMemberIds.has(m.id))
      .sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase()
        return nameA.localeCompare(nameB)
      })
  }, [members, assignedMemberIds])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.member_id) return
    onAddTeamMember(form)
    setForm({ member_id: '', role: 'designer', is_paid: true })
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const inputClass =
    'rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent transition-shadow'
  const labelClass = 'text-xs font-medium text-stone-500 uppercase tracking-wider'

  return (
    <div className="space-y-8">
      {/* Section: Adresse & géolocalisation */}
      <section className="relative">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#5B5781]/10 text-[#5B5781]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900 tracking-tight">
              Adresse du site
            </h2>
            <p className="text-sm text-stone-500">
              Lieu du projet et coordonnées GPS pour la carte
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-white via-stone-50/20 to-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <form onSubmit={handleSaveAddress} className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1.5 sm:col-span-2">
                <span className={labelClass}>Rue</span>
                <input
                  type="text"
                  className={inputClass}
                  value={addressForm.street}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, street: e.target.value }))
                  }
                  placeholder="Ex. Rue des Lilas"
                />
              </label>
              <label className="grid gap-1.5">
                <span className={labelClass}>Numéro</span>
                <input
                  type="text"
                  className={inputClass}
                  value={addressForm.number}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, number: e.target.value }))
                  }
                  placeholder="Ex. 42"
                />
              </label>
              <label className="grid gap-1.5">
                <span className={labelClass}>Code postal</span>
                <input
                  type="text"
                  className={inputClass}
                  value={addressForm.postcode}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, postcode: e.target.value }))
                  }
                  placeholder="Ex. 1000"
                />
              </label>
              <label className="grid gap-1.5">
                <span className={labelClass}>Localité</span>
                <input
                  type="text"
                  className={inputClass}
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, city: e.target.value }))
                  }
                  placeholder="Ex. Bruxelles"
                />
              </label>
              <label className="grid gap-1.5">
                <span className={labelClass}>Pays</span>
                <input
                  type="text"
                  className={inputClass}
                  value={addressForm.country_name}
                  onChange={(e) =>
                    setAddressForm((p) => ({
                      ...p,
                      country_name: e.target.value,
                    }))
                  }
                  placeholder="Ex. Belgique"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={geocoding || !buildAddress().trim()}
                onClick={geocodeAddress}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {geocoding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4 text-[#5B5781]" />
                )}
                {geocoding ? 'Recherche…' : "Géolocaliser l'adresse"}
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <label className="grid gap-1 min-w-[100px]">
                  <span className={labelClass}>Latitude</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={inputClass}
                    value={addressForm.latitude}
                    onChange={(e) => {
                      setAddressForm((p) => ({ ...p, latitude: e.target.value }))
                      setGeocodeError(null)
                    }}
                    placeholder="50.8503"
                  />
                </label>
                <label className="grid gap-1 min-w-[100px]">
                  <span className={labelClass}>Longitude</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={inputClass}
                    value={addressForm.longitude}
                    onChange={(e) => {
                      setAddressForm((p) => ({
                        ...p,
                        longitude: e.target.value,
                      }))
                      setGeocodeError(null)
                    }}
                    placeholder="4.3517"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={addressSaving}
                className="rounded-xl bg-[#AFBD00] px-5 py-2.5 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] disabled:opacity-60 transition-colors shadow-sm"
              >
                {addressSaving ? 'Enregistrement…' : 'Enregistrer l\'adresse'}
              </button>
            </div>

            {geocodeError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                {geocodeError}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Section: Album photo */}
      <section className="relative">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EF9B0D]/10 text-[#EF9B0D]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900 tracking-tight">
              Album photo
            </h2>
            <p className="text-sm text-stone-500">
              Lien Google Photos visible dans le portail client
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-white via-stone-50/20 to-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <form onSubmit={handleSaveGooglePhotos} className="p-5 flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 flex-1 min-w-[200px]">
              <span className={labelClass}>URL Google Photos</span>
              <input
                type="url"
                className={inputClass}
                value={googlePhotosUrl}
                onChange={(e) => setGooglePhotosUrl(e.target.value)}
                placeholder="https://photos.app.goo.gl/..."
              />
            </label>
            <button
              type="submit"
              disabled={photosSaving}
              className="rounded-xl bg-[#AFBD00] px-5 py-2.5 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] disabled:opacity-60 transition-colors shadow-sm"
            >
              {photosSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {photosNotice && (
              <span className="text-xs text-emerald-600 font-medium">{photosNotice}</span>
            )}
          </form>
        </div>
      </section>

      {/* Section: Équipe */}
      <section className="relative">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#e1e6d8]/80 text-[#6B7A00]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900 tracking-tight">
              Équipe projet
            </h2>
            <p className="text-sm text-stone-500">
              Gérer les membres assignés au projet
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-stone-50/30 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="p-5 border-b border-stone-100 bg-white/60">
            <form
              onSubmit={handleSubmit}
              className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3"
            >
              <select
                value={form.member_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, member_id: e.target.value }))
                }
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent sm:col-span-2"
                required
              >
                <option value="">Choisir un membre Semisto</option>
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {[m.firstName, m.lastName].filter(Boolean).join(' ') ||
                      m.email}
                  </option>
                ))}
              </select>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((p) => ({ ...p, role: e.target.value as TeamRole }))
                }
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
              >
                <option value="project-manager">Project Manager</option>
                <option value="designer">Designer</option>
                <option value="butineur">Butineur</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.is_paid}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, is_paid: e.target.checked }))
                  }
                  className="rounded border-stone-300 text-[#AFBD00] focus:ring-[#AFBD00]"
                />
                Rémunéré
              </label>
              <button
                type="submit"
                className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors shadow-sm"
              >
                Ajouter
              </button>
            </form>
          </div>

          <div className="p-5 min-h-[120px]">
            {teamMembers.length === 0 ? (
              <EmptyState
                icon={<Users className="w-10 h-10 text-stone-400" />}
                title="Aucun membre assigné"
                description="Ajoutez des membres à l'équipe projet pour suivre les rôles et les contributions."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-xl border border-stone-200 bg-white p-4 flex items-start justify-between gap-3 group hover:border-stone-300/80 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-[#e1e6d8] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {member.memberAvatar ? (
                          <img
                            src={member.memberAvatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-semibold text-[#6B7A00]">
                            {(member.memberName || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 truncate">
                          {member.memberName}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass[member.role]}`}
                          >
                            {roleLabels[member.role]}
                          </span>
                          {member.isPaid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              Rémunéré
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                              Bénévole
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">
                          Assigné le {formatDate(member.assignedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveTeamMember(member.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
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
    </div>
  )
}
