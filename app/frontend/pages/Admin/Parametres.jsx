import React from 'react'
import { useShellNav } from '../../components/shell/ShellContext'
import { useUrlState } from '@/hooks/useUrlState'
import { CyclePeriodsAdmin, EventTypesAdmin, TimesheetServiceTypesAdmin } from '../../lab-management/components'

const SECTION_TABS = [
  { id: 'event-types', label: "Types d'événements" },
  { id: 'service-types', label: 'Types de prestation' },
  { id: 'cycles', label: 'Cycles' },
]

export default function AdminParametres() {
  const [activeSection, setActiveSection] = useUrlState('tab', 'event-types')
  useShellNav({ sections: SECTION_TABS, activeSection, onSectionChange: setActiveSection })

  return (
    <div className="px-4 py-4">
      {activeSection === 'event-types' && <EventTypesAdmin />}
      {activeSection === 'service-types' && <TimesheetServiceTypesAdmin />}
      {activeSection === 'cycles' && <CyclePeriodsAdmin />}
    </div>
  )
}
