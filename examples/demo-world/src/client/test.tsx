import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TestPage from './test/TestPage'

const container = document.getElementById('root')

if (container) {
  createRoot(container).render(
    <StrictMode>
      <TestPage />
    </StrictMode>
  )
}
