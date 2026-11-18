import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/geist'
import '@fontsource/noto-sans-kannada/600.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './hooks/useBackground' // applies the saved background before first paint
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
