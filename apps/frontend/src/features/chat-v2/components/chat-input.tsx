"use client";

// 🎨 Chat input component

import { memo, type FormEvent } from 'react';
import { Send, Paperclip, Square, Wrench } from 'lucide-react';
import { Button } from '@/shared/ui/button-v2';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { ContentBlocksPreview } from '@/features/chat/thread/components/content-blocks-preview';
import { useChatState } from '@/features/chat-v2/providers';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  onStop: () => void;
  // File upload - using any to match useFileUpload hook types
  contentBlocks: any[];
  onRemoveBlock: (index: number) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  dropRef: React.RefObject<HTMLDivElement | null>;
  dragOver: boolean;
}

function ChatInputComponent({
  input,
  setInput,
  onSubmit,
  isLoading,
  onStop,
  contentBlocks,
  onRemoveBlock,
  onFileUpload,
  onPaste,
  dropRef,
  dragOver,
}: ChatInputProps) {
  const { hideToolCalls, setHideToolCalls } = useChatState();

  return (
    <div
      ref={dropRef}
      className={cn(
        'rounded-xl border bg-muted/50 transition-all',
        dragOver ? 'border-primary border-2 border-dotted' : 'border-border'
      )}
    >
      <form onSubmit={onSubmit}>
        {/* Content blocks preview */}
        <ContentBlocksPreview blocks={contentBlocks} onRemove={onRemoveBlock} />
        
        {/* Text input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              const form = (e.target as HTMLElement)?.closest('form');
              form?.requestSubmit();
            }
          }}
          placeholder="Send a message..."
          className="w-full resize-none border-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:outline-none min-h-[44px] max-h-[200px]"
          rows={1}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            {/* Upload button with label */}
            <Tooltip>
              <TooltipTrigger asChild>
                <label
                  htmlFor="file-input"
                  className="flex h-8 cursor-pointer items-center gap-1.5 px-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Paperclip className="h-4 w-4" />
                  <span className="text-xs">Attach</span>
                </label>
              </TooltipTrigger>
              <TooltipContent>Attach files (images, PDF)</TooltipContent>
            </Tooltip>
            <input
              id="file-input"
              type="file"
              onChange={onFileUpload}
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              className="hidden"
            />
            
            {/* Toggle hide tools button with label */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setHideToolCalls(!hideToolCalls)}
                  className={cn(
                    'flex h-8 items-center gap-1.5 px-2 rounded-lg transition-colors',
                    hideToolCalls 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Wrench className="h-4 w-4" />
                  <span className="text-xs">Tools</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {hideToolCalls ? 'Show tool calls' : 'Hide tool calls'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Send/Stop button */}
          {isLoading ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={onStop}
                  variant="destructive"
                  className="h-8 w-8 rounded-full p-0"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop generating</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="submit"
              disabled={isLoading || (!input.trim() && contentBlocks.length === 0)}
              className="h-8 w-8 rounded-full p-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export const ChatInput = memo(ChatInputComponent);
