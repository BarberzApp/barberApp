import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth-zustand';
import { toast } from 'sonner';

interface CalendarConnection {
  id: string;
  provider: string;
  sync_enabled: boolean;
  sync_direction: 'inbound' | 'outbound' | 'bidirectional';
  last_sync_at?: string;
  created_at?: string;
}

interface SyncStatus {
  connection: CalendarConnection | null;
  connected: boolean;
  loading: boolean;
  syncing: boolean;
  stats: {
    syncedEventsCount: number;
  };
  recentLogs: any[];
}

interface SyncResults {
  syncedToGoogle: number;
  syncedFromGoogle: number;
  errors: string[];
}

export const useCalendarSync = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>({
    connection: null,
    connected: false,
    loading: true,
    syncing: false,
    stats: {
      syncedEventsCount: 0
    },
    recentLogs: []
  });

  // Fetch connection status
  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(prev => ({ ...prev, loading: false, connected: false }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true }));

      const response = await fetch('/api/calendar/sync');
      
      if (!response.ok) {
        if (response.status === 404) {
          // No connection found
          setStatus(prev => ({
            ...prev,
            loading: false,
            connected: false,
            connection: null
          }));
          return;
        }
        throw new Error('Failed to fetch calendar status');
      }

      const data = await response.json();
      
      setStatus(prev => ({
        ...prev,
        loading: false,
        connected: true,
        connection: data.connection,
        stats: data.stats,
        recentLogs: data.recentLogs
      }));

    } catch (error) {
      console.error('Error fetching calendar status:', error);
      setStatus(prev => ({ ...prev, loading: false }));
      toast.error('Failed to load calendar status');
    }
  }, [user]);

  // Connect to Google Calendar
  const connect = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to connect your calendar');
      return;
    }

    try {
      // Get auth URL
      const response = await fetch('/api/auth/google-calendar');
      
      if (!response.ok) {
        throw new Error('Failed to get authentication URL');
      }

      const { url } = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = url;

    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Failed to connect to Google Calendar');
    }
  }, [user]);

  // Disconnect from Google Calendar
  const disconnect = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to disconnect your calendar');
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true }));

      const response = await fetch('/api/calendar/connection', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect calendar');
      }

      setStatus(prev => ({
        ...prev,
        loading: false,
        connected: false,
        connection: null,
        stats: { syncedEventsCount: 0 },
        recentLogs: []
      }));

      toast.success('Calendar disconnected successfully');

    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      setStatus(prev => ({ ...prev, loading: false }));
      toast.error('Failed to disconnect calendar');
    }
  }, [user]);

  // Sync calendar
  const sync = useCallback(async (direction: 'inbound' | 'outbound' | 'bidirectional' = 'bidirectional', force: boolean = false): Promise<SyncResults | null> => {
    if (!user || !status.connected) {
      toast.error('Please connect your calendar first');
      return null;
    }

    try {
      setStatus(prev => ({ ...prev, syncing: true }));

      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direction, force })
      });

      if (!response.ok) {
        throw new Error('Failed to sync calendar');
      }

      const data = await response.json();
      
      // Refresh status after sync
      await fetchStatus();

      const results = data.results as SyncResults;
      
      if (results.errors.length > 0) {
        toast.warning(`Sync completed with ${results.errors.length} errors`);
      } else {
        toast.success(`Sync completed successfully! Synced ${results.syncedToGoogle} to Google, ${results.syncedFromGoogle} from Google`);
      }

      return results;

    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar');
      return null;
    } finally {
      setStatus(prev => ({ ...prev, syncing: false }));
    }
  }, [user, status.connected, fetchStatus]);

  // Update connection settings
  const updateSettings = useCallback(async (settings: { sync_enabled?: boolean; sync_direction?: 'inbound' | 'outbound' | 'bidirectional' }) => {
    if (!user || !status.connected) {
      toast.error('Please connect your calendar first');
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true }));

      const response = await fetch('/api/calendar/connection', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update calendar settings');
      }

      const data = await response.json();
      
      setStatus(prev => ({
        ...prev,
        loading: false,
        connection: data.connection
      }));

      toast.success('Calendar settings updated successfully');

    } catch (error) {
      console.error('Error updating calendar settings:', error);
      setStatus(prev => ({ ...prev, loading: false }));
      toast.error('Failed to update calendar settings');
    }
  }, [user, status.connected]);

  // Check for OAuth callback success/error
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'calendar_connected') {
      toast.success('Google Calendar connected successfully!');
      fetchStatus();
      
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl.toString());
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        'oauth_failed': 'Failed to authenticate with Google Calendar',
        'no_code': 'Authentication was cancelled',
        'no_token': 'Failed to get access token',
        'save_failed': 'Failed to save calendar connection',
        'callback_failed': 'Authentication callback failed'
      };

      const message = urlParams.get('message') || errorMessages[error] || 'Authentication failed';
      toast.error(message);
      
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [fetchStatus]);

  // Fetch status on mount and when user changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    ...status,
    connect,
    disconnect,
    sync,
    updateSettings,
    refresh: fetchStatus
  };
}; 