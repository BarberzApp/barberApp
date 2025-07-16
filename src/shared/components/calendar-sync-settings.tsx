"use client"

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { useCalendarSync } from '@/shared/hooks/useCalendarSync';
import { Calendar, RefreshCw, Settings, Trash2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function CalendarSyncSettings() {
  const {
    connection,
    connected,
    loading,
    syncing,
    stats,
    recentLogs,
    connect,
    disconnect,
    sync,
    updateSettings
  } = useCalendarSync();

  const [localSyncEnabled, setLocalSyncEnabled] = useState(connection?.sync_enabled ?? false);
  const [localSyncDirection, setLocalSyncDirection] = useState(connection?.sync_direction ?? 'bidirectional');

  const handleSyncEnabledChange = async (enabled: boolean) => {
    setLocalSyncEnabled(enabled);
    await updateSettings({ sync_enabled: enabled });
  };

  const handleSyncDirectionChange = async (direction: 'inbound' | 'outbound' | 'bidirectional') => {
    setLocalSyncDirection(direction);
    await updateSettings({ sync_direction: direction });
  };

  const handleSync = async (direction?: 'inbound' | 'outbound' | 'bidirectional') => {
    const syncDirection = direction || localSyncDirection;
    await sync(syncDirection);
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your Google Calendar? This will remove all sync data.')) {
      await disconnect();
    }
  };

  const formatLastSync = (lastSyncAt?: string) => {
    if (!lastSyncAt) return 'Never';
    return new Date(lastSyncAt).toLocaleString();
  };

  const getSyncStatusIcon = () => {
    if (syncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (connected) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  const getSyncStatusText = () => {
    if (syncing) return 'Syncing...';
    if (connected) return 'Connected';
    return 'Not connected';
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white/5 to-white/3 border border-white/10 shadow-2xl backdrop-blur-xl rounded-3xl">
        <CardHeader className="bg-gradient-to-r from-saffron/10 to-transparent border-b border-white/10">
          <CardTitle className="flex items-center gap-3 text-2xl text-white">
            <div className="p-2 bg-saffron/20 rounded-xl">
              <Calendar className="h-6 w-6 text-saffron" />
            </div>
            Google Calendar Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="relative">
                <RefreshCw className="h-8 w-8 animate-spin text-saffron mx-auto" />
                <div className="absolute inset-0 rounded-full bg-saffron/20 animate-ping" />
              </div>
              <p className="text-white/70 font-medium">Loading calendar sync...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/3 border border-white/10 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-saffron/10 to-transparent border-b border-white/10 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-saffron/20 rounded-xl">
              <Calendar className="h-6 w-6 text-saffron" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                Google Calendar Sync
                <Badge variant="glassy-saffron" className="text-xs px-2 py-1 bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                  ALPHA
                </Badge>
              </CardTitle>
              <CardDescription className="text-white/70 text-base">
                Connect your Google Calendar to automatically sync your appointments
              </CardDescription>
            </div>
          </div>
        </div>
        
        {/* Alpha Warning */}
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-yellow-500/20 rounded-full">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-400 mb-1">Alpha Version</p>
              <p className="text-xs text-yellow-300/80">
                This feature may not work properly. Please notify the team if you encounter any issues.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Enhanced Connection Status */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-saffron/20 rounded-xl">
              {getSyncStatusIcon()}
            </div>
            <div>
              <span className="font-semibold text-white text-lg">{getSyncStatusText()}</span>
              {connected && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="glassy-saffron" className="text-xs">
                    {stats.syncedEventsCount} events synced
                  </Badge>
                </div>
              )}
            </div>
          </div>
          {connected && (
            <Button
              onClick={() => handleSync()}
              disabled={syncing}
              className="bg-gradient-to-r from-saffron to-saffron/90 hover:from-saffron/90 hover:to-saffron/80 text-primary font-semibold shadow-lg rounded-xl px-6 py-3"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </div>

        {/* Enhanced Connection Actions */}
        {!connected ? (
          <div className="space-y-6 p-6 bg-gradient-to-br from-saffron/10 to-transparent rounded-2xl border border-saffron/20">
            <div className="text-center space-y-3">
              <div className="p-3 bg-saffron/20 rounded-2xl w-fit mx-auto">
                <ExternalLink className="h-6 w-6 text-saffron" />
              </div>
              <h3 className="text-xl font-bebas text-white tracking-wide">Connect Your Calendar</h3>
              <p className="text-white/70 text-base">
                Connect your Google Calendar to automatically sync your appointments and keep your schedule up to date.
              </p>
            </div>
            <Button 
              onClick={connect} 
              className="w-full bg-gradient-to-r from-saffron to-saffron/90 hover:from-saffron/90 hover:to-saffron/80 text-primary font-semibold shadow-lg rounded-xl py-4 text-lg"
            >
              <ExternalLink className="h-5 w-5 mr-3" />
              Connect Google Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enhanced Sync Settings */}
            <div className="space-y-6 p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-saffron/20 rounded-xl">
                    <Settings className="h-5 w-5 text-saffron" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bebas text-white tracking-wide">Sync Settings</h4>
                    <p className="text-white/70 text-sm">
                      Configure how your calendar syncs
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Enhanced Enable/Disable Sync */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="font-semibold text-white text-lg">Enable Sync</p>
                    <p className="text-white/70 text-sm">
                      Automatically sync appointments
                    </p>
                  </div>
                  <Switch
                    checked={localSyncEnabled}
                    onCheckedChange={handleSyncEnabledChange}
                  />
                </div>

                {/* Enhanced Sync Direction */}
                <div className="space-y-3">
                  <p className="font-semibold text-white text-lg">Sync Direction</p>
                  <Select
                    value={localSyncDirection}
                    onValueChange={(value: 'inbound' | 'outbound' | 'bidirectional') => 
                      handleSyncDirectionChange(value)
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-saffron rounded-xl h-12 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bidirectional">
                        Bidirectional (Recommended)
                      </SelectItem>
                      <SelectItem value="outbound">
                        Outbound Only (App → Google)
                      </SelectItem>
                      <SelectItem value="inbound">
                        Inbound Only (Google → App)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-white/60 bg-white/5 p-3 rounded-lg border border-white/10">
                    {localSyncDirection === 'bidirectional' && 'Sync appointments both ways'}
                    {localSyncDirection === 'outbound' && 'Only sync your appointments to Google Calendar'}
                    {localSyncDirection === 'inbound' && 'Only sync Google Calendar events to your app'}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Enhanced Sync Actions */}
            <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10">
              <h4 className="text-xl font-bebas text-white tracking-wide">Manual Sync</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => handleSync('bidirectional')}
                  disabled={syncing}
                  className="bg-gradient-to-r from-saffron to-saffron/90 hover:from-saffron/90 hover:to-saffron/80 text-primary font-semibold shadow-lg rounded-xl py-3"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Full Sync
                </Button>
                <Button
                  onClick={() => handleSync('outbound')}
                  disabled={syncing}
                  className="bg-gradient-to-r from-saffron to-saffron/90 hover:from-saffron/90 hover:to-saffron/80 text-primary font-semibold shadow-lg rounded-xl py-3"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  To Google
                </Button>
                <Button
                  onClick={() => handleSync('inbound')}
                  disabled={syncing}
                  className="bg-gradient-to-r from-saffron to-saffron/90 hover:from-saffron/90 hover:to-saffron/80 text-primary font-semibold shadow-lg rounded-xl py-3"
                >
                  <ExternalLink className="h-4 w-4 mr-2 rotate-180" />
                  From Google
                </Button>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Enhanced Connection Info */}
            <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10">
              <h4 className="text-xl font-bebas text-white tracking-wide">Connection Info</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-white/70">Provider:</span>
                  <span className="text-white font-medium">Google Calendar</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-white/70">Last Sync:</span>
                  <span className="text-white font-medium">{formatLastSync(connection?.last_sync_at)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-white/70">Connected:</span>
                  <span className="text-white font-medium">{connection?.created_at ? new Date(connection.created_at).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Enhanced Disconnect */}
            <div className="space-y-4 p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl border border-red-500/20">
              <h4 className="text-xl font-bebas text-red-400 tracking-wide">Danger Zone</h4>
              <p className="text-white/70 text-sm">
                Disconnecting will remove all sync data and stop automatic syncing.
              </p>
              <Button
                onClick={handleDisconnect}
                disabled={syncing}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg rounded-xl py-3"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Disconnect Calendar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 