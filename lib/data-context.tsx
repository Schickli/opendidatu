'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type {
  Posten,
  MeldungType,
  Meldung,
} from './store'
import {
  createMeldung as createMeldungRequest,
  createMessageType as createMessageTypeRequest,
  createPosten as createPostenRequest,
  deleteMeldung as deleteMeldungRequest,
  deleteMessageType as deleteMessageTypeRequest,
  deletePosten as deletePostenRequest,
  fetchBootstrapSnapshot,
  updateMeldung as updateMeldungRequest,
  updateMessageType as updateMessageTypeRequest,
  updatePosten as updatePostenRequest,
} from '@/lib/api-client'
import type { DataSnapshot } from '@/lib/contracts'

interface DataContextType {
  // Posten
  posten: Posten[]
  addPosten: (data: Omit<Posten, 'id' | 'createdAt'>) => Promise<void>
  updatePosten: (id: number, data: Partial<Omit<Posten, 'id' | 'createdAt'>>) => Promise<void>
  deletePosten: (id: number) => Promise<void>

  // Message types
  messageTypes: MeldungType[]
  addMessageType: (data: Omit<MeldungType, 'id'>) => Promise<void>
  updateMessageType: (id: number, data: Partial<Omit<MeldungType, 'id'>>) => Promise<void>
  deleteMessageType: (id: number) => Promise<void>

  // Meldungen
  meldungen: Meldung[]
  addMeldung: (data: Omit<Meldung, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateMeldung: (
    id: number,
    data: Partial<Pick<Meldung, 'postenId' | 'values' | 'comment' | 'isValid'>>
  ) => Promise<void>
  deleteMeldung: (id: number) => Promise<void>

  // Selection
  selectedPostenId: number | null
  setSelectedPostenId: (id: number | null) => void
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [posten, setPosten] = useState<Posten[]>([])
  const [messageTypes, setMessageTypes] = useState<MeldungType[]>([])
  const [meldungen, setMeldungen] = useState<Meldung[]>([])
  const [selectedPostenId, setSelectedPostenId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applySnapshot = useCallback((snapshot: DataSnapshot) => {
    setPosten(snapshot.posten)
    setMessageTypes(snapshot.messageTypes)
    setMeldungen(snapshot.meldungen)
  }, [])

  const runMutation = useCallback(
    async (operation: () => Promise<DataSnapshot>) => {
      const snapshot = await operation()
      applySnapshot(snapshot)
      setError(null)
    },
    [applySnapshot]
  )

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    try {
      const snapshot = await fetchBootstrapSnapshot()
      applySnapshot(snapshot)
      setError(null)
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Daten konnten nicht geladen werden.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [applySnapshot])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const addPosten = useCallback(
    async (data: Omit<Posten, 'id' | 'createdAt'>) => {
      await runMutation(() => createPostenRequest(data))
    },
    [runMutation]
  )

  const updatePosten = useCallback(
    async (id: number, data: Partial<Omit<Posten, 'id' | 'createdAt'>>) => {
      await runMutation(() => updatePostenRequest(id, data))
    },
    [runMutation]
  )

  const deletePosten = useCallback(
    async (id: number) => {
      await runMutation(() => deletePostenRequest(id))
    },
    [runMutation]
  )

  const addMessageType = useCallback(
    async (data: Omit<MeldungType, 'id'>) => {
      await runMutation(() => createMessageTypeRequest(data))
    },
    [runMutation]
  )

  const updateMessageType = useCallback(
    async (id: number, data: Partial<Omit<MeldungType, 'id'>>) => {
      await runMutation(() => updateMessageTypeRequest(id, data))
    },
    [runMutation]
  )

  const deleteMessageType = useCallback(
    async (id: number) => {
      await runMutation(() => deleteMessageTypeRequest(id))
    },
    [runMutation]
  )

  const addMeldung = useCallback(
    async (data: Omit<Meldung, 'id' | 'createdAt' | 'updatedAt'>) => {
      await runMutation(() => createMeldungRequest(data))
    },
    [runMutation]
  )

  const updateMeldung = useCallback(
    async (
      id: number,
      data: Partial<Pick<Meldung, 'postenId' | 'values' | 'comment' | 'isValid'>>
    ) => {
      await runMutation(() => updateMeldungRequest(id, data))
    },
    [runMutation]
  )

  const deleteMeldung = useCallback(
    async (id: number) => {
      await runMutation(() => deleteMeldungRequest(id))
    },
    [runMutation]
  )

  const value = useMemo(
    () => ({
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
      isLoading,
      error,
      refreshData,
    }),
    [
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
      isLoading,
      error,
      refreshData,
    ]
  )

  return (
    <DataContext.Provider value={value}>
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
