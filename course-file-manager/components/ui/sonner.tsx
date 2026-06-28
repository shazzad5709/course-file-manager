"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

import { useTheme } from "@/components/theme-provider"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "#166534",
          "--success-text": "#ffffff",
          "--success-border": "#166534",
          "--error-bg": "#b91c1c",
          "--error-text": "#ffffff",
          "--error-border": "#b91c1c",
          "--warning-bg": "#a16207",
          "--warning-text": "#ffffff",
          "--warning-border": "#a16207",
          "--info-bg": "#0369a1",
          "--info-text": "#ffffff",
          "--info-border": "#0369a1",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast opacity-100 shadow-lg data-[type=success]:!bg-[#166534] data-[type=success]:!text-white data-[type=success]:!border-[#166534] data-[type=error]:!bg-[#b91c1c] data-[type=error]:!text-white data-[type=error]:!border-[#b91c1c] data-[type=warning]:!bg-[#a16207] data-[type=warning]:!text-white data-[type=warning]:!border-[#a16207] data-[type=info]:!bg-[#0369a1] data-[type=info]:!text-white data-[type=info]:!border-[#0369a1]",
          title: "text-current",
          description: "text-current opacity-90",
          icon: "text-current",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
