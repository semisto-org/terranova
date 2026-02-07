import type { Lab } from '../types'

interface NewsletterCtaProps {
  lab: Lab
  onSubscribe?: (email: string) => void
}

export function NewsletterCta({ lab, onSubscribe }: NewsletterCtaProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    if (email && onSubscribe) {
      onSubscribe(email)
    }
  }

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: '#5B5781' }}
      />
      
      {/* Decorative elements */}
      <div 
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20"
        style={{ backgroundColor: '#AFBD00' }}
      />
      <div 
        className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-10"
        style={{ backgroundColor: '#AFBD00' }}
      />
      
      {/* Leaf pattern */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 10c-10 16-30 24-30 45 0 12 13 15 30 15s30-3 30-15c0-21-20-29-30-45z' fill='white' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Icon */}
        <div 
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ backgroundColor: '#AFBD00' }}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        
        {/* Heading */}
        <h2 
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
        >
          Rejoignez la newsletter
        </h2>
        
        {/* Subheading */}
        <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          Recevez les actualités de <strong>{lab.name}</strong>, les prochaines formations et événements, 
          et des conseils pour créer votre jardin-forêt.
        </p>
        
        {/* Stats */}
        <div className="flex justify-center gap-8 mb-10">
          <div className="text-center">
            <div 
              className="text-3xl font-bold"
              style={{ color: '#AFBD00' }}
            >
              {lab.newsletterSubscribers.toLocaleString()}+
            </div>
            <div className="text-white/60 text-sm">abonnés</div>
          </div>
          <div className="text-center">
            <div 
              className="text-3xl font-bold"
              style={{ color: '#AFBD00' }}
            >
              2x
            </div>
            <div className="text-white/60 text-sm">par mois</div>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
          <input
            type="email"
            name="email"
            placeholder="votre@email.com"
            required
            className="flex-1 px-6 py-4 rounded-full text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-[#AFBD00]/50 transition-shadow text-center sm:text-left"
          />
          <button
            type="submit"
            className="px-8 py-4 rounded-full font-bold text-[#5B5781] transition-all hover:scale-105 hover:shadow-lg active:scale-100"
            style={{ backgroundColor: '#AFBD00' }}
          >
            S'abonner gratuitement
          </button>
        </form>
        
        {/* Privacy note */}
        <p className="mt-6 text-sm text-white/50">
          🔒 Vos données restent privées. Désinscription en un clic.
        </p>
      </div>
    </section>
  )
}

