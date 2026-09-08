"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export type SolanaNetwork = "devnet" | "mainnet-beta";

interface NetworkContextType {
  network: SolanaNetwork;
  rpcEndpoint: string;
  clusterName: string;
  isMainnet: boolean;
  setNetwork: (newNetwork: SolanaNetwork) => Promise<boolean>;
  refreshNetwork: () => Promise<void>;
  loading: boolean;
}

const RPC_ENDPOINTS: Record<SolanaNetwork, string> = {
  devnet: "https://api.devnet.solana.com",
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
};

const CLUSTER_NAMES: Record<SolanaNetwork, string> = {
  devnet: "Solana Devnet",
  "mainnet-beta": "Solana Mainnet-Beta",
};

const NetworkContext = createContext<NetworkContextType>({
  network: "devnet",
  rpcEndpoint: RPC_ENDPOINTS.devnet,
  clusterName: CLUSTER_NAMES.devnet,
  isMainnet: false,
  setNetwork: async () => false,
  refreshNetwork: async () => {},
  loading: false,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<SolanaNetwork>("devnet");
  const [loading, setLoading] = useState(true);

  // Fetch current system network from /api/system
  const refreshNetwork = useCallback(async () => {
    try {
      const res = await fetch("/api/system");
      const json = await res.json();
      if (json.success && json.data?.solana_network) {
        const net = json.data.solana_network === "mainnet-beta" ? "mainnet-beta" : "devnet";
        setNetworkState(net);
      }
    } catch (err) {
      console.warn("Lỗi khi tải cấu hình mạng Solana:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNetwork();
  }, [refreshNetwork]);

  // Set and persist network change via API PATCH /api/system
  const setNetwork = async (newNetwork: SolanaNetwork): Promise<boolean> => {
    const previous = network;
    setNetworkState(newNetwork); // Optimistic UI

    try {
      const res = await fetch("/api/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solana_network: newNetwork }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể cập nhật mạng lưới");
      }

      return true;
    } catch (err: any) {
      console.error("Lỗi cập nhật mạng Solana:", err);
      setNetworkState(previous); // Rollback
      toast.error(err.message || "Lỗi khi lưu cấu hình mạng.");
      return false;
    }
  };

  const isMainnet = network === "mainnet-beta";
  const rpcEndpoint = RPC_ENDPOINTS[network];
  const clusterName = CLUSTER_NAMES[network];

  return (
    <NetworkContext.Provider
      value={{
        network,
        rpcEndpoint,
        clusterName,
        isMainnet,
        setNetwork,
        refreshNetwork,
        loading,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useSolanaNetwork() {
  return useContext(NetworkContext);
}
