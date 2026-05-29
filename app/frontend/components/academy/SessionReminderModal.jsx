import { useState, useEffect, useCallback } from 'react'
import { X, Eye, Send, Loader2, Mail, Users } from 'lucide-react'
import SimpleEditor from '@/components/SimpleEditor'
import { apiRequest } from '@/lib/api'

// Composer d'envoi du rappel de session : deux zones custom (intro / bonus),
// un aperçu live de l'email rendu (iframe), un envoi de test, puis l'envoi à
// tous les inscrits. Le reste de l'email (logistique) vient des champs de la
// session et de la page MySemisto — pas besoin de le saisir ici.
export default function SessionReminderModal({ session, onClose }) {
  const [introHtml, setIntroHtml] = useState('')
  const [bonusHtml, setBonusHtml] = useState('')
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const clean = (html) => (html === '<p></p>' ? '' : html)

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true)
    setError(null)
    try {
      const data = await apiRequest(`/api/v1/academy/sessions/${session.id}/reminder/preview`, {
        method: 'POST',
        body: JSON.stringify({ intro_html: clean(introHtml), bonus_html: clean(bonusHtml) }),
      })
      setPreview(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingPreview(false)
    }
  }, [session.id, introHtml, bonusHtml])

  // First preview on open so the coordinator immediately sees the auto-generated body.
  useEffect(() => {
    loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  const sendTest = async () => {
    if (!testEmail.trim()) return
    setSending(true)
    setError(null)
    try {
      await apiRequest(`/api/v1/academy/sessions/${session.id}/reminder/send`, {
        method: 'POST',
        body: JSON.stringify({ intro_html: clean(introHtml), bonus_html: clean(bonusHtml), test_email: testEmail.trim() }),
      })
      setResult({ test: true, email: testEmail.trim() })
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const sendToAll = async () => {
    const count = preview?.recipients?.length || 0
    if (!window.confirm(`Envoyer le rappel à ${count} inscrit${count > 1 ? 's' : ''} ? Cette action est définitive.`)) return
    setSending(true)
    setError(null)
    try {
      const data = await apiRequest(`/api/v1/academy/sessions/${session.id}/reminder/send`, {
        method: 'POST',
        body: JSON.stringify({ intro_html: clean(introHtml), bonus_html: clean(bonusHtml) }),
      })
      setResult({ sent: data.sent })
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const recipientCount = preview?.recipients?.length || 0

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-5xl bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[92vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 bg-gradient-to-br from-red-50 to-white flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
                Envoyer le rappel de session
              </h3>
              <p className="text-sm text-stone-500 mt-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {recipientCount} inscrit{recipientCount > 1 ? 's' : ''} recevront cet email
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {result ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-stone-900">
                {result.test ? `Email de test envoyé à ${result.email}` : `Rappel envoyé à ${result.sent} inscrit${result.sent > 1 ? 's' : ''} 🎉`}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                {result.test && (
                  <button onClick={() => setResult(null)} className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50">
                    Continuer
                  </button>
                )}
                <button onClick={onClose} className="px-5 py-2 rounded-xl text-white bg-[#B01A19] hover:bg-[#8f1514]">
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2">
              {/* Left: editor */}
              <div className="overflow-y-auto p-6 border-r border-stone-200 space-y-5">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Intro</label>
                  <p className="text-xs text-stone-400 mb-2">Le mot d'accueil, le portrait du formateur… ta voix.</p>
                  <SimpleEditor content={introHtml} onUpdate={setIntroHtml} minHeight="120px" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Les bonus du moment</label>
                  <p className="text-xs text-stone-400 mb-2">Annonces ponctuelles : autres activités, infos diverses…</p>
                  <SimpleEditor content={bonusHtml} onUpdate={setBonusHtml} minHeight="120px" />
                </div>

                <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-xs text-stone-500">
                  Le lieu, le rendez-vous, les repas, l'hébergement, le sac et le covoiturage sont repris
                  automatiquement depuis la session et la page participant — pas besoin de les saisir ici.
                </div>

                <button
                  onClick={loadPreview}
                  disabled={loadingPreview}
                  className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 disabled:opacity-50"
                >
                  {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Rafraîchir l'aperçu
                </button>

                {/* Test send */}
                <div className="pt-4 border-t border-stone-200">
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Envoyer un test</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="ton@email.be"
                      className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30"
                    />
                    <button
                      onClick={sendTest}
                      disabled={sending || !testEmail.trim()}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 disabled:opacity-50 shrink-0"
                    >
                      <Mail className="w-4 h-4" />
                      Test
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: live preview */}
              <div className="overflow-y-auto bg-stone-100 p-4 flex flex-col min-h-[300px]">
                {preview?.subject && (
                  <p className="text-xs text-stone-500 mb-2 px-1">
                    <span className="font-semibold">Objet :</span> {preview.subject}
                  </p>
                )}
                <div className="flex-1 rounded-xl overflow-hidden border border-stone-300 bg-white">
                  {loadingPreview && !preview ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                    </div>
                  ) : (
                    <iframe title="Aperçu de l'email" srcDoc={preview?.html || ''} className="w-full h-full min-h-[400px]" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          {!result && (
            <div className="shrink-0 px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-end gap-3">
              <button onClick={onClose} disabled={sending} className="px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 disabled:opacity-50">
                Annuler
              </button>
              <button
                onClick={sendToAll}
                disabled={sending || recipientCount === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-white bg-[#B01A19] hover:bg-[#8f1514] disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer à tous ({recipientCount})
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
