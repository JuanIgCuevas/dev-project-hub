import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AuthProvider } from './features/auth/AuthProvider'
import { ThemeProvider } from './features/theme/ThemeProvider'
import { PreferencesProvider } from './features/preferences/PreferencesProvider'
import { FocusProvider } from './features/focus/FocusProvider'
import { ToastProvider } from './features/feedback/ToastProvider'
import { registerPwa } from './features/pwa/pwaManager'
import { AppErrorBoundary } from './components/AppFallbacks'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

registerPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PreferencesProvider>
          <AppErrorBoundary>
            <AuthProvider>
              <ToastProvider>
                <FocusProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </FocusProvider>
              </ToastProvider>
            </AuthProvider>
          </AppErrorBoundary>
        </PreferencesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
