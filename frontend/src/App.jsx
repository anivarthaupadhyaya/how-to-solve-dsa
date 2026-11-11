import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import ReviewPage from './pages/ReviewPage'
import ItemsPage from './pages/ItemsPage'
import SubjectsPage from './pages/SubjectsPage'
import DesignPage from './pages/DesignPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Design System Preview (Accessible for design inspection) */}
            <Route element={<AppLayout />}>
              <Route path="/design" element={<DesignPage />} />
            </Route>

            {/* Protected App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
