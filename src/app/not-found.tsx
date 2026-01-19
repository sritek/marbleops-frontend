import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, HardHat } from "lucide-react";

/**
 * Custom 404 Page - "Lost in the Quarry"
 * A playful, marble-industry themed not found page
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4">
      {/* Background pattern - subtle marble veins */}
      <div 
        className="fixed inset-0 opacity-5 dark:opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23374151' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <div className="relative text-center max-w-lg">
        {/* Floating animated marble slab */}
        <div className="relative mb-8 animate-bounce" style={{ animationDuration: '3s' }}>
          {/* The "404" slab */}
          <div className="relative inline-block">
            {/* Shadow */}
            <div 
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-4 bg-text-muted/20 rounded-full blur-xl"
              style={{ animationDelay: '0.5s' }}
            />
            
            {/* Marble slab */}
            <div className="relative bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-800 rounded-xl p-8 shadow-2xl border border-border-subtle overflow-hidden">
              {/* Marble veins effect */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(135deg, transparent 40%, rgba(156, 163, 175, 0.3) 45%, transparent 50%, transparent 60%, rgba(156, 163, 175, 0.2) 65%, transparent 70%)',
                }}
              />
              
              {/* Crack effect */}
              <svg 
                className="absolute top-2 right-4 w-16 h-16 text-gray-400/40 dark:text-slate-500/40" 
                viewBox="0 0 24 24" 
                fill="none"
                aria-hidden="true"
              >
                <path 
                  d="M12 2L14 8L12 10L15 14L12 22" 
                  stroke="currentColor" 
                  strokeWidth="0.5" 
                  strokeLinecap="round"
                />
                <path 
                  d="M12 10L9 12L11 15" 
                  stroke="currentColor" 
                  strokeWidth="0.5" 
                  strokeLinecap="round"
                />
              </svg>

              {/* 404 text */}
              <span className="relative text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-400 to-gray-600 dark:from-slate-400 dark:to-slate-200">
                404
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-text-muted">
            <HardHat className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Lost in the Quarry</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
            This slab got chipped!
          </h1>

          <p className="text-text-muted max-w-md mx-auto">
            Looks like this page cracked under pressure and rolled off somewhere. 
            Even our best forklift operators couldn&apos;t find it.
          </p>

          {/* Fun facts */}
          <div className="py-4">
            <p className="text-sm text-text-muted italic">
              &quot;Not all who wander are lost... but this page definitely is.&quot;
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button asChild size="lg">
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            
            <Button variant="secondary" asChild size="lg">
              <Link href="/inventory">
                <Search className="h-4 w-4 mr-2" />
                Search Inventory
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer joke */}
        <p className="mt-12 text-xs text-text-muted">
          Error Code: SLAB_NOT_FOUND • Hardness: 404 Mohs • Weight: 0 kg (missing)
        </p>
      </div>
    </div>
  );
}
