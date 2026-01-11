"use client";

import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";
import { PendingMessageProvider } from "@/features/chat-v2/providers";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <PendingMessageProvider>
      <MultiSidebarLayout showRightSidebar={true} showHeader={false}>
        {children}
      </MultiSidebarLayout>
    </PendingMessageProvider>
  );
}
