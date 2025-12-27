"use client";

import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "./icons";
import { useDefiAgentSidebar } from "@/context/defi-agent-sidebar-context";

interface DefiAgentControlsProps {
  chatId?: string;
  showNewChatButton?: boolean;
}

export function DefiAgentControls({
  chatId,
  showNewChatButton = true,
}: DefiAgentControlsProps) {
  const router = useRouter();
  const sidebarContext = useDefiAgentSidebar();
  const isOpen = sidebarContext?.isOpen ?? false;
  const { width: windowWidth } = useWindowSize();

  return (
    <div className="flex items-center gap-2">
      {/* New Chat Button */}
      {showNewChatButton && (!isOpen || windowWidth < 768) && (
        <Button
          className="h-8 w-8 p-0"
          onClick={() => {
            router.push("/agents");
            router.refresh();
          }}
          type="button"
          variant="outline"
        >
          <PlusIcon />
        </Button>
      )}
    </div>
  );
}
