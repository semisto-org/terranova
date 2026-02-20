import React, { useState, useEffect, useMemo } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CalendarDays, MapPin, Users, Euro, Car, CheckCircle, AlertCircle, Loader2, TreePine } from 'lucide-react'

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
    if (step === 'success') return

    fetch(`/api/v1/public/academy/trainings/${trainingId}`)
      .then(res => {
        if (!res.ok) throw new Error('Formation non disponible')
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
        setError(err.message)
        setLoading(false)
      })
  }, [trainingId, step])

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
        body: JSON.stringify(formData),
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
            <h2 style={{ ...styles.heading, color: '#dc2626' }}>Formation non disponible</h2>
            <p style={styles.text}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircle size={56} style={{ color: '#16a34a', marginBottom: '16px' }} />
            <h2 style={{ ...styles.heading, color: '#16a34a' }}>Inscription confirmée !</h2>
            <p style={styles.text}>
              Votre inscription a bien été enregistrée et votre paiement a été reçu.
              Vous recevrez un e-mail de confirmation prochainement.
            </p>
            {training && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
              }}>
                <p style={{ fontWeight: '600', color: '#166534', fontFamily: 'var(--font-body)' }}>
                  {training.title}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const canPayDeposit = training.depositAmount > 0 && training.depositAmount < training.price
  const selectedAmount = formData.payment_type === 'deposit' && canPayDeposit
    ? training.depositAmount
    : training.price

  const firstSession = training.sessions?.[0]
  const lastSession = training.sessions?.[training.sessions.length - 1]

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #B01A19 !important; box-shadow: 0 0 0 3px rgba(176, 26, 25, 0.1); }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <TreePine size={28} style={{ color: '#B01A19' }} />
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '20px',
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
                {training.price.toFixed(2)} €
                {training.vatRate > 0 && <span style={{ fontSize: '12px', color: '#9ca3af' }}> TTC</span>}
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

      {training.spotsRemaining === 0 ? (
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
            <h2 style={styles.heading}>Formation complète</h2>
            <p style={styles.text}>
              Cette formation n'a plus de places disponibles. Revenez bientôt pour les prochaines sessions.
            </p>
          </div>
        </div>
      ) : step === 'form' ? (
        /* Registration Form */
        <div style={styles.card}>
          <div style={{ padding: '24px' }}>
            <h2 style={{ ...styles.heading, marginBottom: '24px' }}>Inscription</h2>

            <form onSubmit={handleSubmitForm}>
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
                    <label style={styles.label}>Ville *</label>
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
                      style={{
                        ...styles.radioCard,
                        ...(formData.carpooling === opt.value ? styles.radioCardActive : {}),
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

              {/* Payment Selection */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Paiement</h3>
                {canPayDeposit ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label
                      style={{
                        ...styles.radioCard,
                        ...(formData.payment_type === 'full' ? styles.radioCardActive : {}),
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
                        {training.price.toFixed(2)} €
                      </div>
                    </label>
                    <label
                      style={{
                        ...styles.radioCard,
                        ...(formData.payment_type === 'deposit' ? styles.radioCardActive : {}),
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
                          Le solde de {(training.price - training.depositAmount).toFixed(2)} € sera à régler ultérieurement
                        </div>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '18px', color: '#B01A19', fontFamily: 'var(--font-body)' }}>
                        {training.depositAmount.toFixed(2)} €
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
                        {training.price.toFixed(2)} €
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
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  backgroundColor: submitting ? '#9ca3af' : '#B01A19',
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
        <div style={styles.card}>
          <div style={{ padding: '24px' }}>
            <h2 style={{ ...styles.heading, marginBottom: '8px' }}>Paiement</h2>
            <p style={{ ...styles.text, marginBottom: '24px' }}>
              Complétez votre paiement de <strong>{paymentAmount.toFixed(2)} €</strong> par carte bancaire ou Bancontact.
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
        <p>Semisto — Transformer les zones anthropisées en forêts nourricières</p>
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
  },
  radioCardActive: {
    borderColor: '#B01A19',
    backgroundColor: '#fef2f2',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
}
