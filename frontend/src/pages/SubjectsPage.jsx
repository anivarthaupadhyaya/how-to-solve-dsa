import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Repeat,
  Layers,
  AlertTriangle,
  FolderPlus,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSubjects } from '../context/SubjectsContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#64748B', // Slate
]

export default function SubjectsPage() {
  const { subjects, items, loading, createSubject, updateSubject, deleteSubject } =
    useSubjects()

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [subjectName, setSubjectName] = useState('')
  const [subjectColor, setSubjectColor] = useState(PRESET_COLORS[0])
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete confirmation modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Calculate item and due counts per subject
  const subjectStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const map = {}

    subjects.forEach((s) => {
      map[s.id] = { total: 0, due: 0 }
    })

    items.forEach((item) => {
      if (map[item.subject_id]) {
        map[item.subject_id].total += 1
        if (item.user_item && item.user_item.next_review_date <= todayStr) {
          map[item.subject_id].due += 1
        }
      }
    })

    return map
  }, [subjects, items])

  // Open modal for new subject
  const handleOpenCreate = () => {
    setEditingSubject(null)
    setSubjectName('')
    setSubjectColor(PRESET_COLORS[0])
    setFormError('')
    setIsFormOpen(true)
  }

  // Open modal for editing
  const handleOpenEdit = (subject) => {
    setEditingSubject(subject)
    setSubjectName(subject.name)
    setSubjectColor(subject.color || PRESET_COLORS[0])
    setFormError('')
    setIsFormOpen(true)
  }

  // Save subject (create or edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!subjectName.trim()) {
      setFormError('Subject name is required')
      return
    }

    setFormSubmitting(true)
    setFormError('')

    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name: subjectName.trim(),
          color: subjectColor,
        })
        toast.success('Subject updated', {
          description: `"${subjectName.trim()}" has been updated successfully.`,
        })
      } else {
        await createSubject({
          name: subjectName.trim(),
          color: subjectColor,
        })
        toast.success('Subject created', {
          description: `"${subjectName.trim()}" is ready for items.`,
        })
      }
      setIsFormOpen(false)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save subject'
      setFormError(msg)
      toast.error('Error saving subject', { description: msg })
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open delete confirm
  const handleOpenDelete = (subject) => {
    setSubjectToDelete(subject)
    setIsDeleteOpen(true)
  }

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return
    setDeleteSubmitting(true)
    try {
      await deleteSubject(subjectToDelete.id)
      toast.success('Subject deleted', {
        description: `"${subjectToDelete.name}" and associated cards were removed.`,
      })
      setIsDeleteOpen(false)
      setSubjectToDelete(null)
    } catch (err) {
      toast.error('Failed to delete subject', {
        description: err.response?.data?.detail || err.message,
      })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Subjects
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize study material into topics like DSA, Operating Systems, Computer Networks, and DBMS.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleOpenCreate}
          className="shadow-soft"
        >
          New Subject
        </Button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-5 w-1/2" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="No subjects created yet"
          description="Subjects keep your cards categorized and allow you to study topics individually with SM-2 spaced repetition."
          action={
            <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
              Create your first subject
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => {
            const stats = subjectStats[sub.id] || { total: 0, due: 0 }
            const color = sub.color || '#6366F1'

            return (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  hoverLift
                  className="flex flex-col justify-between h-full relative overflow-hidden group"
                  padding="p-6"
                >
                  {/* Top color indicator bar */}
                  <div
                    className="absolute top-0 inset-x-0 h-1.5 transition-opacity"
                    style={{ backgroundColor: color }}
                  />

                  <div>
                    {/* Header: Name + Edit/Delete actions */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: color }}
                        />
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                          {sub.name}
                        </h2>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sub)}
                          title="Edit subject"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(sub)}
                          title="Delete subject"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats summary */}
                    <div className="flex items-center gap-2 mb-6">
                      <Badge variant="default" size="sm">
                        <Layers className="w-3 h-3 mr-1 text-slate-400" />
                        {stats.total} {stats.total === 1 ? 'card' : 'cards'}
                      </Badge>

                      {stats.due > 0 ? (
                        <Badge variant="forgot" size="sm">
                          {stats.due} due today
                        </Badge>
                      ) : (
                        <Badge variant="easy" size="sm">
                          All caught up
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <Link to={`/review?subject_id=${sub.id}`} className="block">
                      <Button
                        variant={stats.due > 0 ? 'primary' : 'secondary'}
                        size="sm"
                        className="w-full text-xs"
                        icon={Repeat}
                      >
                        {stats.due > 0 ? `Review (${stats.due})` : 'Practice'}
                      </Button>
                    </Link>

                    <Link to={`/items?subject_id=${sub.id}`} className="block">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs"
                        icon={Layers}
                      >
                        View Items
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Subject Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'New Subject'}
        description={
          editingSubject
            ? 'Update the name or color theme of this subject.'
            : 'Create a new category to group related problems and study questions.'
        }
      >
        <form onSubmit={handleSubmitForm} className="space-y-5">
          <Input
            label="Subject Name"
            placeholder="e.g. Operating Systems, Dynamic Programming"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            error={formError}
            autoFocus
            required
          />

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Color Accent
            </label>
            <div className="flex flex-wrap gap-2.5 py-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSubjectColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {subjectColor.toLowerCase() === c.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom hex input */}
            <div className="flex items-center gap-2 pt-1">
              <span
                className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                style={{ backgroundColor: subjectColor }}
              />
              <input
                type="text"
                value={subjectColor}
                onChange={(e) => setSubjectColor(e.target.value)}
                placeholder="#6366F1"
                className="w-28 text-xs font-mono uppercase px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-400">Hex color</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={formSubmitting}
            >
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Subject"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">This action cannot be undone.</p>
              <p className="text-rose-700 dark:text-rose-300">
                Deleting{' '}
                <span className="font-bold">"{subjectToDelete?.name}"</span> will
                permanently remove all of its study cards, tags, and review history.
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
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
