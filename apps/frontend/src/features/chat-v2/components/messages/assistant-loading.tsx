"use client";

// 🎨 Assistant loading indicator - matches old UI styling

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AssistantLoadingProps {
  className?: string;
}

function AgentAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden">
      <Image
        src="/images/logo.png"
        alt="AI Assistant"
        width={32}
        height={32}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export function AssistantLoading({ className }: AssistantLoadingProps) {
  return (
    <div className={cn('mr-auto flex items-start gap-3', className)}>
      <AgentAvatar />
      <div className="bg-muted flex h-8 items-center gap-1 rounded-2xl px-4 py-2">
        <div 
          className="bg-foreground/50 h-1.5 w-1.5 rounded-full animate-wave"
          style={{ animationDelay: '0s' }}
        />
        <div 
          className="bg-foreground/50 h-1.5 w-1.5 rounded-full animate-wave"
          style={{ animationDelay: '0.15s' }}
        />
        <div 
          className="bg-foreground/50 h-1.5 w-1.5 rounded-full animate-wave"
          style={{ animationDelay: '0.3s' }}
        />
      </div>
    </div>
  );
}
