import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AuthProvider } from './features/auth/AuthProvider'
import { ThemeProvider } from './features/theme/ThemeProvider'
import { PreferencesProvider } from './features/preferences/PreferencesProvider'
import { FocusProvider } from './features/focus/FocusProvider'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PreferencesProvider>
          <AuthProvider>
            <FocusProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </FocusProvider>
          </AuthProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
