import React from 'react'
import { MessageCircle } from 'lucide-react'

// Widget de contact WhatsApp Business (#40) — V1 simple : lien profond wa.me
// pré-rempli, sans API. Le message reprend l'activité concernée quand on en
// passe une (page d'une activité), sinon un message générique (page Académie).
//
// TODO #40 : remplacer par le numéro WhatsApp Business dédié Semisto Academy
// quand il sera créé (cf. issue #42 chatbot). Pour l'instant : Les 4 Sources.
const WHATSAPP_NUMBER = '32455136142'

export default function WhatsAppContactWidget({ activityTitle = null, className = '' }) {
  const message = activityTitle
    ? `Bonjour, j'ai une question concernant l'activité « ${activityTitle} ».`
    : "Bonjour, j'ai une question concernant les activités Semisto Academy."
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-95 ${className}`}
      style={{ backgroundColor: '#25D366' }}
    >
      <MessageCircle size={16} />
      Une question ? Contactez-nous sur WhatsApp
    </a>
  )
}
