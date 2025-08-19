import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';
import Progress from './progress';
import { useAuth } from '../../hooks/useAuth';

interface LoadingState {
  isLoading: boolean;
  message: string;
  progress?: number;
  isGlobal: boolean;
}

interface LoadingContextType {
  showLoading: (message?: string, isGlobal?: boolean) => void;
  hideLoading: () => void;
  updateProgress: (progress: number) => void;
  loadingState: LoadingState;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: '',
    isGlobal: false,
  });
  const { loading } = useAuth();

  // Auto-hide loading when auth status changes
  useEffect(() => {
    if (!loading && loadingState.isLoading) {
      setLoadingState((prev) => ({ ...prev, isLoading: false, message: '' }));
    }
  }, [loading, loadingState.isLoading]);

  const showLoading = useCallback((message: string = 'Loading...', isGlobal: boolean = false) => {
    setLoadingState({
      isLoading: true,
      message,
      isGlobal,
      progress: undefined,
    });
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingState((prev) => ({
      ...prev,
      isLoading: false,
      message: '',
      progress: undefined,
    }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setLoadingState((prev) => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        showLoading,
        hideLoading,
        updateProgress,
        loadingState,
      }}
    >
      {children}

      {/* Global Loading Overlay */}
      {loadingState.isGlobal && loadingState.isLoading && (
        <Modal visible={true} transparent animationType="fade">
          <View style={tw`flex-1 justify-center items-center bg-black/80`}>
            <View
              style={[
                tw`bg-white/10 rounded-2xl p-8 max-w-sm mx-4`,
                { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
              ]}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[tw`text-center mt-4 text-white`, { color: theme.colors.foreground }]}>
                {loadingState.message}
              </Text>
              {loadingState.progress !== undefined && (
                <View style={tw`mt-4`}>
                  <Progress value={loadingState.progress} />
                  <Text style={[tw`text-center text-sm mt-2`, { color: theme.colors.mutedForeground }]}>
                    {Math.round(loadingState.progress)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

export function useAutoLoading<T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  loadingMessage: string = 'Loading...',
  isGlobal: boolean = false
) {
  const { showLoading, hideLoading } = useLoading();

  const executeWithLoading = useCallback(
    async (...args: T): Promise<R> => {
      try {
        showLoading(loadingMessage, isGlobal);
        const result = await asyncFunction(...args);
        return result;
      } finally {
        hideLoading();
      }
    },
    [asyncFunction, showLoading, hideLoading, loadingMessage, isGlobal]
  );

  return executeWithLoading;
} 