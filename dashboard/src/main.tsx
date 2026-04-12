import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CEOChatProvider } from './context/CEOChatContext'
import { SidebarProvider } from './context/SidebarContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <SidebarProvider>
          <CEOChatProvider>
            <App />
          </CEOChatProvider>
        </SidebarProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
