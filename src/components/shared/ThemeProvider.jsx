import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * LOW PRIORITY P4 Issue #41 - Dark Mode Support
 * Theme provider wrapper using next-themes
 */
export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
