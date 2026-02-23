import React, { useState } from 'react'
import { useShellNav } from '../../components/shell/ShellContext'
import { EventTypesAdmin, TimesheetServiceTypesAdmin } from '../../lab-management/components'

const SECTION_TABS = [
  { id: 'event-types', label: "Types d'événements" },
  { id: 'service-types', label: 'Types de prestation' },
]

export default function AdminParametres() {
  const [activeSection, setActiveSection] = useState('event-types')
  useShellNav({ sections: SECTION_TABS, activeSection, onSectionChange: setActiveSection })

  return (
    <div className="px-4 py-4">
      {activeSection === 'event-types' && <EventTypesAdmin />}
      {activeSection === 'service-types' && <TimesheetServiceTypesAdmin />}
    </div>
  )
}
