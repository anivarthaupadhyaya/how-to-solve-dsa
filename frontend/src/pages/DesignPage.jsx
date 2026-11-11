import React, { useState } from 'react'
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sun,
  Moon,
  Trash2,
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
  Badge,
  TagChip,
  Modal,
  Skeleton,
  EmptyState,
} from '../components/ui'
import { useTheme } from '../context/ThemeContext'

export default function DesignPage() {
  const { theme, toggleTheme } = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="min-h-screen p-6 sm:p-12 max-w-6xl mx-auto space-y-12">
      <Toaster richColors position="top-right" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
            Design System Spec
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
            Component Showcase
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standard design tokens: Inter, JetBrains Mono, Indigo-Violet gradient, soft layered shadows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={theme === 'dark' ? Sun : Moon}
            onClick={toggleTheme}
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </Button>
          <Button
            variant="primary"
            icon={Sparkles}
            onClick={() => toast.success('Sonner toast works beautifully!')}
          >
            Trigger Toast
          </Button>
        </div>
      </div>

      {/* 1. Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">1. Buttons & Rating Actions</h2>
        <Card className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary Gradient</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger" icon={Trash2}>Danger</Button>
          <Button variant="primary" loading>Loading</Button>

          {/* SM-2 Rating buttons */}
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-2" />
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-semibold text-slate-400 mr-2 uppercase">SM-2 Ratings:</span>
            <Button variant="forgot">Forgot (1 day)</Button>
            <Button variant="shaky">Shaky</Button>
            <Button variant="easy">Easy</Button>
          </div>
        </Card>
      </section>

      {/* 2. Badges and Tag Chips */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">2. Badges & Tags</h2>
        <Card className="flex flex-wrap gap-3 items-center">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="forgot">Forgot</Badge>
          <Badge variant="shaky">Shaky</Badge>
          <Badge variant="easy">Easy</Badge>
          <Badge variant="outline">Outline</Badge>
          <TagChip name="dynamic-programming" subjectColor="#6366F1" count={12} />
          <TagChip name="binary-search" subjectColor="#10B981" onRemove={() => toast.info('Tag removed')} />
          <TagChip name="operating-systems" subjectColor="#F59E0B" />
        </Card>
      </section>

      {/* 3. Cards & Hover Lift */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">3. Cards & Elevations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hoverLift>
            <div className="flex items-center gap-2 text-indigo-500 font-semibold text-sm">
              <BookOpen className="w-4 h-4" />
              <span>Hover Lift Card</span>
            </div>
            <h3 className="text-lg font-bold mt-2">Interactive Study Card</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Cards feature soft layered shadows, subtle 1px border, and smooth spring physics.
            </p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Static Elevation</span>
            </div>
            <h3 className="text-lg font-bold mt-2">Quiet Status Container</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Generous 24px (p-6) padding with rounded-2xl geometry.
            </p>
          </Card>
          <Card className="border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2 text-violet-500 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Glow Accent</span>
            </div>
            <h3 className="text-lg font-bold mt-2">Featured Metric</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Highlight container for weak tags or streak callouts.
            </p>
          </Card>
        </div>
      </section>

      {/* 4. Form Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">4. Form Inputs</h2>
        <Card className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="Email Address"
            placeholder="student@example.com"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="We will never share your email."
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={inputValue === 'error' ? 'Invalid password provided' : undefined}
            helperText="Type 'error' in email to simulate error state."
          />
          <Select
            label="Target Subject"
            options={[
              { value: 'dsa', label: 'Data Structures & Algorithms' },
              { value: 'os', label: 'Operating Systems' },
              { value: 'cn', label: 'Computer Networks' },
            ]}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Flashcard Answer"
              placeholder="Explain concept clearly..."
              helperText="Markdown supported for code blocks."
            />
          </div>
        </Card>
      </section>

      {/* 5. Skeletons, Modal, and Empty State */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">5. Skeletons, Modal & Empty States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-400 uppercase">Loading Skeletons</h3>
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
            <div className="pt-4">
              <Button variant="secondary" onClick={() => setModalOpen(true)}>
                Open Modal Dialog
              </Button>
            </div>
          </Card>

          <EmptyState
            icon={HelpCircle}
            title="No Reviews Due Today"
            description="You are all caught up on your spaced repetition schedule. Feel free to review early or add new cards."
            action={
              <Button variant="primary" icon={Sparkles} onClick={() => toast('Ready to learn!')}>
                Explore Decks
              </Button>
            }
          />
        </div>
      </section>

      {/* Modal instance */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Study Card"
        description="Create a problem or flashcard question for spaced repetition."
      >
        <div className="space-y-4 pt-2">
          <Input label="Title" placeholder="e.g. Invert Binary Tree" />
          <Textarea label="Prompt" placeholder="Write question prompt..." rows={3} />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false)
                toast.success('Card created successfully!')
              }}
            >
              Save Card
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
