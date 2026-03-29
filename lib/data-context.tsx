'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type {
  Posten,
  Meldungstyp,
  Meldung,
  MeldungKategorieWert,
  MeldungstypKategorie,
} from './store'
import {
  generateId,
  SAMPLE_POSTEN,
  SAMPLE_MELDUNGSTYPEN,
  SAMPLE_MELDUNGEN,
} from './store'

interface DataContextType {
  // Posten
  posten: Posten[]
  addPosten: (data: Omit<Posten, 'id' | 'erstelltAm'>) => void
  updatePosten: (id: string, data: Partial<Omit<Posten, 'id' | 'erstelltAm'>>) => void
  deletePosten: (id: string) => void

  // Meldungstypen
  meldungstypen: Meldungstyp[]
  addMeldungstyp: (data: Omit<Meldungstyp, 'id'>) => void
  updateMeldungstyp: (id: string, data: Partial<Omit<Meldungstyp, 'id'>>) => void
  deleteMeldungstyp: (id: string) => void

  // Meldungen
  meldungen: Meldung[]
  addMeldung: (data: Omit<Meldung, 'id' | 'erstelltAm'>) => void
  deleteMeldung: (id: string) => void

  // Selection
  selectedPostenId: string | null
  setSelectedPostenId: (id: string | null) => void
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [posten, setPosten] = useState<Posten[]>(SAMPLE_POSTEN)
  const [meldungstypen, setMeldungstypen] = useState<Meldungstyp[]>(
    SAMPLE_MELDUNGSTYPEN
  )
  const [meldungen, setMeldungen] = useState<Meldung[]>(SAMPLE_MELDUNGEN)
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

  const addMeldungstyp = useCallback(
    (data: Omit<Meldungstyp, 'id'>) => {
      const id = generateId()
      const kategorien = data.kategorien.map((k) => ({
        ...k,
        id: k.id || generateId(),
      }))
      setMeldungstypen((prev) => [...prev, { ...data, id, kategorien }])
    },
    []
  )

  const updateMeldungstyp = useCallback(
    (id: string, data: Partial<Omit<Meldungstyp, 'id'>>) => {
      setMeldungstypen((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      )
    },
    []
  )

  const deleteMeldungstyp = useCallback((id: string) => {
    setMeldungstypen((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addMeldung = useCallback(
    (data: Omit<Meldung, 'id' | 'erstelltAm'>) => {
      setMeldungen((prev) => [
        { ...data, id: generateId(), erstelltAm: new Date().toISOString() },
        ...prev,
      ])
    },
    []
  )

  const deleteMeldung = useCallback((id: string) => {
    setMeldungen((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <DataContext.Provider
      value={{
        posten,
        addPosten,
        updatePosten,
        deletePosten,
        meldungstypen,
        addMeldungstyp,
        updateMeldungstyp,
        deleteMeldungstyp,
        meldungen,
        addMeldung,
        deleteMeldung,
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
