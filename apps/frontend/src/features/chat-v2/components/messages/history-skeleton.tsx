"use client";

// 🎨 History loading skeleton with shimmer effect

import { cn } from '@/lib/utils';

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-4 rounded-md bg-muted/60 relative overflow-hidden',
        className
      )}
    >
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
        style={{
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function HumanMessageSkeleton() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <div className="flex flex-col gap-2">
        <div className="bg-muted/40 ml-auto rounded-3xl px-4 py-3 relative overflow-hidden">
          <SkeletonLine className="w-32 h-4" />
        </div>
      </div>
    </div>
  );
}

function AssistantMessageSkeleton() {
  return (
    <div className="mr-auto flex w-full items-start gap-3">
      {/* Avatar skeleton */}
      <div className="h-8 w-8 shrink-0 rounded-full bg-muted/60 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
          style={{
            animation: 'shimmer 1.5s infinite',
          }}
        />
      </div>
      
      {/* Content skeleton */}
      <div className="flex w-full flex-col gap-2 min-w-0">
        <div className="py-1 space-y-2">
          <SkeletonLine className="w-3/4" />
          <SkeletonLine className="w-1/2" />
          <SkeletonLine className="w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Simulate a conversation */}
      <HumanMessageSkeleton />
      <AssistantMessageSkeleton />
      <HumanMessageSkeleton />
      <AssistantMessageSkeleton />
    </div>
  );
}
