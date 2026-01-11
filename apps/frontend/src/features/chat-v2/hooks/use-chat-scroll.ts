"use client";

// 🪝 Chat scroll behavior hook

import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';

interface UseChatScrollOptions {
  messageCount: number;
  threshold?: number; // Distance from bottom to consider "scrolled up"
}

interface UseChatScrollReturn {
  messagesEndRef: RefObject<HTMLDivElement>;
  containerRef: RefObject<HTMLDivElement>;
  showScrollButton: boolean;
  userScrolledUp: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

/**
 * Hook for managing chat scroll behavior
 * - Auto-scrolls to bottom on new messages (unless user scrolled up)
 * - Shows scroll-to-bottom button when user scrolls up
 */
export function useChatScroll(options: UseChatScrollOptions): UseChatScrollReturn {
  const { messageCount, threshold = 100 } = options;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setUserScrolledUp(false);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messageCount > lastMessageCountRef.current && !userScrolledUp) {
      scrollToBottom();
    }
    lastMessageCountRef.current = messageCount;
  }, [messageCount, userScrolledUp, scrollToBottom]);

  // Track scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // User is considered "scrolled up" if they're more than threshold from bottom
      const isScrolledUp = distanceFromBottom > threshold;
      setUserScrolledUp(isScrolledUp);
      setShowScrollButton(isScrolledUp);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return {
    messagesEndRef: messagesEndRef as RefObject<HTMLDivElement>,
    containerRef: containerRef as RefObject<HTMLDivElement>,
    showScrollButton,
    userScrolledUp,
    scrollToBottom,
  };
}
