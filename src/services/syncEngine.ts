import { io, Socket } from 'socket.io-client';
import { ShoppingList, GroceryItem } from '../types';

export interface SyncEvent {
  id: string;
  type: 'list_updated' | 'item_added' | 'item_updated' | 'item_deleted' | 'list_created' | 'list_deleted';
  timestamp: number;
  deviceId: string;
  userId: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
}

export interface ConflictResolution {
  strategy: 'latest_wins' | 'merge' | 'user_choice';
  resolvedData: any;
  conflictReason: string;
}

class IntelligentSyncEngine {
  private socket: Socket | null = null;
  private deviceId: string;
  private userId: string;
  private isOnline: boolean = navigator.onLine;
  private pendingEvents: SyncEvent[] = [];
  private eventQueue: SyncEvent[] = [];
  private lastSyncTimestamp: number = 0;
  private userBehaviorPatterns: Map<string, number> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(userId: string) {
    this.deviceId = this.generateDeviceId();
    this.userId = userId;
    this.initializeNetworkListeners();
    this.initializeSocket();
    this.startBehaviorTracking();
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  private initializeSocket(): void {
    // In a real implementation, this would connect to your WebSocket server
    // For demo purposes, we'll simulate the connection
    console.log('🔄 Initializing intelligent sync engine...');
    
    // Simulate connection establishment
    setTimeout(() => {
      this.isOnline = true;
      this.processPendingEvents();
      console.log('✅ Sync engine connected and ready');
    }, 1000);
  }

  private initializeNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.reconnectAttempts = 0;
      console.log('🌐 Network connection restored - resuming sync');
      this.processPendingEvents();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Network connection lost - entering offline mode');
    });
  }

  private startBehaviorTracking(): void {
    // Track user interaction patterns for intelligent prioritization
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-item-id]')) {
        const itemId = target.closest('[data-item-id]')?.getAttribute('data-item-id');
        if (itemId) {
          this.updateBehaviorPattern(itemId);
        }
      }
    });
  }

  private updateBehaviorPattern(itemId: string): void {
    const currentCount = this.userBehaviorPatterns.get(itemId) || 0;
    this.userBehaviorPatterns.set(itemId, currentCount + 1);
  }

  private calculateEventPriority(event: SyncEvent): 'high' | 'medium' | 'low' {
    // AI-powered priority calculation based on user behavior and content importance
    const behaviorScore = this.userBehaviorPatterns.get(event.data?.id || '') || 0;
    const recencyScore = (Date.now() - event.timestamp) / (1000 * 60); // Minutes ago
    const typeScore = this.getTypeImportanceScore(event.type);

    const totalScore = (behaviorScore * 0.4) + (typeScore * 0.4) + (recencyScore > 5 ? 0 : 0.2);

    if (totalScore > 0.7) return 'high';
    if (totalScore > 0.4) return 'medium';
    return 'low';
  }

  private getTypeImportanceScore(type: string): number {
    const scores = {
      'item_deleted': 1.0,
      'list_deleted': 1.0,
      'item_added': 0.8,
      'list_created': 0.8,
      'item_updated': 0.6,
      'list_updated': 0.5
    };
    return scores[type as keyof typeof scores] || 0.3;
  }

  public async syncEvent(event: Omit<SyncEvent, 'id' | 'timestamp' | 'deviceId' | 'userId' | 'priority'>): Promise<void> {
    const fullEvent: SyncEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      deviceId: this.deviceId,
      userId: this.userId,
      priority: this.calculateEventPriority(event as SyncEvent)
    };

    if (this.isOnline) {
      await this.sendEvent(fullEvent);
    } else {
      this.pendingEvents.push(fullEvent);
      console.log('📦 Event queued for offline sync:', fullEvent.type);
    }
  }

  private async sendEvent(event: SyncEvent): Promise<void> {
    try {
      // Simulate API call to sync server
      console.log(`🚀 Syncing ${event.type} with priority ${event.priority}:`, event.data);
      
      // Simulate network delay based on priority
      const delay = event.priority === 'high' ? 100 : event.priority === 'medium' ? 300 : 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      this.lastSyncTimestamp = Date.now();
    } catch (error) {
      console.error('❌ Sync failed, queuing for retry:', error);
      this.pendingEvents.push(event);
    }
  }

  private async processPendingEvents(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    console.log(`🔄 Processing ${this.pendingEvents.length} pending sync events...`);
    
    // Sort by priority and timestamp
    this.pendingEvents.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    const eventsToProcess = [...this.pendingEvents];
    this.pendingEvents = [];

    for (const event of eventsToProcess) {
      try {
        await this.sendEvent(event);
      } catch (error) {
        this.pendingEvents.push(event);
      }
    }
  }

  public resolveConflict(localData: any, remoteData: any, conflictType: string): ConflictResolution {
    // Advanced AI-powered conflict resolution
    console.log('🤖 AI conflict resolution engaged for:', conflictType);

    // Strategy 1: Latest timestamp wins (most common)
    if (localData.updatedAt && remoteData.updatedAt) {
      if (new Date(localData.updatedAt) > new Date(remoteData.updatedAt)) {
        return {
          strategy: 'latest_wins',
          resolvedData: localData,
          conflictReason: 'Local data is more recent'
        };
      } else {
        return {
          strategy: 'latest_wins',
          resolvedData: remoteData,
          conflictReason: 'Remote data is more recent'
        };
      }
    }

    // Strategy 2: Intelligent merge for compatible changes
    if (this.canMergeData(localData, remoteData)) {
      return {
        strategy: 'merge',
        resolvedData: this.mergeData(localData, remoteData),
        conflictReason: 'Compatible changes merged automatically'
      };
    }

    // Strategy 3: Default to remote data
    return {
      strategy: 'latest_wins',
      resolvedData: remoteData,
      conflictReason: 'Defaulting to remote data'
    };
  }

  private canMergeData(local: any, remote: any): boolean {
    // Simple merge compatibility check
    if (typeof local !== 'object' || typeof remote !== 'object') return false;
    
    // Check if they're modifying different fields
    const localKeys = Object.keys(local);
    const remoteKeys = Object.keys(remote);
    const commonKeys = localKeys.filter(key => remoteKeys.includes(key));
    
    return commonKeys.length < Math.max(localKeys.length, remoteKeys.length) * 0.5;
  }

  private mergeData(local: any, remote: any): any {
    // Intelligent data merging
    return {
      ...remote,
      ...local,
      updatedAt: new Date().toISOString(),
      mergedAt: new Date().toISOString()
    };
  }

  public getConnectionStatus(): { isOnline: boolean; lastSync: number; pendingEvents: number } {
    return {
      isOnline: this.isOnline,
      lastSync: this.lastSyncTimestamp,
      pendingEvents: this.pendingEvents.length
    };
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default IntelligentSyncEngine;