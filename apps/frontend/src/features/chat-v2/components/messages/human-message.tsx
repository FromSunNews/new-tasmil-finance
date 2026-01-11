"use client";

// 🎨 Human message component - matches old UI styling

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CommandBar } from '@/features/chat/thread/messages/shared';
import { MultimodalPreview } from '@/features/chat/thread/components/multimodal-preview';
import { isBase64ContentBlock } from '@/lib/multimodal-utils';
import type { UniversalMessage, ContentBlock } from '@/features/chat-v2/types';
import { getTextFromContent } from '@/features/chat-v2/types';

interface HumanMessageProps {
  message: UniversalMessage;
  isLoading?: boolean;
  onEdit?: (newContent: string) => void;
  className?: string;
}

export function HumanMessage({ 
  message, 
  isLoading = false, 
  onEdit: _onEdit,
  className 
}: HumanMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const contentString = getTextFromContent(message.content);

  // Dummy handler - edit is disabled for now
  const handleSubmitEdit = () => {
    setIsEditing(false);
    // _onEdit?.(editValue);
  };

  return (
    <div
      className={cn(
        'group ml-auto flex items-center gap-2',
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          {/* Render images and files if present */}
          {Array.isArray(message.content) && message.content.length > 0 && (
            <div className="flex flex-wrap items-end justify-end gap-2">
              {(message.content as ContentBlock[]).reduce<React.ReactNode[]>((acc, block, idx) => {
                if (isBase64ContentBlock(block)) {
                  acc.push(
                    <MultimodalPreview key={idx} block={block} size="md" />
                  );
                }
                return acc;
              }, [])}
            </div>
          )}
          {/* Render text if present */}
          {contentString ? (
            <p className="bg-muted ml-auto w-fit rounded-3xl px-4 py-2 text-right text-sm whitespace-pre-wrap">
              {contentString}
            </p>
          ) : null}
        </div>

        {/* CommandBar with required props for isHumanMessage */}
        <div className="ml-auto flex items-center gap-2">
          <CommandBar
            isLoading={isLoading}
            content={contentString}
            isHumanMessage={true}
            isEditing={isEditing}
            setIsEditing={(editing) => {
              if (editing) {
                setEditValue(contentString);
              }
              setIsEditing(editing);
            }}
            handleSubmitEdit={handleSubmitEdit}
          />
        </div>
      </div>
    </div>
  );
}
