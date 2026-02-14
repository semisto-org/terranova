interface MonthsCalendarProps {
  activeMonths: string[]
  label: string
  color?: 'green' | 'pink' | 'orange'
}

const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const monthIds = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export function MonthsCalendar({ activeMonths, label, color = 'green' }: MonthsCalendarProps) {
  const colors = {
    green: {
      active: 'bg-[#AFBD00] text-white',
      inactive: 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-600'
    },
    pink: {
      active: 'bg-pink-500 text-white',
      inactive: 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-600'
    },
    orange: {
      active: 'bg-orange-500 text-white',
      inactive: 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-600'
    }
  }

  return (
    <div>
      <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">{label}</p>
      <div className="flex gap-1">
        {monthIds.map((monthId, index) => {
          const isActive = activeMonths.includes(monthId)
          return (
            <div
              key={monthId}
              className={`w-6 h-6 rounded text-xs font-medium flex items-center justify-center ${
                isActive ? colors[color].active : colors[color].inactive
              }`}
              title={monthLabels[index]}
            >
              {monthLabels[index]}
            </div>
          )
        })}
      </div>
    </div>
  )
}
