import React from "react";

export default function BlogLoading() {
  return (
    <main className="bg-cream min-h-screen pt-24 sm:pt-36 md:pt-44 lg:pt-48 pb-20">
      {/* Hero Section Skeleton */}
      <section className="container-px py-8 sm:py-12 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-saffron-200/60 bg-saffron-50 px-4 py-1.5 text-xs font-bold text-saffron-800 shadow-2xs mb-4 animate-pulse">
          <span>🪔</span>
          <span>Loading Vedic Wisdom...</span>
        </div>
        <div className="h-10 sm:h-12 w-3/4 max-w-lg mx-auto bg-saffron-200/50 rounded-2xl animate-pulse" />
        <div className="mt-4 h-4 w-2/3 max-w-md mx-auto bg-saffron-100 rounded-full animate-pulse" />
      </section>

      {/* Featured Grid Skeleton */}
      <section className="container-px max-w-7xl mx-auto">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="flex flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-soft"
            >
              {/* Image Skeleton */}
              <div className="relative h-52 w-full bg-gradient-to-br from-saffron-100/60 via-amber-50 to-saffron-100/40 animate-pulse flex items-center justify-center">
                <span className="text-2xl opacity-40">🕉️</span>
              </div>

              {/* Body Skeleton */}
              <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-20 bg-saffron-100 rounded-full animate-pulse" />
                    <div className="h-3 w-12 bg-saffron-50 rounded-full animate-pulse" />
                  </div>
                  <div className="h-6 w-5/6 bg-slate-200 rounded-xl animate-pulse" />
                  <div className="space-y-1.5 pt-1">
                    <div className="h-3.5 w-full bg-slate-100 rounded-full animate-pulse" />
                    <div className="h-3.5 w-4/5 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="pt-4 border-t border-saffron-100/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-saffron-100 animate-pulse" />
                    <div className="h-3 w-24 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-saffron-100 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
