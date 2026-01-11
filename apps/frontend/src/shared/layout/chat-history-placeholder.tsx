"use client";

import { MessageSquare } from "lucide-react";

export function ChatHistoryPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Chat History</h3>
      <p className="text-sm text-muted-foreground">
        Chat history will be available in a future update.
      </p>
    </div>
  );
}