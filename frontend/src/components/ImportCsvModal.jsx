import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '../api/client'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'

export function ImportCsvModal({
  isOpen,
  onClose,
  subjects = [],
  defaultSubjectId = '',
  onImportSuccess,
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    defaultSubjectId || (subjects.length > 0 ? String(subjects[0].id) : '')
  )
  const [file, setFile] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [totalRowCount, setTotalRowCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [resultSummary, setResultSummary] = useState(null)

  const fileInputRef = useRef(null)

  // Parse CSV string into array of objects (simple client-side preview parser)
  const parseCsvPreview = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    if (lines.length < 2) return { rows: [], total: 0 }

    const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase())
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV regex to handle commas inside quotes
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g
      const matches = []
      let match
      while ((match = regex.exec(lines[i])) !== null) {
        if (match.index === regex.lastIndex) regex.lastIndex++
        let val = match[1] || ''
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"')
        }
        matches.push(val.trim())
      }

      if (matches.length > 0 && matches[0]) {
        const rowObj = {}
        headers.forEach((h, idx) => {
          rowObj[h] = matches[idx] || ''
        })
        rows.push(rowObj)
      }
    }

    return {
      rows: rows.slice(0, 5),
      total: rows.length,
    }
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid .csv file')
      return
    }

    setFile(selectedFile)
    setResultSummary(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const { rows, total } = parseCsvPreview(text)
      setPreviewRows(rows)
      setTotalRowCount(total)
    }
    reader.readAsText(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const resetDialog = () => {
    setFile(null)
    setPreviewRows([])
    setTotalRowCount(0)
    setResultSummary(null)
    setUploading(false)
  }

  const handleClose = () => {
    resetDialog()
    onClose()
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file first')
      return
    }
    if (!selectedSubjectId) {
      toast.error('Please select a target subject')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('subject_id', selectedSubjectId)
      formData.append('file', file)

      const response = await api.post('/items/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const summary = response.data
      setResultSummary(summary)

      toast.success('Import completed!', {
        description: `Successfully created ${summary.created} cards.`,
      })

      if (onImportSuccess) {
        onImportSuccess()
      }
    } catch (err) {
      toast.error('Import failed', {
        description: err.response?.data?.detail || err.message,
      })
    } finally {
      setUploading(false)
    }
  }

  // Sample CSV download helper
  const handleDownloadSample = () => {
    const csvContent =
      'type,title,prompt,answer,url,difficulty,tags\n' +
      'qa,"Process vs Thread","What is the key difference between a process and a thread?","A process has its own address space, whereas threads share the process address space.","","","os,concurrency"\n' +
      'problem,"Two Sum","Given array of integers, return indices of two numbers that add up to target.","Use a hash map to look up complements in O(n) time.","https://leetcode.com/problems/two-sum/","easy","dsa,hash-table,array"\n' +
      'qa,"TCP 3-Way Handshake","Describe the steps in establishing a TCP connection.","SYN -> SYN-ACK -> ACK.","","","networking,tcp"\n'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'how_to_solve_sample_deck.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Study Cards"
      description="Upload a CSV file to add multiple problems and Q&A flashcards directly into a subject."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Step 1: Target Subject Selection */}
        {!resultSummary && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Import Into Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 2: Drag and Drop Upload Area or Preview */}
        {!resultSummary && !file && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Click to browse or drag and drop your CSV file here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Columns: type, title, prompt, answer, url, difficulty, tags
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadSample()
              }}
              className="mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download sample CSV template
            </button>
          </div>
        )}

        {/* File Preview State */}
        {!resultSummary && file && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                    {file.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {totalRowCount} rows ready for import · {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="text-xs"
              >
                Change File
              </Button>
            </div>

            {/* Preview Table of First 5 Rows */}
            {previewRows.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Preview (First 5 Rows)
                </span>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Type</th>
                        <th className="py-2 px-3 font-semibold">Title</th>
                        <th className="py-2 px-3 font-semibold">Difficulty</th>
                        <th className="py-2 px-3 font-semibold">Tags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {previewRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-mono text-[11px] uppercase">
                            {r.type || 'qa'}
                          </td>
                          <td className="py-2 px-3 font-medium max-w-[180px] truncate">
                            {r.title}
                          </td>
                          <td className="py-2 px-3 capitalize">
                            {r.difficulty || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {r.tags || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Result Summary (After Import) */}
        {resultSummary && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Import Processed</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {resultSummary.created} cards successfully added to your subject.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                  Created
                </span>
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {resultSummary.created}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                  Skipped
                </span>
                <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  {resultSummary.skipped}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                  Errors
                </span>
                <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  {resultSummary.errors?.length || 0}
                </span>
              </div>
            </div>

            {/* Error Rows Accordion / List if any */}
            {resultSummary.errors && resultSummary.errors.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Row Validation Errors ({resultSummary.errors.length})
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200">
                  {resultSummary.errors.map((err, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <span>Row {err.row}: {err.detail}</span>
                      {err.title && <span className="opacity-70 font-mono">"{err.title}"</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          {resultSummary ? (
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={uploading}
                disabled={!file}
                onClick={handleUpload}
              >
                Import {totalRowCount > 0 ? `${totalRowCount} Cards` : ''}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ImportCsvModal

