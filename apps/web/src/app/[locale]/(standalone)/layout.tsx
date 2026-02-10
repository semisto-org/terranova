export default function StandaloneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <header className="h-14 flex items-center px-6 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <span className="font-heading font-bold text-primary text-lg">Terranova</span>
      </header>
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
