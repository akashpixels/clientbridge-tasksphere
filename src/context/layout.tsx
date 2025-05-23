
import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { BillingFormData } from '@/components/billing/types';

interface LayoutContextType {
  rightSidebarContent: ReactNode | null;
  setRightSidebarContent: (content: ReactNode) => void;
  closeRightSidebar: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isBillingCreationActive: boolean;
  billingFormData: BillingFormData | null;
  setBillingCreationActive: (active: boolean, formData?: BillingFormData) => void;
  updateBillingFormData: (updates: Partial<BillingFormData>) => void;
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [rightSidebarContent, setRightSidebarContent] = useState<ReactNode | null>(null);
  const [currentTab, setCurrentTab] = useState('tasks');
  const [isBillingCreationActive, setIsBillingCreationActive] = useState(false);
  const [billingFormData, setBillingFormDataState] = useState<BillingFormData | null>(null);

  const closeRightSidebar = useCallback(() => {
    console.log('Closing right sidebar');
    setRightSidebarContent(null);
    setIsBillingCreationActive(false);
    setBillingFormDataState(null);
  }, []);

  const setBillingCreationActive = useCallback((active: boolean, formData?: BillingFormData) => {
    setIsBillingCreationActive(active);
    if (active && formData) {
      setBillingFormDataState(formData);
    } else if (!active) {
      setBillingFormDataState(null);
    }
  }, []);

  const updateBillingFormData = useCallback((updates: Partial<BillingFormData>) => {
    setBillingFormDataState(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  console.log('LayoutProvider rendering');

  return (
    <LayoutContext.Provider 
      value={{ 
        rightSidebarContent,
        setRightSidebarContent,
        closeRightSidebar,
        currentTab,
        setCurrentTab,
        isBillingCreationActive,
        billingFormData,
        setBillingCreationActive,
        updateBillingFormData
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
