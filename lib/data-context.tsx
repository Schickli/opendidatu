'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type {
  Posten,
  Nachrichtentyp,
  Nachricht,
  NachrichtKategorieWert,
  NachrichtentypKategorie,
} from './store'
import {
  generateId,
  SAMPLE_POSTEN,
  SAMPLE_NACHRICHTENTYPEN,
  SAMPLE_NACHRICHTEN,
} from './store'

interface DataContextType {
  // Posten
  posten: Posten[]
  addPosten: (data: Omit<Posten, 'id' | 'erstelltAm'>) => void
  updatePosten: (id: string, data: Partial<Omit<Posten, 'id' | 'erstelltAm'>>) => void
  deletePosten: (id: string) => void

  // Nachrichtentypen
  nachrichtentypen: Nachrichtentyp[]
  addNachrichtentyp: (data: Omit<Nachrichtentyp, 'id'>) => void
  updateNachrichtentyp: (id: string, data: Partial<Omit<Nachrichtentyp, 'id'>>) => void
  deleteNachrichtentyp: (id: string) => void

  // Nachrichten
  nachrichten: Nachricht[]
  addNachricht: (data: Omit<Nachricht, 'id' | 'erstelltAm'>) => void
  deleteNachricht: (id: string) => void

  // Selection
  selectedPostenId: string | null
  setSelectedPostenId: (id: string | null) => void
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [posten, setPosten] = useState<Posten[]>(SAMPLE_POSTEN)
  const [nachrichtentypen, setNachrichtentypen] = useState<Nachrichtentyp[]>(
    SAMPLE_NACHRICHTENTYPEN
  )
  const [nachrichten, setNachrichten] = useState<Nachricht[]>(SAMPLE_NACHRICHTEN)
  const [selectedPostenId, setSelectedPostenId] = useState<string | null>(null)

  const addPosten = useCallback(
    (data: Omit<Posten, 'id' | 'erstelltAm'>) => {
      setPosten((prev) => [
        ...prev,
        { ...data, id: generateId(), erstelltAm: new Date().toISOString() },
      ])
    },
    []
  )

  const updatePosten = useCallback(
    (id: string, data: Partial<Omit<Posten, 'id' | 'erstelltAm'>>) => {
      setPosten((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      )
    },
    []
  )

  const deletePosten = useCallback((id: string) => {
    setPosten((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addNachrichtentyp = useCallback(
    (data: Omit<Nachrichtentyp, 'id'>) => {
      const id = generateId()
      const kategorien = data.kategorien.map((k) => ({
        ...k,
        id: k.id || generateId(),
      }))
      setNachrichtentypen((prev) => [...prev, { ...data, id, kategorien }])
    },
    []
  )

  const updateNachrichtentyp = useCallback(
    (id: string, data: Partial<Omit<Nachrichtentyp, 'id'>>) => {
      setNachrichtentypen((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      )
    },
    []
  )

  const deleteNachrichtentyp = useCallback((id: string) => {
    setNachrichtentypen((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addNachricht = useCallback(
    (data: Omit<Nachricht, 'id' | 'erstelltAm'>) => {
      setNachrichten((prev) => [
        { ...data, id: generateId(), erstelltAm: new Date().toISOString() },
        ...prev,
      ])
    },
    []
  )

  const deleteNachricht = useCallback((id: string) => {
    setNachrichten((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <DataContext.Provider
      value={{
        posten,
        addPosten,
        updatePosten,
        deletePosten,
        nachrichtentypen,
        addNachrichtentyp,
        updateNachrichtentyp,
        deleteNachrichtentyp,
        nachrichten,
        addNachricht,
        deleteNachricht,
        selectedPostenId,
        setSelectedPostenId,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
