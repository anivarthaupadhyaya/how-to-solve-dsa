import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const SubjectsContext = createContext(null)

export function SubjectsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setSubjects([])
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [subjectsRes, itemsRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/items'),
      ])
      setSubjects(subjectsRes.data || [])
      setItems(itemsRes.data || [])
    } catch (err) {
      console.error('Failed to load subjects or items:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const createSubject = async ({ name, color }) => {
    const res = await api.post('/subjects', { name, color })
    await refreshData()
    return res.data
  }

  const updateSubject = async (id, { name, color }) => {
    const res = await api.patch(`/subjects/${id}`, { name, color })
    await refreshData()
    return res.data
  }

  const deleteSubject = async (id) => {
    await api.delete(`/subjects/${id}`)
    await refreshData()
  }

  const value = {
    subjects,
    items,
    loading,
    error,
    refreshData,
    createSubject,
    updateSubject,
    deleteSubject,
  }

  return (
    <SubjectsContext.Provider value={value}>
      {children}
    </SubjectsContext.Provider>
  )
}

export function useSubjects() {
  const ctx = useContext(SubjectsContext)
  if (!ctx) {
    throw new Error('useSubjects must be used within SubjectsProvider')
  }
  return ctx
}

export default SubjectsContext

