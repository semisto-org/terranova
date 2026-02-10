import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  pole?: string
  poleColor?: string
}

export function PlaceholderPage({ title, pole, poleColor }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: poleColor ? `${poleColor}20` : '#5B578120' }}
      >
        <Construction
          className="w-8 h-8"
          style={{ color: poleColor || '#5B5781' }}
        />
      </div>
      <h1 className="text-2xl font-heading font-bold text-stone-900 dark:text-stone-100 mb-2">
        {title}
      </h1>
      {pole && (
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
          {pole}
        </p>
      )}
      <p className="text-stone-600 dark:text-stone-400 max-w-md">
        Cette section sera bientôt disponible.
      </p>
    </div>
  )
}
