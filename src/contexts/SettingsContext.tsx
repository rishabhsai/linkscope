import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  hasApiKey: boolean;
  clearApiKey: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string>('');

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('linkscope-openai-api-key');
    if (storedApiKey) {
      setApiKeyState(storedApiKey);
    }
  }, []);

  const setApiKey = (key: string) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      localStorage.setItem('linkscope-openai-api-key', trimmedKey);
      setApiKeyState(trimmedKey);
    } else {
      localStorage.removeItem('linkscope-openai-api-key');
      setApiKeyState('');
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('linkscope-openai-api-key');
    setApiKeyState('');
  };

  const hasApiKey = Boolean(apiKey);

  return (
    <SettingsContext.Provider value={{ apiKey, setApiKey, hasApiKey, clearApiKey }}>
      {children}
    </SettingsContext.Provider>
  );
}; 