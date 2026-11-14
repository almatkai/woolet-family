import { createContext, useContext, useEffect, useMemo, useState } from "react"
import posthog from "posthog-js"

export type Theme = "system" | "dark" | "light" | "super-dark"
export type ResolvedTheme = Exclude<Theme, "system">

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    () => theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme
  )

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const applyTheme = () => {
      const nextTheme: ResolvedTheme = theme === "system"
        ? (mediaQuery.matches ? "dark" : "light")
        : theme

      setResolvedTheme(nextTheme)
      root.classList.remove("light", "dark", "super-dark")

      if (nextTheme === "super-dark") {
        root.classList.add("dark", "super-dark")
      } else {
        root.classList.add(nextTheme)
      }

      root.style.colorScheme = nextTheme === "light" ? "light" : "dark"
    }

    applyTheme()
    posthog.register({ theme })

    if (theme !== "system") return

    mediaQuery.addEventListener("change", applyTheme)
    return () => mediaQuery.removeEventListener("change", applyTheme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
      posthog.capture('theme_changed', { theme })
      posthog.register({ theme }) // Register as a super property for all future events
    },
  }), [resolvedTheme, storageKey, theme])

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
