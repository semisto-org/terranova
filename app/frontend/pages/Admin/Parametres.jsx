import React from 'react'
import { useShellNav } from '../../components/shell/ShellContext'
import { EventTypesAdmin } from '../../lab-management/components'

const SECTION_TABS = [
  { id: 'event-types', label: "Types d'événements" },
]

export default function AdminParametres() {
  useShellNav({ sections: SECTION_TABS, activeSection: 'event-types', onSectionChange: () => {} })

  return (
    <div className="px-4 py-4">
      <EventTypesAdmin />
    </div>
  )
}
