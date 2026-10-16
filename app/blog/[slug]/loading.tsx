import React from "react";

export default function BlogArticleLoading() {
  return (
    <main className="bg-cream min-h-screen pt-20 sm:pt-32 md:pt-40 lg:pt-44 pb-20">
      {/* Breadcrumbs Navigation Skeleton */}
      <nav aria-label="Breadcrumb" className="container-px max-w-4xl mx-auto py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 bg-slate-200 rounded-full animate-pulse" />
          <span className="text-slate-300">/</span>
          <div className="h-3 w-20 bg-slate-200 rounded-full animate-pulse" />
          <span className="text-slate-300">/</span>
          <div className="h-3 w-32 bg-slate-200 rounded-full animate-pulse" />
        </div>
      </nav>

      {/* Article Container Skeleton */}
      <article className="container-px max-w-4xl mx-auto mt-2 space-y-6">
        {/* Header Skeleton */}
        <header className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-32 bg-saffron-100 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-slate-100 rounded-full animate-pulse" />
          </div>

          <div className="h-10 sm:h-12 w-full bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-8 w-3/4 bg-slate-200 rounded-2xl animate-pulse" />

          {/* Author Byline */}
          <div className="flex items-center justify-between border-y border-saffron-100/80 py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-saffron-100 animate-pulse" />
              <div className="space-y-1">
                <div className="h-3.5 w-28 bg-slate-200 rounded-full animate-pulse" />
                <div className="h-3 w-36 bg-slate-100 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image Skeleton */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full rounded-3xl bg-gradient-to-br from-saffron-100/70 via-amber-50 to-saffron-100/50 animate-pulse flex items-center justify-center border border-saffron-100">
          <span className="text-4xl opacity-30">🕉️</span>
        </div>

        {/* Body Content Skeleton */}
        <div className="rounded-3xl border border-saffron-100/90 bg-white p-6 sm:p-10 shadow-soft space-y-6">
          <div className="space-y-2.5">
            <div className="h-4 w-full bg-slate-100 rounded-full animate-pulse" />
            <div className="h-4 w-11/12 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-4 w-4/5 bg-slate-100 rounded-full animate-pulse" />
          </div>

          <div className="h-6 w-1/2 bg-slate-200 rounded-xl animate-pulse pt-2" />

          <div className="space-y-2.5">
            <div className="h-4 w-full bg-slate-100 rounded-full animate-pulse" />
            <div className="h-4 w-5/6 bg-slate-100 rounded-full animate-pulse" />
          </div>
        </div>
      </article>
    </main>
  );
}
