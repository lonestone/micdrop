// The demo lets you switch to the Silero voice detection, which loads the ONNX
// runtime. Importing it here keeps that weight out of an app that never asks
// for it.
import '@micdrop/web/silero'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')

if (container) {
  const root = createRoot(container)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
