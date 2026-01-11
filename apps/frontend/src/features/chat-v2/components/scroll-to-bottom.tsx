"use client";

// 🎨 Scroll to bottom button component

import { memo } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollToBottomProps {
  show: boolean;
  onClick: () => void;
  isMobile: boolean;
}

function ScrollToBottomComponent({ show, onClick, isMobile }: ScrollToBottomProps) {
  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-lg hover:bg-accent transition-colors',
        isMobile ? 'bottom-32 right-4' : 'bottom-28 right-8'
      )}
    >
      <ArrowDown className="h-5 w-5" />
    </button>
  );
}

export const ScrollToBottom = memo(ScrollToBottomComponent);
