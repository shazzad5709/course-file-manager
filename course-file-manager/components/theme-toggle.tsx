"use client";

import { BookOpen, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type Theme, useTheme } from "@/components/theme-provider";

const THEME_SEQUENCE: Theme[] = ["light", "sepia", "dark"];

const THEME_ICON = {
  light: Sun,
  sepia: BookOpen,
  dark: Moon,
} satisfies Record<Theme, typeof Sun>;

const THEME_LABEL = {
  light: "Light theme",
  sepia: "Sepia theme",
  dark: "Dark theme",
} satisfies Record<Theme, string>;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = THEME_ICON[theme];

  function cycleTheme() {
    const currentIndex = THEME_SEQUENCE.indexOf(theme);
    const nextTheme = THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length];

    setTheme(nextTheme);
  }

  return (
    <Button
      aria-label={`Switch theme. Current: ${THEME_LABEL[theme]}.`}
      title={`Current: ${THEME_LABEL[theme]}`}
      variant="outline"
      size="icon"
      onClick={cycleTheme}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
