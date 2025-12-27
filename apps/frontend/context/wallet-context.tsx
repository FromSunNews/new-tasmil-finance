"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useWalletStore } from "@/store/use-wallet";
import { useAuthStore, type AuthUser } from "@/store/use-auth";
import { toast } from "sonner";
import { authControllerGetWalletNonce, authControllerWalletLogin } from "@/gen/client";
import apiClient from "@/lib/api-client";

interface WalletContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  address: string | null;
  displayAddress: string | null;
  user: ReturnType<typeof useAuthStore>["user"];
  connect: () => void;
  disconnect: () => void;
  forceReauth: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { address, isConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
  const { setWalletState, reset: resetWallet, setSigning, signing } = useWalletStore();
  const {
    isAuthenticated,
    user,
    setAuthState,
    logout: authLogout,
    setLoading,
    isLoading: isAuthenticating,
  } = useAuthStore();

  // Track if we've already attempted auth for this address
  const authAttemptedRef = useRef<string | null>(null);
  // Track if authentication is currently in progress
  const authInProgressRef = useRef(false);

  // Check if token is valid by making a test request
  const isTokenValid = useCallback(async () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return false;
    
    try {
      // Use the existing /api/auth/session endpoint to check token validity
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9337"}/api/auth/session`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Perform authentication with wallet
  const authenticateWithWallet = useCallback(
    async (walletAddress: string, forceReauth = false) => {
      // Prevent if authentication is already in progress
      if (authInProgressRef.current) {
        return;
      }

      // Check if we need to re-authenticate
      if (!forceReauth && authAttemptedRef.current === walletAddress) {
        // If we've attempted auth for this address, check if token is still valid
        const tokenValid = await isTokenValid();
        if (tokenValid && isAuthenticated && user?.walletAddress?.toLowerCase() === walletAddress.toLowerCase()) {
          return;
        }
        // Token is invalid or user not authenticated, proceed with re-auth
      }

      // Skip if already authenticated with this address and token is valid
      if (!forceReauth && isAuthenticated && user?.walletAddress?.toLowerCase() === walletAddress.toLowerCase()) {
        const tokenValid = await isTokenValid();
        if (tokenValid) {
          authAttemptedRef.current = walletAddress;
          return;
        }
        // Token is invalid, proceed with re-auth
      }

      authAttemptedRef.current = walletAddress;
      authInProgressRef.current = true;
      setLoading(true);

      try {
        // Step 1: Get nonce from backend
        setSigning(false);
        console.log('Making nonce request to:', apiClient.defaults.baseURL);
        const nonceResponse = await authControllerGetWalletNonce(
          { walletAddress },
          { client: apiClient }
        );
        const { nonce, message } = nonceResponse as { nonce: string; message?: string };

        // Step 2: Sign the message
        setSigning(true);
        const signature = await signMessageAsync({ 
          message: message || `Tasmil Login Nonce: ${nonce}` 
        });

        // Step 3: Send signature to backend for verification
        const loginResponse = await authControllerWalletLogin(
          { walletAddress, signature },
          { client: apiClient }
        ) as { access_token: string; user: AuthUser };

        // Step 4: Update auth state
        setAuthState({
          accessToken: loginResponse.access_token,
          user: loginResponse.user,
        });

        toast.success("Wallet verified successfully!");
        authInProgressRef.current = false;
        setLoading(false);
        setSigning(false);
      } catch (error: unknown) {
        console.error("Authentication failed:", error);
        authAttemptedRef.current = null;
        authInProgressRef.current = false;
        setLoading(false);
        setSigning(false);

        // Handle user rejection (silent)
        if (
          error instanceof Error &&
          (error.message.includes("User rejected") ||
            error.message.includes("user rejected") ||
            error.message.includes("User denied"))
        ) {
          return;
        }

        // Show error for unexpected failures
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Authentication failed. Please try again.";
        toast.error(errorMessage);
      }
    },
    [signMessageAsync, setAuthState, setLoading, setSigning, isAuthenticated, user, isTokenValid]
  );

  // Handle wallet connection changes
  useEffect(() => {
    const currentState = useWalletStore.getState();
    if (
      currentState.connected !== isConnected ||
      currentState.account !== (address ?? null)
    ) {
      setWalletState({
        connected: isConnected,
        account: address ?? null,
      });
    }

    // If wallet is connected, authenticate
    if (isConnected && address) {
      // Always attempt authentication when wallet connects
      // The authenticateWithWallet function will handle token validation
      authenticateWithWallet(address);
    } else if (!isConnected) {
      // Wallet disconnected - clear auth attempt tracking
      authAttemptedRef.current = null;
      authInProgressRef.current = false;
    }
  }, [isConnected, address, isAuthenticated, user, authenticateWithWallet, setWalletState]);

  // Listen for token expiration events from API client
  useEffect(() => {
    const handleTokenExpired = () => {
      if (isConnected && address) {
        // Force re-authentication when token expires
        authAttemptedRef.current = null;
        authInProgressRef.current = false;
        authenticateWithWallet(address, true);
      }
    };

    window.addEventListener('auth-token-expired', handleTokenExpired);
    return () => window.removeEventListener('auth-token-expired', handleTokenExpired);
  }, [isConnected, address, authenticateWithWallet]);

  const connect = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    authLogout();
    resetWallet();
    authAttemptedRef.current = null;
    authInProgressRef.current = false;
  }, [wagmiDisconnect, authLogout, resetWallet]);

  const forceReauth = useCallback(async () => {
    if (address) {
      authAttemptedRef.current = null;
      authInProgressRef.current = false;
      await authenticateWithWallet(address, true);
    }
  }, [address, authenticateWithWallet]);

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const value: WalletContextType = {
    isConnected,
    isAuthenticated,
    isAuthenticating: isAuthenticating || signing,
    address: address ?? null,
    displayAddress,
    user,
    connect,
    disconnect,
    forceReauth,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

