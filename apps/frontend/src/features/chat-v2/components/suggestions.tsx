"use client";

// 🎨 Suggestions component - matches old UI styling

import { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, RefreshCw, SparkleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Suggestion } from '@/features/chat/components/suggestion';
import { getAgentSuggestions, getAgentConfig } from '@/features/chat-v2/config';

interface SuggestionsProps {
  agentId: string;
  onSendMessage: (message: string) => void;
  className?: string;
}

function SuggestionsComponent({ 
  agentId, 
  onSendMessage,
  className 
}: SuggestionsProps) {
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getRandomSuggestions = useCallback(() => {
    return getAgentSuggestions(agentId, 4);
  }, [agentId]);

  // Load initial suggestions
  useEffect(() => {
    setSuggestedActions(getRandomSuggestions());
  }, [getRandomSuggestions]);

  const config = getAgentConfig(agentId);

  return (
    <div className={cn('w-full pt-2', className)}>
      {/* Header with collapse/expand controls */}
      <div className="flex flex-row items-center justify-between rounded-lg gap-1 px-2">
        <div className="flex flex-row items-center gap-1">
          <SparkleIcon width={12} height={12}/>
          <span className="text-xs text-muted-foreground">
            Suggestions for {config.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <button
              onClick={() => setSuggestedActions(getRandomSuggestions())}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
              type="button"
              title="Refresh suggestions"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
            type="button"
            title={isCollapsed ? "Show suggestions" : "Hide suggestions"}
          >
            {isCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      
      {/* Suggestions horizontal scroll with animation */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="relative mt-3">
              {/* Gradient fade effects */}
              <div className="absolute left-0 top-0 z-10 h-full w-[10%] bg-gradient-to-r from-background to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 z-10 h-full w-[10%] bg-gradient-to-l from-background to-transparent pointer-events-none" />
              
              {/* Horizontal scrolling container */}
              <div 
                className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {suggestedActions.map((suggestedAction: string, index: number) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    initial={{ opacity: 0, y: 20 }}
                    key={suggestedAction}
                    transition={{ delay: 0.05 * index }}
                    className="shrink-0"
                  >
                    <Suggestion
                      suggestion={suggestedAction}
                      onClick={onSendMessage}
                      className="whitespace-nowrap"
                    >
                      {suggestedAction}
                    </Suggestion>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Suggestions = memo(
  SuggestionsComponent,
  (prevProps, nextProps) => {
    if (prevProps.agentId !== nextProps.agentId) {
      return false;
    }
    return true;
  }
);
