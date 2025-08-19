import { useNavigation } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

export const useSafeNavigation = () => {
  const navigation = useNavigation();
  const isNavigatingRef = useRef(false);

  const safePush = useCallback(
    (routeName: string, params?: any) => {
      if (isNavigatingRef.current) {
        console.log('⚠️ Navigation already in progress, skipping:', routeName);
        return;
      }

      isNavigatingRef.current = true;
      console.log('🔄 Navigating to:', routeName);

      try {
        (navigation as any).navigate(routeName, params);

        // Reset navigation state after a delay
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 1000);
      } catch (error) {
        console.error('❌ Navigation error:', error);
        isNavigatingRef.current = false;
      }
    },
    [navigation]
  );

  const safeReplace = useCallback(
    (routeName: string, params?: any) => {
      if (isNavigatingRef.current) {
        console.log('⚠️ Navigation already in progress, skipping:', routeName);
        return;
      }

      isNavigatingRef.current = true;
      console.log('🔄 Replacing with:', routeName);

      try {
        (navigation as any).replace(routeName, params);

        // Reset navigation state after a delay
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 1000);
      } catch (error) {
        console.error('❌ Navigation error:', error);
        isNavigatingRef.current = false;
      }
    },
    [navigation]
  );

  const safeGoBack = useCallback(() => {
    if (isNavigatingRef.current) {
      console.log('⚠️ Navigation already in progress, skipping go back');
      return;
    }

    isNavigatingRef.current = true;
    console.log('🔄 Going back');

    try {
      navigation.goBack();

      // Reset navigation state after a delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      isNavigatingRef.current = false;
    }
  }, [navigation]);

  const safeReset = useCallback(
    (routes: Array<{ name: string; params?: any }>) => {
      if (isNavigatingRef.current) {
        console.log('⚠️ Navigation already in progress, skipping reset');
        return;
      }

      isNavigatingRef.current = true;
      console.log('🔄 Resetting navigation');

      try {
        (navigation as any).reset({
          index: routes.length - 1,
          routes: routes,
        });

        // Reset navigation state after a delay
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 1000);
      } catch (error) {
        console.error('❌ Navigation error:', error);
        isNavigatingRef.current = false;
      }
    },
    [navigation]
  );

  const isNavigating = isNavigatingRef.current;

  return {
    push: safePush,
    replace: safeReplace,
    back: safeGoBack,
    reset: safeReset,
    isNavigating,
  };
}; 