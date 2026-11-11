import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from './context/ThemeContext'
import { AppLayout } from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import ReviewPage from './pages/ReviewPage'
import ItemsPage from './pages/ItemsPage'
import SubjectsPage from './pages/SubjectsPage'
import DesignPage from './pages/DesignPage'

export default function App() {
  return (
    <ThemeProvider>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* App Shell Layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/design" element={<DesignPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
