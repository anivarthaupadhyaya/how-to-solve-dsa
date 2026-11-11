import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Code2,
  HelpCircle,
  Edit2,
  Trash2,
  Tag as TagIcon,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '../api/client'
import { useSubjects } from '../context/SubjectsContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { Badge, TagChip } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ImportCsvModal } from '../components/ImportCsvModal'

export default function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { subjects, refreshData: refreshGlobalData } = useSubjects()

  // Items and loading states
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter state
  const initialSubject = searchParams.get('subject_id') || ''
  const [selectedSubject, setSelectedSubject] = useState(initialSubject)
  const [selectedType, setSelectedType] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // Form fields
  const [itemType, setItemType] = useState('qa') // 'qa' | 'problem'
  const [itemSubjectId, setItemSubjectId] = useState('')
  const [itemTitle, setItemTitle] = useState('')
  const [itemPrompt, setItemPrompt] = useState('')
  const [itemAnswer, setItemAnswer] = useState('')
  const [itemUrl, setItemUrl] = useState('')
  const [itemDifficulty, setItemDifficulty] = useState('medium')
  const [selectedTagIds, setSelectedTagIds] = useState([])

  // Subject-specific tags for modal
  const [subjectTags, setSubjectTags] = useState([])
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Fetch items based on active filters
  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (selectedSubject) params.subject_id = selectedSubject
      if (selectedType) params.type = selectedType
      if (selectedTag) params.tag = selectedTag

      const res = await api.get('/items', { params })
      setItems(res.data || [])
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to load study items'
      setError(msg)
      toast.error('Failed to load study items', {
        description: msg,
      })
    } finally {
      setLoading(false)
    }
  }, [selectedSubject, selectedType, selectedTag])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Sync URL search params
  useEffect(() => {
    const sId = searchParams.get('subject_id')
    if (sId !== null && sId !== selectedSubject) {
      setSelectedSubject(sId)
    }
  }, [searchParams])

  // Fetch tags for selected subject inside the modal
  const fetchSubjectTags = useCallback(async (subjId) => {
    if (!subjId) {
      setSubjectTags([])
      return
    }
    try {
      const res = await api.get(`/subjects/${subjId}/tags`)
      setSubjectTags(res.data || [])
    } catch (err) {
      console.warn('Failed to load subject tags:', err)
      setSubjectTags([])
    }
  }, [])

  useEffect(() => {
    if (itemSubjectId) {
      fetchSubjectTags(itemSubjectId)
    }
  }, [itemSubjectId, fetchSubjectTags])

  // Map of subject id to subject details
  const subjectMap = useMemo(() => {
    const map = {}
    subjects.forEach((s) => {
      map[s.id] = s
    })
    return map
  }, [subjects])

  // Unique tags list across loaded items for tag filter dropdown
  const allUniqueTags = useMemo(() => {
    const tagSet = new Set()
    items.forEach((it) => {
      it.tags?.forEach((t) => tagSet.add(t.name))
    })
    return Array.from(tagSet).sort()
  }, [items])

  // Filter items in memory by live search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter(
      (it) =>
        it.title?.toLowerCase().includes(q) ||
        it.prompt?.toLowerCase().includes(q) ||
        it.answer?.toLowerCase().includes(q) ||
        it.url?.toLowerCase().includes(q) ||
        it.tags?.some((t) => t.name.toLowerCase().includes(q))
    )
  }, [items, searchQuery])

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedSubject('')
    setSelectedType('')
    setSelectedTag('')
    setSearchQuery('')
    setSearchParams({})
  }

  // Open modal to add item
  const handleOpenAdd = () => {
    setEditingItem(null)
    setItemType('qa')
    const defaultSubj = selectedSubject || (subjects.length > 0 ? String(subjects[0].id) : '')
    setItemSubjectId(defaultSubj)
    setItemTitle('')
    setItemPrompt('')
    setItemAnswer('')
    setItemUrl('')
    setItemDifficulty('medium')
    setSelectedTagIds([])
    setFormErrors({})
    setNewTagName('')
    setIsModalOpen(true)
  }

  // Open modal to edit item
  const handleOpenEdit = (it) => {
    setEditingItem(it)
    setItemType(it.type || 'qa')
    setItemSubjectId(String(it.subject_id))
    setItemTitle(it.title || '')
    setItemPrompt(it.prompt || '')
    setItemAnswer(it.answer || '')
    setItemUrl(it.url || '')
    setItemDifficulty(it.difficulty || 'medium')
    setSelectedTagIds(it.tags ? it.tags.map((t) => t.id) : [])
    setFormErrors({})
    setNewTagName('')
    setIsModalOpen(true)
  }

  // Handle inline tag creation
  const handleCreateTag = async (e) => {
    e?.preventDefault()
    const cleanTag = newTagName.trim().toLowerCase()
    if (!cleanTag) return
    if (!itemSubjectId) {
      toast.error('Select a subject first to attach tags')
      return
    }

    setCreatingTag(true)
    try {
      const res = await api.post(`/subjects/${itemSubjectId}/tags`, {
        name: cleanTag,
      })
      const createdTag = res.data
      setSubjectTags((prev) => [...prev, createdTag])
      setSelectedTagIds((prev) => [...prev, createdTag.id])
      setNewTagName('')
      toast.success(`Tag #${createdTag.name} created!`)
    } catch (err) {
      toast.error('Could not create tag', {
        description: err.response?.data?.detail || err.message,
      })
    } finally {
      setCreatingTag(false)
    }
  }

  // Toggle tag selection
  const toggleTagSelection = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  // Validate form
  const validateForm = () => {
    const errs = {}
    if (!itemSubjectId) errs.subject_id = 'Subject is required'
    if (!itemTitle.trim()) errs.title = 'Title is required'

    if (itemType === 'qa') {
      if (!itemPrompt.trim()) errs.prompt = 'Question prompt is required'
      if (!itemAnswer.trim()) errs.answer = 'Answer explanation is required'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit add or edit item
  const handleSubmitItem = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setFormSubmitting(true)
    try {
      const payload = {
        title: itemTitle.trim(),
        type: itemType,
        prompt: itemPrompt.trim() || null,
        answer: itemAnswer.trim() || null,
        url: itemUrl.trim() || null,
        difficulty: itemType === 'problem' ? itemDifficulty : null,
        tag_ids: selectedTagIds,
      }

      if (editingItem) {
        await api.patch(`/items/${editingItem.id}`, payload)
        toast.success('Card updated', {
          description: `"${itemTitle.trim()}" has been saved.`,
        })
      } else {
        payload.subject_id = Number(itemSubjectId)
        await api.post('/items', payload)
        toast.success('Item created', {
          description: `Scheduled for review today on the SM-2 algorithm.`,
        })
      }

      setIsModalOpen(false)
      await fetchItems()
      refreshGlobalData()
    } catch (err) {
      toast.error('Failed to save card', {
        description: err.response?.data?.detail || err.message,
      })
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle delete
  const handleOpenDelete = (it) => {
    setItemToDelete(it)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setDeleteSubmitting(true)
    try {
      await api.delete(`/items/${itemToDelete.id}`)
      toast.success('Card deleted', {
        description: `"${itemToDelete.title}" removed from study queue.`,
      })
      setIsDeleteOpen(false)
      setItemToDelete(null)
      await fetchItems()
      refreshGlobalData()
    } catch (err) {
      toast.error('Failed to delete card', {
        description: err.response?.data?.detail || err.message,
      })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const hasActiveFilters = Boolean(
    selectedSubject || selectedType || selectedTag || searchQuery
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Study Items
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, search, and manage coding problems and Q&A flashcards across all your subjects.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            icon={UploadCloud}
            onClick={() => setIsImportOpen(true)}
            className="shadow-soft"
          >
            Import CSV
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenAdd}
            className="shadow-soft"
          >
            New Card
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="p-4" className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, prompt, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value)
              if (e.target.value) {
                setSearchParams({ subject_id: e.target.value })
              } else {
                setSearchParams({})
              }
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Types (Q&A & Problems)</option>
            <option value="qa">Q&A Cards Only</option>
            <option value="problem">Coding Problems Only</option>
          </select>

          {/* Tag Filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Tags</option>
            {allUniqueTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Pill Row */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Found {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset filters
            </button>
          </div>
        )}
      </Card>

      {/* Items List */}
      {error && !loading ? (
        <Card padding="p-8" className="text-center space-y-3 border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="font-bold text-sm text-rose-800 dark:text-rose-200">
            Failed to load study cards
          </h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
            {error}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCcw}
            onClick={fetchItems}
            className="shadow-2xs"
          >
            Retry Connection
          </Button>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} padding="p-5" className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={hasActiveFilters ? 'No cards match your filter' : 'No study cards yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your subject, type, or search term to discover other items.'
              : 'Add your first problem or Q&A card to start scheduling spaced repetition reviews.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                Clear all filters
              </Button>
            ) : (
              <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
                Create Card
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((it) => {
              const subj = subjectMap[it.subject_id]
              const subjColor = subj?.color || '#6366F1'
              const todayStr = new Date().toISOString().split('T')[0]
              const isDue = it.user_item && it.user_item.next_review_date <= todayStr

              return (
                <motion.div
                  key={it.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card hoverLift padding="p-5" className="relative group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left: Card details */}
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Meta Badges Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Subject Pill */}
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: subjColor }}
                            />
                            {subj ? subj.name : `Subject #${it.subject_id}`}
                          </span>

                          {/* Card Type Badge */}
                          {it.type === 'problem' ? (
                            <Badge variant="primary" size="sm">
                              <Code2 className="w-3 h-3 mr-1" />
                              Coding Problem
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              <HelpCircle className="w-3 h-3 mr-1" />
                              Q&A Card
                            </Badge>
                          )}

                          {/* Difficulty Badge (for problems) */}
                          {it.difficulty && (
                            <Badge
                              variant={
                                it.difficulty === 'easy'
                                  ? 'easy'
                                  : it.difficulty === 'hard'
                                  ? 'forgot'
                                  : 'shaky'
                              }
                              size="sm"
                              className="capitalize"
                            >
                              {it.difficulty}
                            </Badge>
                          )}

                          {/* Review status */}
                          {isDue ? (
                            <Badge variant="forgot" size="sm">
                              Due Today
                            </Badge>
                          ) : it.user_item?.next_review_date ? (
                            <span className="text-[11px] font-mono text-slate-400">
                              Next: {it.user_item.next_review_date}
                            </span>
                          ) : null}
                        </div>

                        {/* Title */}
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {it.title}
                          </h2>
                          {it.url && (
                            <a
                              href={it.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1"
                              title="Open problem link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Prompt Preview */}
                        {it.prompt && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {it.prompt}
                          </p>
                        )}

                        {/* Tags list */}
                        {it.tags && it.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {it.tags.map((t) => (
                              <TagChip
                                key={t.id}
                                name={t.name}
                                subjectColor={subjColor}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Quick actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(it)}
                          title="Edit card"
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(it)}
                          title="Delete card"
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Card Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Study Card' : 'New Study Card'}
        description={
          editingItem
            ? 'Update card details, prompts, answers, and tags.'
            : 'Create a flashcard or coding problem scheduled on the SM-2 algorithm.'
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitItem} className="space-y-4">
          {/* Type Selector Pills */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Card Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setItemType('qa')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  itemType === 'qa'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Q&A Flashcard
              </button>
              <button
                type="button"
                onClick={() => setItemType('problem')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  itemType === 'problem'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Code2 className="w-4 h-4" />
                Coding Problem
              </button>
            </div>
          </div>

          {/* Subject Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Target Subject
            </label>
            <select
              value={itemSubjectId}
              onChange={(e) => setItemSubjectId(e.target.value)}
              disabled={Boolean(editingItem)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            >
              <option value="">Select a subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {formErrors.subject_id && (
              <p className="text-xs font-medium text-rose-500">{formErrors.subject_id}</p>
            )}
          </div>

          {/* Card Title */}
          <Input
            label="Title"
            placeholder={
              itemType === 'problem'
                ? 'e.g. LRU Cache, Merge Intervals'
                : 'e.g. Process vs Thread, Virtual Memory Paging'
            }
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            error={formErrors.title}
            required
          />

          {/* Type-Specific Fields */}
          {itemType === 'problem' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Problem URL (Optional)"
                  placeholder="https://leetcode.com/problems/..."
                  value={itemUrl}
                  onChange={(e) => setItemUrl(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Difficulty
                  </label>
                  <select
                    value={itemDifficulty}
                    onChange={(e) => setItemDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <Textarea
                label="Prompt / Problem Description"
                placeholder="Briefly describe the requirements, constraints, or tricky edge cases..."
                rows={3}
                value={itemPrompt}
                onChange={(e) => setItemPrompt(e.target.value)}
              />

              <Textarea
                label="Solution Approach / Optimal Complexity"
                placeholder="Key algorithmic pattern, time & space complexity, edge cases to remember..."
                rows={3}
                value={itemAnswer}
                onChange={(e) => setItemAnswer(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                label="Question Prompt"
                placeholder="Enter the question or concept to recall..."
                rows={3}
                value={itemPrompt}
                onChange={(e) => setItemPrompt(e.target.value)}
                error={formErrors.prompt}
                required
              />

              <Textarea
                label="Answer / Explanation"
                placeholder="Enter the comprehensive answer that will be revealed during review..."
                rows={4}
                value={itemAnswer}
                onChange={(e) => setItemAnswer(e.target.value)}
                error={formErrors.answer}
                required
              />
            </div>
          )}

          {/* Tags Section with Inline Creation */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Tags
            </label>

            {/* Existing tags chips to toggle */}
            {subjectTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                {subjectTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTagSelection(tag.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs scale-102'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : '#'}
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Inline new tag input */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <TagIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Create new tag (e.g. dp, tree, memory)..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateTag()
                    }
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCreateTag}
                loading={creatingTag}
                className="text-xs shrink-0"
              >
                + Add Tag
              </Button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={formSubmitting}
            >
              {editingItem ? 'Save Changes' : 'Create Card'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Item Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Card"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">Confirm deletion</p>
              <p className="text-rose-700 dark:text-rose-300">
                Are you sure you want to delete{' '}
                <span className="font-bold">"{itemToDelete?.title}"</span>? This will
                permanently remove its SM-2 scheduling history.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={deleteSubmitting}
              onClick={handleConfirmDelete}
            >
              Delete Card
            </Button>
          </div>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <ImportCsvModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        subjects={subjects}
        defaultSubjectId={selectedSubject}
        onImportSuccess={() => {
          fetchItems()
          refreshGlobalData()
        }}
      />
    </div>
  )
}
