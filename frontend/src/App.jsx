import React from 'react'
import { ThemeProvider } from './context/ThemeContext'
import DesignPage from './pages/DesignPage'

export default function App() {
  return (
    <ThemeProvider>
      <DesignPage />
    </ThemeProvider>
  )
}
