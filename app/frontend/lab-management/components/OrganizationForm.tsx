import { useEffect, useRef, useState } from 'react'
import { Building2, Trash2, Upload, X } from 'lucide-react'
import type { OrganizationItem } from './OrganizationList'

export interface OrganizationFormValues {
  name: string
  legalForm: string
  registrationNumber: string
  address: string
  iban: string
  email: string
  phone: string
  isDefault: boolean
  vatSubject: boolean
  logoFile?: File | null
  removeLogo?: boolean
}

export interface OrganizationFormProps {
  organization?: OrganizationItem | null
  busy?: boolean
  onSave: (values: OrganizationFormValues) => Promise<void> | void
  onCancel: () => void
}

export function OrganizationForm({ organization, busy = false, onSave, onCancel }: OrganizationFormProps) {
  const [values, setValues] = useState<OrganizationFormValues>({
    name: organization?.name ?? '',
    legalForm: organization?.legalForm ?? '',
    registrationNumber: organization?.registrationNumber ?? '',
    address: organization?.address ?? '',
    iban: organization?.iban ?? '',
    email: organization?.email ?? '',
    phone: organization?.phone ?? '',
    isDefault: organization?.isDefault ?? false,
    vatSubject: organization?.vatSubject ?? true,
    logoFile: null,
    removeLogo: false,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(organization?.logoUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoChange = (file: File | null) => {
    if (file) {
      setValues((v) => ({ ...v, logoFile: file, removeLogo: false }))
      const reader = new FileReader()
      reader.onload = (e) => setLogoPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setValues((v) => ({ ...v, logoFile: null, removeLogo: true }))
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const update = (patch: Partial<OrganizationFormValues>) => setValues((v) => ({ ...v, ...patch }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!values.name.trim()) return setError('Le nom est requis.')
    try {
      await onSave(values)
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(28, 25, 23, 0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 px-6 pt-6 pb-4 border-b border-stone-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#5B5781] font-semibold">Administration</p>
              <h2 className="mt-1 text-xl font-bold text-stone-900 tracking-tight">
                {organization ? 'Modifier la structure' : 'Nouvelle structure'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>
            )}

            <Field label="Logo">
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-20 h-20 rounded-xl object-contain bg-white border border-stone-200 p-2"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-stone-50 border border-dashed border-stone-300 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-stone-400" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 bg-white text-stone-700 hover:border-[#5B5781] hover:text-[#5B5781] transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {logoPreview ? 'Remplacer' : 'Téléverser'}
                  </button>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-[10px] text-stone-400">PNG ou JPEG — apparaît dans l'en-tête des notes de frais.</p>
                </div>
              </div>
            </Field>

            <Field label="Nom de la structure" required>
              <input value={values.name} onChange={(e) => update({ name: e.target.value })} className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Forme juridique">
                <input
                  value={values.legalForm}
                  onChange={(e) => update({ legalForm: e.target.value })}
                  placeholder="ASBL, SRL…"
                  className={inputCls}
                />
              </Field>
              <Field label="N° BCE">
                <input
                  value={values.registrationNumber}
                  onChange={(e) => update({ registrationNumber: e.target.value })}
                  placeholder="BE0000000000"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Adresse">
              <textarea
                value={values.address}
                onChange={(e) => update({ address: e.target.value })}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field label="IBAN">
              <input
                value={values.iban}
                onChange={(e) => update({ iban: e.target.value })}
                placeholder="BE00 0000 0000 0000"
                className={`${inputCls} font-mono`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => update({ email: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Téléphone">
                <input value={values.phone} onChange={(e) => update({ phone: e.target.value })} className={inputCls} />
              </Field>
            </div>

            <label className="flex items-center gap-3 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={values.isDefault}
                onChange={(e) => update({ isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-stone-300 text-[#5B5781] focus:ring-[#5B5781]"
              />
              <span className="text-sm text-stone-700">Définir comme structure par défaut</span>
            </label>

            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-2">
              <div className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Régime TVA</div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.vatSubject}
                  onChange={(e) => update({ vatSubject: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-stone-300 text-[#5B5781] focus:ring-[#5B5781]"
                />
                <span className="text-sm text-stone-700">
                  <span className="font-medium">Assujettie à la TVA</span>
                  <span className="block text-xs text-stone-500 mt-0.5">
                    Décochez si la structure est en franchise de TVA (ne récupère ni ne déclare la TVA).
                  </span>
                </span>
              </label>
            </div>
          </div>

          <footer className="shrink-0 px-6 py-4 border-t border-stone-200 bg-stone-50/60 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-[#5B5781] text-white shadow-md shadow-[#5B5781]/20 hover:bg-[#4a4669] hover:shadow-lg hover:shadow-[#5B5781]/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {busy ? 'Enregistrement…' : organization ? 'Enregistrer' : 'Créer'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#5B5781] focus:ring-2 focus:ring-[#5B5781]/15 transition-all'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}
