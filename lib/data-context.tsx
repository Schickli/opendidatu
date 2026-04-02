'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ImportedOverlayRecord } from '@/lib/contracts'
import {
  clearImportedOverlay as clearImportedOverlayRequest,
  createMeldung as createMeldungRequest,
  createMessageType as createMessageTypeRequest,
  createPosten as createPostenRequest,
  deleteMeldung as deleteMeldungRequest,
  deleteMessageType as deleteMessageTypeRequest,
  deletePosten as deletePostenRequest,
  fetchBootstrapSnapshot,
  fetchImportedOverlay,
  fetchMeldungenPage,
  uploadImportedOverlay as uploadImportedOverlayRequest,
  updateMeldung as updateMeldungRequest,
  updateMessageType as updateMessageTypeRequest,
  updatePosten as updatePostenRequest,
} from '@/lib/api-client'
import type {
  BootstrapSnapshot,
  MeldungenFilters,
  MeldungLastHourCount,
  PostenRecentMeldungen,
} from '@/lib/contracts'
import type { MeldungType, Meldung, Posten } from './store'

const MELDUNGEN_PAGE_SIZE = 100
const DEFAULT_MELDUNGEN_FILTERS: MeldungenFilters = {
  typeIds: [],
  validity: 'all',
  rangeStartAt: null,
  rangeEndAt: null,
}

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
  meldungCount: number
  meldungenTotalCount: number
  hasMoreMeldungen: boolean
  isLoadingMeldungen: boolean
  isLoadingMoreMeldungen: boolean
  loadMoreMeldungen: () => Promise<void>
  lastHourCounts: MeldungLastHourCount[]
  recentMeldungenByPosten: PostenRecentMeldungen[]
  meldungenFilters: MeldungenFilters
  setMeldungenFilters: React.Dispatch<React.SetStateAction<MeldungenFilters>>
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

  // Imported overlay
  importedOverlay: ImportedOverlayRecord | null
  isLoadingImportedOverlay: boolean
  isUploadingImportedOverlay: boolean
  overlayError: string | null
  loadImportedOverlay: () => Promise<void>
  uploadImportedOverlay: (file: File) => Promise<void>
  clearImportedOverlay: () => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [posten, setPosten] = useState<Posten[]>([])
  const [messageTypes, setMessageTypes] = useState<MeldungType[]>([])
  const [meldungen, setMeldungen] = useState<Meldung[]>([])
  const [meldungCount, setMeldungCount] = useState(0)
  const [meldungenTotalCount, setMeldungenTotalCount] = useState(0)
  const [lastHourCounts, setLastHourCounts] = useState<MeldungLastHourCount[]>([])
  const [recentMeldungenByPosten, setRecentMeldungenByPosten] = useState<PostenRecentMeldungen[]>([])
  const [nextMeldungenCursor, setNextMeldungenCursor] = useState<string | null>(null)
  const [hasMoreMeldungen, setHasMoreMeldungen] = useState(false)
  const [meldungenFilters, setMeldungenFilters] = useState<MeldungenFilters>(DEFAULT_MELDUNGEN_FILTERS)
  const [selectedPostenId, setSelectedPostenId] = useState<number | null>(null)
  const [importedOverlay, setImportedOverlay] = useState<ImportedOverlayRecord | null>(null)
  const [isLoadingImportedOverlay, setIsLoadingImportedOverlay] = useState(true)
  const [isUploadingImportedOverlay, setIsUploadingImportedOverlay] = useState(false)
  const [overlayError, setOverlayError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isBootstrapLoaded, setIsBootstrapLoaded] = useState(false)
  const [isLoadingMeldungen, setIsLoadingMeldungen] = useState(false)
  const [isLoadingMoreMeldungen, setIsLoadingMoreMeldungen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const meldungenRequestVersionRef = useRef(0)

  const applyBootstrap = useCallback((snapshot: BootstrapSnapshot) => {
    setPosten(snapshot.posten)
    setMessageTypes(snapshot.messageTypes)
    setMeldungCount(snapshot.meldungCount)
    setLastHourCounts(snapshot.lastHourCounts)
    setRecentMeldungenByPosten(snapshot.recentMeldungenByPosten)
  }, [])

  const loadInitialMeldungen = useCallback(async (
    postenId: number | null,
    filters: MeldungenFilters,
  ) => {
    const requestVersion = ++meldungenRequestVersionRef.current
    setIsLoadingMeldungen(true)

    try {
      const page = await fetchMeldungenPage({
        limit: MELDUNGEN_PAGE_SIZE,
        postenId: postenId ?? undefined,
        filters,
      })

      if (requestVersion !== meldungenRequestVersionRef.current) {
        return
      }

      setMeldungen(page.meldungen)
      setMeldungenTotalCount(page.totalCount)
      setHasMoreMeldungen(page.hasMore)
      setNextMeldungenCursor(page.nextCursor)
      setError(null)
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Meldungen konnten nicht geladen werden.'
      )
    } finally {
      setIsLoadingMeldungen(false)
    }
  }, [])

  const runMutation = useCallback(
    async (operation: () => Promise<BootstrapSnapshot>) => {
      const snapshot = await operation()
      applyBootstrap(snapshot)
      await loadInitialMeldungen(selectedPostenId, meldungenFilters)
      setError(null)
    },
    [applyBootstrap, loadInitialMeldungen, meldungenFilters, selectedPostenId]
  )

  const refreshData = useCallback(async () => {
    setIsBootstrapping(true)
    try {
      const snapshot = await fetchBootstrapSnapshot()
      applyBootstrap(snapshot)
      setIsBootstrapLoaded(true)
      setError(null)
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Daten konnten nicht geladen werden.'
      )
    } finally {
      setIsBootstrapping(false)
    }
  }, [applyBootstrap])

  const loadImportedOverlay = useCallback(async () => {
    setIsLoadingImportedOverlay(true)

    try {
      const response = await fetchImportedOverlay()
      setImportedOverlay(response.overlay)
      setOverlayError(null)
    } catch (loadError) {
      setOverlayError(
        loadError instanceof Error
          ? loadError.message
          : 'Overlay konnte nicht geladen werden.'
      )
    } finally {
      setIsLoadingImportedOverlay(false)
    }
  }, [])

  const loadMoreMeldungen = useCallback(async () => {
    if (
      isLoadingMeldungen ||
      isLoadingMoreMeldungen ||
      !hasMoreMeldungen ||
      !nextMeldungenCursor
    ) {
      return
    }

    setIsLoadingMoreMeldungen(true)
    const requestVersion = meldungenRequestVersionRef.current
    try {
      const page = await fetchMeldungenPage({
        limit: MELDUNGEN_PAGE_SIZE,
        postenId: selectedPostenId ?? undefined,
        cursor: nextMeldungenCursor,
        filters: meldungenFilters,
      })

      if (requestVersion !== meldungenRequestVersionRef.current) {
        return
      }

      setMeldungen((current) => [...current, ...page.meldungen])
      setMeldungenTotalCount(page.totalCount)
      setHasMoreMeldungen(page.hasMore)
      setNextMeldungenCursor(page.nextCursor)
      setError(null)
    } catch (loadMoreError) {
      setError(
        loadMoreError instanceof Error
          ? loadMoreError.message
          : 'Weitere Meldungen konnten nicht geladen werden.'
      )
    } finally {
      setIsLoadingMoreMeldungen(false)
    }
  }, [
    hasMoreMeldungen,
    isLoadingMeldungen,
    isLoadingMoreMeldungen,
    meldungenFilters,
    nextMeldungenCursor,
    selectedPostenId,
  ])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  useEffect(() => {
    void loadImportedOverlay()
  }, [loadImportedOverlay])

  useEffect(() => {
    if (!isBootstrapLoaded) {
      return
    }

    void loadInitialMeldungen(selectedPostenId, meldungenFilters)
  }, [isBootstrapLoaded, loadInitialMeldungen, meldungenFilters, selectedPostenId])

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

  const uploadImportedOverlay = useCallback(async (file: File) => {
    setIsUploadingImportedOverlay(true)

    try {
      const response = await uploadImportedOverlayRequest(file)
      setImportedOverlay(response.overlay)
      setOverlayError(null)
    } catch (uploadError) {
      setOverlayError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Overlay konnte nicht gespeichert werden.'
      )
      throw uploadError
    } finally {
      setIsUploadingImportedOverlay(false)
    }
  }, [])

  const clearImportedOverlay = useCallback(async () => {
    setIsUploadingImportedOverlay(true)

    try {
      const response = await clearImportedOverlayRequest()
      setImportedOverlay(response.overlay)
      setOverlayError(null)
    } catch (clearError) {
      setOverlayError(
        clearError instanceof Error
          ? clearError.message
          : 'Overlay konnte nicht geloescht werden.'
      )
      throw clearError
    } finally {
      setIsUploadingImportedOverlay(false)
    }
  }, [])

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
      meldungCount,
      meldungenTotalCount,
      hasMoreMeldungen,
      isLoadingMeldungen,
      isLoadingMoreMeldungen,
      loadMoreMeldungen,
      lastHourCounts,
      recentMeldungenByPosten,
      meldungenFilters,
      setMeldungenFilters,
      addMeldung,
      updateMeldung,
      deleteMeldung,
      selectedPostenId,
      setSelectedPostenId,
      isLoading: isBootstrapping || !isBootstrapLoaded || isLoadingMeldungen,
      error,
      refreshData,
      importedOverlay,
      isLoadingImportedOverlay,
      isUploadingImportedOverlay,
      overlayError,
      loadImportedOverlay,
      uploadImportedOverlay,
      clearImportedOverlay,
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
      meldungCount,
      meldungenTotalCount,
      hasMoreMeldungen,
      isLoadingMeldungen,
      isLoadingMoreMeldungen,
      loadMoreMeldungen,
      lastHourCounts,
      recentMeldungenByPosten,
      meldungenFilters,
      addMeldung,
      updateMeldung,
      deleteMeldung,
      selectedPostenId,
      isBootstrapping,
      isBootstrapLoaded,
      isLoadingMeldungen,
      error,
      refreshData,
      importedOverlay,
      isLoadingImportedOverlay,
      isUploadingImportedOverlay,
      overlayError,
      loadImportedOverlay,
      uploadImportedOverlay,
      clearImportedOverlay,
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
