// The demo lets you switch on the Silero voice detection and the Smart Turn
// model, both of which load the ONNX runtime. Importing them here keeps that
// weight out of an app that never asks for it.
import '@micdrop/smart-turn/web'
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
