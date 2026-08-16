import type { ReactNode } from 'react'
import { Coffee } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  header?: ReactNode
}

// Mobile-first shell (brief: minimum reference iPhone SE, 375px viewport) —
// grows into a wider reading width at larger breakpoints instead of staying
// pinned to the mobile cap.
export function Layout({ children, header }: LayoutProps) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="h-1.5 bg-neutral" />
      <div className="mx-auto flex w-full flex-1 flex-col max-w-md sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
        <header className="flex items-center gap-2 border-b border-neutral-muted/20 px-4 py-4 sm:px-6 lg:px-8">
          {header ?? (
            <>
              <Coffee className="size-6 text-primary" aria-hidden="true" />
              <span className="font-heading text-lg font-semibold">Kōfe</span>
            </>
          )}
        </header>
        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
