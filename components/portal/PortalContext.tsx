'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

interface PortalContextType {
  client: any;
  user: any;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/portal/me');
      if (res.data?.success) {
        setClient(res.data.data.client);
        setUser(res.data.data.user);
      }
    } catch (err) {
      console.error('Failed to load portal profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <PortalContext.Provider value={{ client, user, loading, refresh: fetchProfile }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (context === undefined) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
}
