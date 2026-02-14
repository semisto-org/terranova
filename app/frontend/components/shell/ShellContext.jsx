import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ShellContext = createContext(null)

export function ShellProvider({ children }) {
  const [sections, setSections] = useState([])
  const [activeSection, setActiveSection] = useState(null)
  const [currentPole, setCurrentPole] = useState(null)
  const onChangeRef = useRef(null)

  const registerNav = useCallback((secs, active, onChange) => {
    setSections(secs)
    setActiveSection(active)
    onChangeRef.current = onChange
  }, [])

  const handleSectionClick = useCallback((id) => {
    setActiveSection(id)
    if (onChangeRef.current) onChangeRef.current(id)
  }, [])

  const syncActive = useCallback((active) => {
    setActiveSection(active)
  }, [])

  return (
    <ShellContext.Provider value={{ sections, activeSection, currentPole, setCurrentPole, registerNav, handleSectionClick, syncActive }}>
      {children}
    </ShellContext.Provider>
  )
}

export function useShellNav({ sections, activeSection, onSectionChange }) {
  const ctx = useContext(ShellContext)
  if (!ctx) return

  const onChangeRef = useRef(onSectionChange)
  onChangeRef.current = onSectionChange

  useEffect(() => {
    ctx.registerNav(sections, activeSection, (id) => onChangeRef.current?.(id))
    return () => ctx.registerNav([], null, null)
  }, [])

  useEffect(() => {
    ctx.syncActive(activeSection)
  }, [activeSection])
}

export function useShellContext() {
  return useContext(ShellContext)
}
