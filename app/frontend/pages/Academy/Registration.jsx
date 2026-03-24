import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CalendarDays, MapPin, Users, Euro, Car, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'

function PaymentForm({ clientSecret, amount, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message)
      setProcessing(false)
      return
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + window.location.pathname + '?status=success',
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message)
      setProcessing(false)
      onError?.(confirmError.message)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess()
    } else if (paymentIntent && paymentIntent.status === 'requires_action') {
      // Redirect handled by Stripe (e.g. Bancontact)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <PaymentElement options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'bancontact'],
        }} />
      </div>
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: '100%',
          padding: '14px 24px',
          backgroundColor: processing ? '#9ca3af' : '#B01A19',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: processing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontFamily: 'var(--font-body)',
        }}
      >
        {processing ? (
          <>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Paiement en cours...
          </>
        ) : (
          <>
            Payer {amount.toFixed(2)} €
          </>
        )}
      </button>
    </form>
  )
}

export default function Registration({ trainingId, stripePublicKey }) {
  const [training, setTraining] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [step, setStep] = useState('form') // form | payment | success | error
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_email: '',
    phone: '',
    departure_city: '',
    departure_postal_code: '',
    departure_country: 'BE',
    carpooling: 'none',
    payment_type: 'full',
    items: {},
  })
  const [formErrors, setFormErrors] = useState({})
  const [clientSecret, setClientSecret] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const stripePromise = useMemo(() => {
    if (stripePublicKey) return loadStripe(stripePublicKey)
    return null
  }, [stripePublicKey])

  // Check for Stripe redirect return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('status') === 'success' || params.get('redirect_status') === 'succeeded') {
      setStep('success')
      setLoading(false)
      return
    }
  }, [])

  useEffect(() => {
    fetch(`/api/v1/public/academy/trainings/${trainingId}`)
      .then(res => {
        if (!res.ok) throw new Error('Activité non disponible')
        return res.json()
      })
      .then(data => {
        setTraining(data)
        if (data.depositAmount > 0) {
          setFormData(prev => ({ ...prev, payment_type: 'full' }))
        }
        setLoading(false)
      })
      .catch(err => {
        if (step === 'success') {
          setLoading(false)
        } else {
          setError(err.message)
          setLoading(false)
        }
      })
  }, [trainingId])

  const fireConfetti = useCallback(() => {
    const end = Date.now() + 1500
    const colors = ['#B01A19', '#16a34a', '#AFBD00', '#234766']
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  useEffect(() => {
    if (step === 'success') fireConfetti()
  }, [step, fireConfetti])

  const validateForm = () => {
    const errors = {}
    if (!formData.contact_name.trim()) errors.contact_name = 'Le nom est requis'
    if (!formData.contact_email.trim()) {
      errors.contact_email = "L'adresse e-mail est requise"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      errors.contact_email = "L'adresse e-mail n'est pas valide"
    }
    if (!formData.phone.trim()) errors.phone = 'Le numéro de téléphone est requis'
    if (!formData.departure_city.trim()) errors.departure_city = 'Le lieu de départ est requis'
    if (hasCategories && !Object.values(formData.items).some((q) => q > 0)) {
      errors.items = 'Veuillez sélectionner au moins une place'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
      const res = await fetch(`/api/v1/public/academy/trainings/${trainingId}/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({
          ...formData,
          items: hasCategories
            ? Object.entries(formData.items)
                .filter(([, qty]) => qty > 0)
                .map(([categoryId, qty]) => ({ category_id: categoryId, quantity: qty }))
            : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      const data = await res.json()
      setClientSecret(data.clientSecret)
      setPaymentAmount(data.amount)
      setStep('payment')
    } catch (err) {
      setFormErrors({ submit: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentSuccess = () => {
    setStep('success')
  }

  const handlePaymentError = (message) => {
    // Error shown by PaymentForm
  }

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingWrapper}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#B01A19' }} />
          <p style={{ color: '#6b7280', marginTop: '16px', fontFamily: 'var(--font-body)' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <AlertCircle size={48} style={{ color: '#dc2626', marginBottom: '16px' }} />
            <h2 style={{ ...styles.heading, color: '#dc2626' }}>Activité non disponible</h2>
            <p style={styles.text}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    const firstSession = training?.sessions?.[0]
    const lastSession = training?.sessions?.[training.sessions.length - 1]
    const locationNames = training?.locations?.map(l => l.name).join(', ')

    return (
      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '24px 16px',
        minHeight: '100vh',
        fontFamily: 'var(--font-body)',
        background: 'linear-gradient(170deg, #1a3a2a 0%, #2d5a3d 35%, #3b7a4a 65%, #4a9a55 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
          @keyframes leafFloat1 { 0%,100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(12px,-18px) rotate(15deg); } }
          @keyframes leafFloat2 { 0%,100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(-10px,-14px) rotate(-12deg); } }
          @keyframes leafFloat3 { 0%,100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(8px,10px) rotate(10deg); } }
        `}</style>

        {/* Floating organic shapes */}
        <div style={{ position: 'absolute', top: '60px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(175, 189, 0, 0.08)', animation: 'leafFloat1 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '200px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', animation: 'leafFloat2 10s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '120px', left: '10px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(175, 189, 0, 0.06)', animation: 'leafFloat3 7s ease-in-out infinite' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px', animation: 'fadeUp 0.6s ease-out both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <img src="/icons/academy.png" alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'rgba(255,255,255,0.7)' }}>Semisto Academy</span>
          </div>
        </div>

        {/* Main celebration */}
        <div style={{
          textAlign: 'center',
          padding: '0 12px',
          marginBottom: '36px',
          animation: 'fadeUp 0.6s ease-out 0.15s both',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(175, 189, 0, 0.15)',
            border: '2px solid rgba(175, 189, 0, 0.3)',
            marginBottom: '24px',
            animation: 'scaleIn 0.5s ease-out 0.3s both',
          }}>
            <CheckCircle size={36} style={{ color: '#AFBD00' }} />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '32px',
            color: '#ffffff',
            margin: '0 0 12px',
            lineHeight: '1.2',
            letterSpacing: '-0.3px',
          }}>
            C'est confirmé !
          </h1>

          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.75)',
            lineHeight: '1.6',
            margin: '0 0 6px',
          }}>
            Ta nouvelle aventure commence ici.
          </p>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: '1.5',
            margin: '0',
          }}>
            Un e-mail de confirmation vient de partir à <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{formData.contact_email}</strong>
          </p>
        </div>

        {/* Training card */}
        {training && (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px',
            animation: 'fadeUp 0.6s ease-out 0.3s both',
          }}>
            {/* Training header band */}
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #B01A19 0%, #8a1413 100%)',
              position: 'relative',
            }}>
              {training.trainingType?.name && (
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.9)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
                  {training.trainingType.name}
                </span>
              )}
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '22px',
                color: '#ffffff',
                margin: '0',
                lineHeight: '1.3',
              }}>
                {training.title}
              </h2>
            </div>

            {/* Details */}
            <div style={{ padding: '20px 24px' }}>
              {firstSession && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                  <CalendarDays size={18} style={{ color: '#B01A19', flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', marginBottom: '2px' }}>Dates</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>
                      {formatDate(firstSession.startDate)}
                      {lastSession && lastSession !== firstSession && ` — ${formatDate(lastSession.endDate)}`}
                    </div>
                  </div>
                </div>
              )}
              {locationNames && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <MapPin size={18} style={{ color: '#B01A19', flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', marginBottom: '2px' }}>Lieu</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>{locationNames}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inspirational message */}
        <div style={{
          textAlign: 'center',
          padding: '24px 20px',
          animation: 'fadeUp 0.6s ease-out 0.45s both',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <img src="/icons/academy.png" alt="" style={{ width: '18px', height: '18px', borderRadius: '3px' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
              En route vers l'ère des forêts comestibles
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingBottom: '24px', animation: 'fadeUp 0.6s ease-out 0.55s both' }}>
          <a
            href="https://www.semisto.org"
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.2)',
              paddingBottom: '1px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          >
            Retour vers semisto.org
          </a>
        </div>
      </div>
    )
  }

  const categories = training.participantCategories || []
  const volumeDiscount = training.volumeDiscount || { perSpot: 10, max: 30 }
  const hasCategories = categories.length > 0

  const computeCatDiscount = (qty) => {
    if (qty <= 1) return 0
    return Math.min(volumeDiscount.perSpot * (qty - 1), volumeDiscount.max)
  }

  const computeCatSubtotal = (price, qty) => {
    const d = computeCatDiscount(qty)
    return +(price * qty * (1 - d / 100)).toFixed(2)
  }

  const itemsTotal = hasCategories
    ? categories.reduce((sum, cat) => {
        const qty = formData.items[cat.id] || 0
        return sum + computeCatSubtotal(cat.price, qty)
      }, 0)
    : training.price

  const depositTotal = hasCategories
    ? categories.reduce((sum, cat) => {
        const qty = formData.items[cat.id] || 0
        if (qty === 0) return sum
        if (cat.depositAmount > 0) return sum + cat.depositAmount * qty
        return sum + computeCatSubtotal(cat.price, qty)
      }, 0)
    : training.depositAmount

  const canPayDeposit = hasCategories
    ? depositTotal > 0 && depositTotal < itemsTotal
    : training.depositAmount > 0 && training.depositAmount < training.price

  const selectedAmount = formData.payment_type === 'deposit' && canPayDeposit
    ? depositTotal
    : itemsTotal

  const hasSelectedItems = hasCategories ? Object.values(formData.items).some((q) => q > 0) : true

  const firstSession = training.sessions?.[0]
  const lastSession = training.sessions?.[training.sessions.length - 1]

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #B01A19 !important; box-shadow: 0 0 0 3px rgba(176, 26, 25, 0.1); }
        [data-radio-card]:focus, [data-radio-card]:focus-within { outline: none !important; box-shadow: none !important; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <img src="/icons/academy.png" alt="Academy" style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }} />
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '20px',
            lineHeight: '28px',
            color: '#B01A19',
          }}>Semisto Academy</span>
        </div>
      </div>

      {/* Training Info Card */}
      <div style={styles.card}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)',
          borderRadius: '12px 12px 0 0',
        }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: '#B01A19',
            color: 'white',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '12px',
            fontFamily: 'var(--font-body)',
          }}>
            {training.trainingType?.name}
          </span>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '28px',
            color: '#1f2937',
            margin: '0 0 8px 0',
          }}>
            {training.title}
          </h1>
          {training.description && (
            <p style={{ ...styles.text, marginTop: '8px' }}>{training.description}</p>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          padding: '20px 24px',
        }}>
          {firstSession && (
            <div style={styles.infoItem}>
              <CalendarDays size={18} style={{ color: '#B01A19' }} />
              <div>
                <div style={styles.infoLabel}>Dates</div>
                <div style={styles.infoValue}>
                  {formatDate(firstSession.startDate)}
                  {lastSession && lastSession !== firstSession && ` — ${formatDate(lastSession.endDate)}`}
                </div>
              </div>
            </div>
          )}
          {training.locations?.length > 0 && (
            <div style={styles.infoItem}>
              <MapPin size={18} style={{ color: '#B01A19' }} />
              <div>
                <div style={styles.infoLabel}>Lieu</div>
                <div style={styles.infoValue}>
                  {training.locations.map(l => l.name).join(', ')}
                </div>
              </div>
            </div>
          )}
          <div style={styles.infoItem}>
            <Euro size={18} style={{ color: '#B01A19' }} />
            <div>
              <div style={styles.infoLabel}>Prix</div>
              <div style={styles.infoValue}>
                {hasCategories ? (
                  categories.length === 1
                    ? <>{categories[0].price.toFixed(2)} €{training.vatRate > 0 && <span style={{ fontSize: '12px', color: '#9ca3af' }}> TTC</span>}</>
                    : <>à partir de {Math.min(...categories.map((c) => c.price)).toFixed(2)} €</>
                ) : (
                  <>{training.price.toFixed(2)} €{training.vatRate > 0 && <span style={{ fontSize: '12px', color: '#9ca3af' }}> TTC</span>}</>
                )}
              </div>
            </div>
          </div>
          {training.spotsRemaining !== null && (
            <div style={styles.infoItem}>
              <Users size={18} style={{ color: '#B01A19' }} />
              <div>
                <div style={styles.infoLabel}>Places</div>
                <div style={styles.infoValue}>
                  {training.spotsRemaining > 0
                    ? `${training.spotsRemaining} place${training.spotsRemaining > 1 ? 's' : ''} restante${training.spotsRemaining > 1 ? 's' : ''}`
                    : 'Complet'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {(hasCategories ? categories.every((c) => c.spotsRemaining <= 0) : training.spotsRemaining === 0) ? (
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
            <h2 style={styles.heading}>Activité complète</h2>
            <p style={styles.text}>
              Cette activité n'a plus de places disponibles. Revenez bientôt pour les prochaines sessions.
            </p>
          </div>
        </div>
      ) : step === 'form' ? (
        /* Registration Form */
        <div style={styles.card}>
          <div style={{ padding: '24px' }}>
            <h2 style={{ ...styles.heading, marginBottom: '24px' }}>Inscription</h2>

            <form onSubmit={handleSubmitForm} data-1p-ignore>
              {/* Personal Info */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Informations personnelles</h3>
                <div style={styles.fieldGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>Nom complet *</label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={e => updateField('contact_name', e.target.value)}
                      style={{
                        ...styles.input,
                        ...(formErrors.contact_name ? styles.inputError : {}),
                      }}
                      placeholder="Jean Dupont"
                    />
                    {formErrors.contact_name && <span style={styles.errorText}>{formErrors.contact_name}</span>}
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Adresse e-mail *</label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={e => updateField('contact_email', e.target.value)}
                      style={{
                        ...styles.input,
                        ...(formErrors.contact_email ? styles.inputError : {}),
                      }}
                      placeholder="jean@exemple.be"
                    />
                    {formErrors.contact_email && <span style={styles.errorText}>{formErrors.contact_email}</span>}
                  </div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Numéro de téléphone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    style={{
                      ...styles.input,
                      ...(formErrors.phone ? styles.inputError : {}),
                    }}
                    placeholder="+32 470 12 34 56"
                  />
                  {formErrors.phone && <span style={styles.errorText}>{formErrors.phone}</span>}
                </div>
              </div>

              {/* Departure Location */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Lieu de départ</h3>
                <div style={styles.fieldGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>Localité *</label>
                    <input
                      type="text"
                      value={formData.departure_city}
                      onChange={e => updateField('departure_city', e.target.value)}
                      style={{
                        ...styles.input,
                        ...(formErrors.departure_city ? styles.inputError : {}),
                      }}
                      placeholder="Bruxelles"
                    />
                    {formErrors.departure_city && <span style={styles.errorText}>{formErrors.departure_city}</span>}
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Code postal</label>
                    <input
                      type="text"
                      value={formData.departure_postal_code}
                      onChange={e => updateField('departure_postal_code', e.target.value)}
                      style={styles.input}
                      placeholder="1000"
                    />
                  </div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Pays</label>
                  <select
                    value={formData.departure_country}
                    onChange={e => updateField('departure_country', e.target.value)}
                    style={styles.input}
                  >
                    <option value="BE">Belgique</option>
                    <option value="FR">France</option>
                    <option value="LU">Luxembourg</option>
                    <option value="NL">Pays-Bas</option>
                    <option value="DE">Allemagne</option>
                    <option value="CH">Suisse</option>
                  </select>
                </div>
              </div>

              {/* Carpooling */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  <Car size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                  Covoiturage
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { value: 'none', label: 'Pas de covoiturage', desc: 'Je me rends sur place par mes propres moyens' },
                    { value: 'seeking', label: 'Je cherche un covoiturage', desc: 'Je souhaite trouver quelqu\'un pour m\'emmener' },
                    { value: 'offering', label: 'Je peux prendre des passagers', desc: 'J\'ai de la place dans mon véhicule' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      data-radio-card
                      style={{
                        ...styles.radioCard,
                        ...(formData.carpooling === opt.value ? styles.radioCardActive : styles.radioCardInactive),
                      }}
                    >
                      <input
                        type="radio"
                        name="carpooling"
                        value={opt.value}
                        checked={formData.carpooling === opt.value}
                        onChange={e => updateField('carpooling', e.target.value)}
                        style={{ display: 'none' }}
                      />
                      <div>
                        <div style={{ fontWeight: '500', color: '#1f2937', fontFamily: 'var(--font-body)' }}>{opt.label}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px', fontFamily: 'var(--font-body)' }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              {hasCategories && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>
                    <Users size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                    Places
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {categories.map((cat) => {
                      const qty = formData.items[cat.id] || 0
                      const discount = computeCatDiscount(qty)
                      const subtotal = computeCatSubtotal(cat.price, qty)
                      const isFull = cat.spotsRemaining <= 0
                      const isClosed = cat.maxSpots === 0

                      return (
                        <div
                          key={cat.id}
                          style={{
                            padding: '14px 16px',
                            border: qty > 0 ? '2px solid #B01A19' : '2px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: isFull || isClosed ? '#f9fafb' : qty > 0 ? '#fef2f2' : 'white',
                            opacity: isFull || isClosed ? 0.5 : 1,
                            transition: 'border-color 0.15s, background-color 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '140px' }}>
                              <div style={{ fontWeight: '500', color: '#1f2937', fontFamily: 'var(--font-body)' }}>{cat.label}</div>
                              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
                                {cat.price.toFixed(2)} € par place
                                {' — '}
                                {isFull || isClosed ? 'Complet' : `${cat.spotsRemaining} place${cat.spotsRemaining > 1 ? 's' : ''}`}
                              </div>
                            </div>
                            {!isFull && !isClosed && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
                                  <button
                                    type="button"
                                    onClick={() => updateField('items', { ...formData.items, [cat.id]: Math.max(0, qty - 1) })}
                                    disabled={qty === 0}
                                    style={{ padding: '6px 10px', border: 'none', background: 'none', cursor: qty === 0 ? 'not-allowed' : 'pointer', color: '#6b7280', fontSize: '16px', opacity: qty === 0 ? 0.3 : 1 }}
                                  >−</button>
                                  <span style={{ padding: '6px 12px', fontWeight: '600', color: '#1f2937', minWidth: '28px', textAlign: 'center', fontFamily: 'var(--font-body)' }}>{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateField('items', { ...formData.items, [cat.id]: Math.min(cat.spotsRemaining, qty + 1) })}
                                    disabled={qty >= cat.spotsRemaining}
                                    style={{ padding: '6px 10px', border: 'none', background: 'none', cursor: qty >= cat.spotsRemaining ? 'not-allowed' : 'pointer', color: '#6b7280', fontSize: '16px', opacity: qty >= cat.spotsRemaining ? 0.3 : 1 }}
                                  >+</button>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: '70px', opacity: qty > 0 ? 1 : 0, transition: 'opacity 0.15s' }}>
                                  <div style={{ fontWeight: '600', color: '#B01A19', fontFamily: 'var(--font-body)' }}>{subtotal.toFixed(2)} €</div>
                                  {discount > 0 && (
                                    <div style={{ fontSize: '12px', color: '#16a34a', fontFamily: 'var(--font-body)' }}>-{discount}%</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {hasSelectedItems && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontWeight: '500', color: '#374151', fontFamily: 'var(--font-body)' }}>Total</span>
                      <span style={{ fontWeight: '700', fontSize: '18px', color: '#B01A19', fontFamily: 'var(--font-body)' }}>
                        {itemsTotal.toFixed(2)} €
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Selection */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Paiement</h3>
                {canPayDeposit ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label
                      data-radio-card
                      style={{
                        ...styles.radioCard,
                        ...(formData.payment_type === 'full' ? styles.radioCardActive : styles.radioCardInactive),
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_type"
                        value="full"
                        checked={formData.payment_type === 'full'}
                        onChange={e => updateField('payment_type', e.target.value)}
                        style={{ display: 'none' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#1f2937', fontFamily: 'var(--font-body)' }}>Paiement intégral</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px', fontFamily: 'var(--font-body)' }}>Régler la totalité maintenant</div>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '18px', color: '#B01A19', fontFamily: 'var(--font-body)' }}>
                        {itemsTotal.toFixed(2)} €
                      </div>
                    </label>
                    <label
                      data-radio-card
                      style={{
                        ...styles.radioCard,
                        ...(formData.payment_type === 'deposit' ? styles.radioCardActive : styles.radioCardInactive),
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_type"
                        value="deposit"
                        checked={formData.payment_type === 'deposit'}
                        onChange={e => updateField('payment_type', e.target.value)}
                        style={{ display: 'none' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#1f2937', fontFamily: 'var(--font-body)' }}>Acompte</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
                          Le solde de {(itemsTotal - depositTotal).toFixed(2)} € sera à régler ultérieurement
                        </div>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '18px', color: '#B01A19', fontFamily: 'var(--font-body)' }}>
                        {depositTotal.toFixed(2)} €
                      </div>
                    </label>
                  </div>
                ) : (
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#374151', fontFamily: 'var(--font-body)' }}>Montant à payer</span>
                      <span style={{ fontWeight: '700', fontSize: '20px', color: '#B01A19', fontFamily: 'var(--font-body)' }}>
                        {itemsTotal.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {formErrors.submit && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-body)',
                }}>
                  <AlertCircle size={16} />
                  {formErrors.submit}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (hasCategories && !hasSelectedItems)}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  backgroundColor: (submitting || (hasCategories && !hasSelectedItems)) ? '#9ca3af' : '#B01A19',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Préparation du paiement...
                  </>
                ) : (
                  <>
                    Continuer vers le paiement — {selectedAmount.toFixed(2)} €
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : step === 'payment' && clientSecret && stripePromise ? (
        /* Stripe Payment Step */
        <>
        {/* Order Summary */}
        <div style={styles.card}>
          <div style={{ padding: '24px' }}>
            <h2 style={{ ...styles.heading, marginBottom: '16px' }}>Récapitulatif</h2>

            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '16px',
              fontFamily: 'var(--font-body)',
            }}>
              {training.title}
            </div>

            {hasCategories ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {categories.filter(cat => (formData.items[cat.id] || 0) > 0).map((cat) => {
                  const qty = formData.items[cat.id] || 0
                  const discount = computeCatDiscount(qty)
                  const subtotal = computeCatSubtotal(cat.price, qty)
                  return (
                    <div key={cat.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      padding: '10px 0',
                      borderBottom: '1px solid #f3f4f6',
                      fontFamily: 'var(--font-body)',
                    }}>
                      <div>
                        <span style={{ color: '#374151', fontSize: '14px' }}>
                          {cat.label}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: '13px', marginLeft: '6px' }}>
                          × {qty}
                        </span>
                        {discount > 0 && (
                          <span style={{
                            display: 'inline-block',
                            marginLeft: '8px',
                            padding: '1px 6px',
                            backgroundColor: '#f0fdf4',
                            color: '#16a34a',
                            fontSize: '11px',
                            fontWeight: '600',
                            borderRadius: '4px',
                          }}>
                            −{discount}%
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: '500', color: '#1f2937', fontSize: '14px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                        {subtotal.toFixed(2)} €
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '10px 0',
                borderBottom: '1px solid #f3f4f6',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: '#374151',
              }}>
                <span>Inscription</span>
                <span style={{ fontWeight: '500', color: '#1f2937' }}>{training.price.toFixed(2)} €</span>
              </div>
            )}

            {/* Total / Deposit line */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '2px solid #e5e7eb',
              fontFamily: 'var(--font-body)',
            }}>
              {formData.payment_type === 'deposit' && canPayDeposit ? (
                <>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                      Acompte
                    </span>
                    <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                      Solde de {(itemsTotal - depositTotal).toFixed(2)} € à régler ultérieurement
                    </span>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '18px', color: '#B01A19' }}>
                    {paymentAmount.toFixed(2)} €
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>Total</span>
                  <span style={{ fontWeight: '700', fontSize: '18px', color: '#B01A19' }}>
                    {paymentAmount.toFixed(2)} €
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Email confirmation callout */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '14px 16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          marginBottom: '20px',
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: '#1e40af',
          lineHeight: '1.5',
        }}>
          <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Une confirmation vous sera envoyée par e-mail à <strong>{formData.contact_email}</strong>
          </span>
        </div>

        {/* Payment Form */}
        <div style={styles.card}>
          <div style={{ padding: '24px' }}>
            <h2 style={{ ...styles.heading, marginBottom: '8px' }}>Paiement</h2>
            <p style={{ ...styles.text, marginBottom: '24px' }}>
              Choisissez votre mode de paiement.
            </p>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#B01A19',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    borderRadius: '8px',
                  },
                },
                locale: 'fr',
              }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                amount={paymentAmount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
            <button
              onClick={() => setStep('form')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '12px',
                fontFamily: 'var(--font-body)',
              }}
            >
              ← Retour au formulaire
            </button>
          </div>
        </div>
        </>
      ) : null}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        paddingBottom: '40px',
        color: '#9ca3af',
        fontSize: '13px',
        fontFamily: 'var(--font-body)',
      }}>
        <p>En route vers l'ère des forêts comestibles</p>
        <p style={{ marginTop: '4px' }}>Paiement sécurisé par Stripe</p>
      </div>
    </div>
  )
}

function formatDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}

const styles = {
  container: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '24px 16px',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: 'var(--font-body)',
  },
  header: {
    marginBottom: '24px',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '22px',
    color: '#1f2937',
    margin: '0',
  },
  text: {
    color: '#6b7280',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0',
    fontFamily: 'var(--font-body)',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '500',
    fontFamily: 'var(--font-body)',
  },
  infoValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '500',
    fontFamily: 'var(--font-body)',
  },
  section: {
    marginBottom: '28px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
    marginTop: '0',
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '12px',
  },
  field: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
    fontFamily: 'var(--font-body)',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#1f2937',
    backgroundColor: 'white',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    display: 'block',
    fontSize: '13px',
    color: '#dc2626',
    marginTop: '4px',
    fontFamily: 'var(--font-body)',
  },
  radioCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background-color 0.15s',
    backgroundColor: 'white',
    outline: 'none',
  },
  radioCardActive: {
    borderColor: '#B01A19',
    backgroundColor: '#fef2f2',
  },
  radioCardInactive: {
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
}
