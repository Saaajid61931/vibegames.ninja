import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Skeleton } from "@/components/ui/skeleton"

function LoadingFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-6 sm:py-8" aria-busy="true" aria-label={label}>
        {children}
      </main>
      <Footer />
    </div>
  )
}

function PageHeadingSkeleton() {
  return (
    <div className="mb-8 border-b-3 border-border-strong pb-6">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-[32rem] max-w-full" />
    </div>
  )
}

export function GameCardSkeleton() {
  return (
    <article className="border-3 border-border-strong bg-surface shadow-hard-4" aria-hidden="true">
      <Skeleton className="aspect-video w-full border-0" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between border-t border-border pt-3">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </article>
  )
}

export function GamesRouteSkeleton() {
  return (
    <LoadingFrame label="Loading games">
      <PageHeadingSkeleton />
      <Skeleton className="mb-6 h-12 w-full border-3 border-border-strong" />
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <GameCardSkeleton key={index} />)}
      </div>
    </LoadingFrame>
  )
}

export function DashboardRouteSkeleton({ label = "Loading dashboard" }: { label?: string }) {
  return (
    <LoadingFrame label={label}>
      <PageHeadingSkeleton />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="border-2 border-border-strong bg-surface p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-10 w-28" />
            <Skeleton className="mt-3 h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <GameCardSkeleton key={index} />)}
      </div>
    </LoadingFrame>
  )
}

export function FormRouteSkeleton({ label }: { label: string }) {
  return (
    <LoadingFrame label={label}>
      <PageHeadingSkeleton />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5 border-2 border-border-strong bg-surface p-6">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index}>
              <Skeleton className="mb-2 h-3 w-28" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
          <Skeleton className="ml-auto h-11 w-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full border-2 border-border-strong" />
          <Skeleton className="h-52 w-full border-2 border-border-strong" />
        </div>
      </div>
    </LoadingFrame>
  )
}

export function PlayRouteSkeleton() {
  return (
    <LoadingFrame label="Loading game">
      <Skeleton className="mb-5 h-4 w-40" />
      <div className="mb-6 border-y-2 border-border-strong bg-surface p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-9 w-3/5" />
        <Skeleton className="mt-3 h-4 w-2/5" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-5">
          <Skeleton className="aspect-video w-full border-2 border-border-strong" />
          <Skeleton className="h-24 w-full border-2 border-border-strong" />
          <Skeleton className="h-64 w-full border-2 border-border-strong" />
        </div>
        <aside className="space-y-4" aria-label="Loading game sidebar">
          <div className="border-2 border-border-strong bg-surface p-5">
            <Skeleton className="h-3 w-24" />
            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="h-12 w-12" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="mt-5 h-10 w-full" />
          </div>
          <div className="space-y-3 border-2 border-border-strong bg-surface p-4">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        </aside>
      </div>
    </LoadingFrame>
  )
}
