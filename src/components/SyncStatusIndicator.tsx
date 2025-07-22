import React, { useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Activity, Settings, RefreshCw, Database, Zap } from 'lucide-react';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number;
  pendingChanges: number;
  conflictsResolved: number;
  connectionLatency: number;
}

interface SyncStatusIndicatorProps {
  syncStatus: SyncStatus;
  onForceSync: () => void;
  onToggleOffline: () => void;
  storageMetrics: any;
}

export function SyncStatusIndicator({ 
  syncStatus, 
  onForceSync, 
  onToggleOffline, 
  storageMetrics 
}: SyncStatusIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getConnectionIcon = () => {
    if (syncStatus.isSyncing) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (syncStatus.isOnline) {
      return <Wifi className="w-4 h-4 text-green-500" />;
    }
    return <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (syncStatus.isSyncing) return 'Sincronizando...';
    if (syncStatus.isOnline) return 'Online';
    return 'Offline';
  };

  const getLatencyColor = () => {
    if (syncStatus.connectionLatency < 200) return 'text-green-500';
    if (syncStatus.connectionLatency < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSync) return 'Nunca';
    const diff = Date.now() - syncStatus.lastSync;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m atrás`;
    return `${seconds}s atrás`;
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
          {getConnectionIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          {syncStatus.pendingChanges > 0 && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {syncStatus.pendingChanges}
            </span>
          )}
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t space-y-2 min-w-[280px]">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>Latência:</span>
                  <span className={getLatencyColor()}>{syncStatus.connectionLatency}ms</span>
                </div>
                <div className="flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  <span>Último sync:</span>
                  <span>{formatLastSync()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>Pendentes:</span>
                  <span>{syncStatus.pendingChanges}</span>
                </div>
              </div>
              
              {storageMetrics && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Cache:</span>
                    <span className="text-green-600">{storageMetrics.cache?.hitRate?.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    <span>Itens:</span>
                    <span>{storageMetrics.storage?.itemCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CloudOff className="w-3 h-3" />
                    <span>Conflitos:</span>
                    <span>{syncStatus.conflictsResolved}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onForceSync}
                disabled={syncStatus.isSyncing}
                className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                Forçar Sync
              </button>
              <button
                onClick={onToggleOffline}
                className="flex-1 px-3 py-1.5 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 flex items-center justify-center gap-1"
              >
                {syncStatus.isOnline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                {syncStatus.isOnline ? 'Simular Offline' : 'Simular Online'}
              </button>
            </div>

            {storageMetrics?.latency && (
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-600 mb-1">Status da Conexão:</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    storageMetrics.latency.status === 'excellent' ? 'bg-green-500' :
                    storageMetrics.latency.status === 'good' ? 'bg-blue-500' :
                    storageMetrics.latency.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs capitalize">{storageMetrics.latency.status}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}