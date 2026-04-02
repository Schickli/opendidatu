'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type {
  Posten,
  MeldungType,
  Meldung,
} from './store'
import {
  generateId,
  SAMPLE_POSTEN,
  SAMPLE_MELDUNG_TYPES,
  SAMPLE_MELDUNGEN,
} from './store'

interface DataContextType {
  // Posten
  posten: Posten[]
  addPosten: (data: Omit<Posten, 'id' | 'createdAt'>) => void
  updatePosten: (id: string, data: Partial<Omit<Posten, 'id' | 'createdAt'>>) => void
  deletePosten: (id: string) => void

  // Message types
  messageTypes: MeldungType[]
  addMessageType: (data: Omit<MeldungType, 'id'>) => void
  updateMessageType: (id: string, data: Partial<Omit<MeldungType, 'id'>>) => void
  deleteMessageType: (id: string) => void

  // Meldungen
  meldungen: Meldung[]
  addMeldung: (data: Omit<Meldung, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMeldung: (
    id: string,
    data: Partial<Pick<Meldung, 'postenId' | 'values' | 'comment' | 'isValid'>>
  ) => void
  deleteMeldung: (id: string) => void

  // Selection
  selectedPostenId: string | null
  setSelectedPostenId: (id: string | null) => void
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [posten, setPosten] = useState<Posten[]>(SAMPLE_POSTEN)
  const [messageTypes, setMessageTypes] = useState<MeldungType[]>(
    SAMPLE_MELDUNG_TYPES
  )
  const [meldungen, setMeldungen] = useState<Meldung[]>(SAMPLE_MELDUNGEN)
  const [selectedPostenId, setSelectedPostenId] = useState<string | null>(null)

  const addPosten = useCallback(
    (data: Omit<Posten, 'id' | 'createdAt'>) => {
      setPosten((prev) => [
        ...prev,
        { ...data, id: generateId(), createdAt: new Date().toISOString() },
      ])
    },
    []
  )

  const updatePosten = useCallback(
    (id: string, data: Partial<Omit<Posten, 'id' | 'createdAt'>>) => {
      setPosten((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      )
    },
    []
  )

  const deletePosten = useCallback((id: string) => {
    setPosten((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addMessageType = useCallback(
    (data: Omit<MeldungType, 'id'>) => {
      const id = generateId()
      const categories = data.categories.map((category) => ({
        ...category,
        id: category.id || generateId(),
      }))
      setMessageTypes((prev) => [...prev, { ...data, id, categories }])
    },
    []
  )

  const updateMessageType = useCallback(
    (id: string, data: Partial<Omit<MeldungType, 'id'>>) => {
      setMessageTypes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      )
    },
    []
  )

  const deleteMessageType = useCallback((id: string) => {
    setMessageTypes((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addMeldung = useCallback(
    (data: Omit<Meldung, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()

      setMeldungen((prev) => [
        { ...data, id: generateId(), createdAt: now, updatedAt: now },
        ...prev,
      ])
    },
    []
  )

  const updateMeldung = useCallback(
    (
      id: string,
      data: Partial<Pick<Meldung, 'postenId' | 'values' | 'comment' | 'isValid'>>
    ) => {
      setMeldungen((prev) =>
        prev.map((meldung) =>
          meldung.id === id
            ? {
                ...meldung,
                ...data,
                updatedAt: new Date().toISOString(),
              }
            : meldung
        )
      )
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
        messageTypes,
        addMessageType,
        updateMessageType,
        deleteMessageType,
        meldungen,
        addMeldung,
        updateMeldung,
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
