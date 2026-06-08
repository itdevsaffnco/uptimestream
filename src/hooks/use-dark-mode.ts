import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Read localStorage after hydration — never during SSR
  useEffect(() => {
    setIsDark(localStorage.getItem("dark-mode") === "true");
    setInitialized(true);
  }, []);

  // Apply to DOM and persist — only after initialized to avoid wiping anti-flash state
  useEffect(() => {
    if (!initialized) return;
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("dark-mode", String(isDark));
  }, [isDark, initialized]);

  return [isDark, setIsDark] as const;
}
