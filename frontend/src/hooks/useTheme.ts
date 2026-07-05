import { useEffect, useState } from "react";

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem("vehisense:theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("vehisense:theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((value) => !value) };
}
