(() => {
  try {
    const preference = localStorage.getItem('devhub-theme') || 'system'
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  } catch {
    // El proveedor de tema aplicará el valor al iniciar.
  }
})()
