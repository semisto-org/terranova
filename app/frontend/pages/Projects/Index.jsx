import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { usePage, router } from '@inertiajs/react'
import { useShellNav } from '@/components/shell/ShellContext'
import { useUrlState, useUrlStatePush } from '@/hooks/useUrlState'
import { apiRequest } from '@/lib/api'
import ProjectBoard from './components/ProjectBoard'
import ProjectDetail from './components/ProjectDetail'

const LAB_SECTION_TABS = [
  { id: 'calendar', label: 'Tableau de bord' },
  { id: 'projects', label: 'Projets' },
  { id: 'impact', label: 'Impact' },
  { id: 'deliberations', label: 'Délibérations' },
  { id: 'cadres', label: 'Gouvernance' },
]

export default function ProjectsIndex() {
  const { initialType, initialId } = usePage().props
  const [selectedProject, setSelectedProject] = useUrlStatePush('project', null)

  // If coming from /projects/:type/:id, open that project
  useEffect(() => {
    if (initialType && initialId) {
      setSelectedProject(`${initialType}:${initialId}`)
    }
  }, [initialType, initialId])

  const handleSectionChange = useCallback((id) => {
    if (id === 'projects') return
    if (id === 'calendar') {
      router.visit('/')
    } else {
      router.visit(`/?tab=${id}`)
    }
  }, [])

  useShellNav({
    sections: selectedProject ? [] : LAB_SECTION_TABS,
    activeSection: 'projects',
    onSectionChange: handleSectionChange,
  })

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest('/api/v1/projects')
      setProjects(res.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  const handleSelectProject = useCallback((typeKey, id) => {
    setSelectedProject(`${typeKey}:${id}`)
  }, [setSelectedProject])

  const handleBack = useCallback(() => {
    setSelectedProject(null)
  }, [setSelectedProject])

  // Parse selected project
  const parsedProject = useMemo(() => {
    if (!selectedProject) return null
    const [typeKey, id] = selectedProject.split(':')
    return { typeKey, id }
  }, [selectedProject])

  if (parsedProject) {
    return (
      <ProjectDetail
        typeKey={parsedProject.typeKey}
        projectId={parsedProject.id}
        onBack={handleBack}
        onRefreshList={loadProjects}
      />
    )
  }

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
      <ProjectBoard
        projects={projects}
        loading={loading}
        error={error}
        onSelect={handleSelectProject}
        onRefresh={loadProjects}
      />
    </div>
  )
}
