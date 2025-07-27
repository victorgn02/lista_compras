import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingList, GroceryItem } from '../types';
import IntelligentSyncEngine from '../services/syncEngine';
import DistributedCloudStorage from '../services/cloudStorage';
import RealTimeUpdatesEngine from '../services/realTimeUpdates';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number;
  pendingChanges: number;
  conflictsResolved: number;
  connectionLatency: number;
}

interface AdvancedSyncHook {
  syncStatus: SyncStatus;
  syncList: (list: ShoppingList) => Promise<void>;
  syncItem: (item: GroceryItem, listId: string) => Promise<void>;
  deleteItem: (itemId: string, listId: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  forceSync: () => Promise<void>;
  getStorageMetrics: () => any;
  simulateOffline: () => void;
  simulateOnline: () => void;
}

export function useAdvancedSync(userId: string): AdvancedSyncHook {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: 0,
    pendingChanges: 0,
    conflictsResolved: 0,
    connectionLatency: 0
  });

  const syncEngineRef = useRef<IntelligentSyncEngine | null>(null);
  const cloudStorageRef = useRef<DistributedCloudStorage | null>(null);
  const realTimeEngineRef = useRef<RealTimeUpdatesEngine | null>(null);

  // Initialize services
  useEffect(() => {
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    syncEngineRef.current = new IntelligentSyncEngine(userId);
    cloudStorageRef.current = new DistributedCloudStorage();
    realTimeEngineRef.current = new RealTimeUpdatesEngine(userId, deviceId);

    // Subscribe to real-time updates
    const subscriptionId = realTimeEngineRef.current.subscribe('all', (event) => {
      console.log('📡 Received real-time update:', event);
      updateSyncStatus();
    });

    // Cross-tab synchronization using BroadcastChannel
    const broadcastChannel = new BroadcastChannel('shopping-list-sync');
    const handleBroadcastMessage = (event: MessageEvent) => {
      console.log('📡 Cross-tab sync received:', event.data);
      // Dispatch custom event for the main app to handle
      window.dispatchEvent(new CustomEvent('realtime-update', {
        detail: event.data
      }));
    };
    
    broadcastChannel.addEventListener('message', handleBroadcastMessage);

    // Update sync status periodically
    const statusInterval = setInterval(updateSyncStatus, 5000);

    return () => {
      clearInterval(statusInterval);
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      broadcastChannel.close();
      if (realTimeEngineRef.current) {
        realTimeEngineRef.current.unsubscribe(subscriptionId);
        realTimeEngineRef.current.disconnect();
      }
      if (syncEngineRef.current) {
        syncEngineRef.current.disconnect();
      }
    };
  }, [userId]);

  const updateSyncStatus = useCallback(() => {
    if (!syncEngineRef.current || !realTimeEngineRef.current) return;

    const engineStatus = syncEngineRef.current.getConnectionStatus();
    const realtimeStatus = realTimeEngineRef.current.getConnectionStatus();
    const latencyStats = realTimeEngineRef.current.getLatencyStats();

    setSyncStatus(prev => ({
      ...prev,
      isOnline: engineStatus.isOnline && realtimeStatus.connected,
      lastSync: engineStatus.lastSync,
      pendingChanges: engineStatus.pendingEvents,
      connectionLatency: latencyStats.current
    }));
  }, []);

  const syncList = useCallback(async (list: ShoppingList): Promise<void> => {
    if (!syncEngineRef.current || !cloudStorageRef.current || !realTimeEngineRef.current) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      // Store in distributed cloud storage
      await cloudStorageRef.current.store(`list_${list.id}`, list);

      // Sync through intelligent engine
      await syncEngineRef.current.syncEvent({
        type: 'list_updated',
        data: list
      });

      // Broadcast real-time update
      realTimeEngineRef.current.broadcastUpdate('update', 'list', list);

      console.log('✅ List synced successfully:', list.name);
    } catch (error) {
      console.error('❌ List sync failed:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      updateSyncStatus();
    }
  }, [updateSyncStatus]);

  const syncItem = useCallback(async (item: GroceryItem, listId: string): Promise<void> => {
    if (!syncEngineRef.current || !cloudStorageRef.current || !realTimeEngineRef.current) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      // Store item in cloud storage
      await cloudStorageRef.current.store(`item_${item.id}`, item);

      // Sync through intelligent engine
      await syncEngineRef.current.syncEvent({
        type: item.createdAt === new Date().toISOString() ? 'item_added' : 'item_updated',
        data: { item, listId }
      });

      // Broadcast real-time update
      realTimeEngineRef.current.broadcastUpdate(
        item.createdAt === new Date().toISOString() ? 'create' : 'update', 
        'item', 
        { item, listId }
      );

      console.log('✅ Item synced successfully:', item.name);
    } catch (error) {
      console.error('❌ Item sync failed:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      updateSyncStatus();
    }
  }, [updateSyncStatus]);

  const deleteItem = useCallback(async (itemId: string, listId: string): Promise<void> => {
    if (!syncEngineRef.current || !cloudStorageRef.current || !realTimeEngineRef.current) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      // Delete from cloud storage
      await cloudStorageRef.current.delete(`item_${itemId}`);

      // Sync deletion
      await syncEngineRef.current.syncEvent({
        type: 'item_deleted',
        data: { itemId, listId }
      });

      // Broadcast real-time update
      realTimeEngineRef.current.broadcastUpdate('delete', 'item', { itemId, listId });

      console.log('✅ Item deleted and synced:', itemId);
    } catch (error) {
      console.error('❌ Item deletion sync failed:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      updateSyncStatus();
    }
  }, [updateSyncStatus]);

  const deleteList = useCallback(async (listId: string): Promise<void> => {
    if (!syncEngineRef.current || !cloudStorageRef.current || !realTimeEngineRef.current) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      // Delete from cloud storage
      await cloudStorageRef.current.delete(`list_${listId}`);

      // Sync deletion
      await syncEngineRef.current.syncEvent({
        type: 'list_deleted',
        data: { listId }
      });

      // Broadcast real-time update
      realTimeEngineRef.current.broadcastUpdate('delete', 'list', { listId });

      console.log('✅ List deleted and synced:', listId);
    } catch (error) {
      console.error('❌ List deletion sync failed:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      updateSyncStatus();
    }
  }, [updateSyncStatus]);

  const forceSync = useCallback(async (): Promise<void> => {
    if (!syncEngineRef.current || !cloudStorageRef.current || !realTimeEngineRef.current) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      console.log('🔄 Force syncing all data...');
      
      // Force reconnect real-time engine
      realTimeEngineRef.current.forceReconnect();
      
      // Trigger cloud backup
      await cloudStorageRef.current.backup();
      
      console.log('✅ Force sync completed');
    } catch (error) {
      console.error('❌ Force sync failed:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      updateSyncStatus();
    }
  }, [updateSyncStatus]);

  const getStorageMetrics = useCallback(() => {
    if (!cloudStorageRef.current) return null;
    
    return {
      storage: cloudStorageRef.current.getMetrics(),
      cache: cloudStorageRef.current.getCacheStats(),
      realtime: realTimeEngineRef.current?.getConnectionStatus(),
      latency: realTimeEngineRef.current?.getLatencyStats()
    };
  }, []);

  const simulateOffline = useCallback(() => {
    console.log('📴 Simulating offline mode...');
    if (realTimeEngineRef.current) {
      realTimeEngineRef.current.simulateDisconnection();
    }
    setSyncStatus(prev => ({ ...prev, isOnline: false }));
  }, []);

  const simulateOnline = useCallback(() => {
    console.log('🌐 Simulating online mode...');
    if (realTimeEngineRef.current) {
      realTimeEngineRef.current.forceReconnect();
    }
    setSyncStatus(prev => ({ ...prev, isOnline: true }));
  }, []);

  return {
    syncStatus,
    syncList,
    syncItem,
    deleteItem,
    deleteList,
    forceSync,
    getStorageMetrics,
    simulateOffline,
    simulateOnline
  };
}