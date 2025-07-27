import { ShoppingList, GroceryItem } from '../types';

export interface RealtimeEvent {
  id: string;
  type: 'update' | 'delete' | 'create';
  entity: 'list' | 'item';
  data: any;
  timestamp: number;
  userId: string;
  deviceId: string;
}

export interface ConnectionStatus {
  connected: boolean;
  latency: number;
  reconnectAttempts: number;
  lastHeartbeat: number;
}

class RealTimeUpdatesEngine {
  private websocket: WebSocket | null = null;
  private eventQueue: RealtimeEvent[] = [];
  private subscribers: Map<string, (event: RealtimeEvent) => void> = new Map();
  private connectionStatus: ConnectionStatus = {
    connected: false,
    latency: 0,
    reconnectAttempts: 0,
    lastHeartbeat: 0
  };
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private throttleMap: Map<string, number> = new Map();
  private batchedUpdates: Map<string, RealtimeEvent[]> = new Map();
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;

  constructor(private userId: string, private deviceId: string) {
    this.initializeConnection();
    this.startBatchProcessor();
  }

  private initializeConnection(): void {
    console.log('🔌 Initializing WebSocket connection for real-time updates...');
    
    // In a real implementation, this would connect to your WebSocket server
    // For demo purposes, we'll simulate the WebSocket connection
    this.simulateWebSocketConnection();
  }

  private simulateWebSocketConnection(): void {
    // Simulate connection establishment
    setTimeout(() => {
      this.connectionStatus.connected = true;
      this.connectionStatus.reconnectAttempts = 0;
      this.connectionStatus.lastHeartbeat = Date.now();
      
      console.log('✅ WebSocket connection established');
      this.startHeartbeat();
      this.processQueuedEvents();
      
      // Notify subscribers about connection
      this.notifySubscribers({
        id: crypto.randomUUID(),
        type: 'update',
        entity: 'list',
        data: { connectionStatus: 'connected' },
        timestamp: Date.now(),
        userId: this.userId,
        deviceId: this.deviceId
      });
    }, 1000);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionStatus.connected) {
        const startTime = Date.now();
        
        // Simulate heartbeat
        setTimeout(() => {
          this.connectionStatus.latency = Date.now() - startTime;
          this.connectionStatus.lastHeartbeat = Date.now();
          
          if (this.connectionStatus.latency > 5000) {
            console.warn('⚠️ High latency detected:', this.connectionStatus.latency + 'ms');
          }
        }, Math.random() * 100 + 50); // Simulate 50-150ms latency
      }
    }, 30000); // Heartbeat every 30 seconds
  }

  private startBatchProcessor(): void {
    // Process batched updates every 100ms for optimal performance
    setInterval(() => {
      this.processBatchedUpdates();
    }, 100);
  }

  private processBatchedUpdates(): void {
    for (const [key, events] of this.batchedUpdates.entries()) {
      if (events.length > 0) {
        // Smart throttling: batch similar events
        const latestEvent = events[events.length - 1];
        this.sendEvent(latestEvent);
        
        // Clear processed events
        this.batchedUpdates.set(key, []);
      }
    }
  }

  public subscribe(eventType: string, callback: (event: RealtimeEvent) => void): string {
    const subscriptionId = crypto.randomUUID();
    this.subscribers.set(subscriptionId, callback);
    
    console.log(`📡 Subscribed to real-time updates: ${eventType}`);
    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
    console.log(`📡 Unsubscribed from real-time updates: ${subscriptionId}`);
  }

  private notifySubscribers(event: RealtimeEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('❌ Error in subscriber callback:', error);
      }
    });
  }

  public broadcastUpdate(type: RealtimeEvent['type'], entity: RealtimeEvent['entity'], data: any): void {
    const event: RealtimeEvent = {
      id: crypto.randomUUID(),
      type,
      entity,
      data,
      timestamp: Date.now(),
      userId: this.userId,
      deviceId: this.deviceId
    };

    // Smart throttling based on event type and frequency
    const throttleKey = `${entity}_${data.id || 'global'}`;
    const lastUpdate = this.throttleMap.get(throttleKey) || 0;
    const throttleDelay = this.getThrottleDelay(type, entity);

    if (Date.now() - lastUpdate < throttleDelay) {
      // Add to batch for later processing
      if (!this.batchedUpdates.has(throttleKey)) {
        this.batchedUpdates.set(throttleKey, []);
      }
      this.batchedUpdates.get(throttleKey)!.push(event);
      return;
    }

    this.throttleMap.set(throttleKey, Date.now());
    this.sendEvent(event);
  }

  private getThrottleDelay(type: RealtimeEvent['type'], entity: RealtimeEvent['entity']): number {
    // AI-optimized throttling based on event importance
    const delays = {
      create: { list: 0, item: 100 },
      delete: { list: 0, item: 50 },
      update: { list: 200, item: 300 }
    };

    return delays[type]?.[entity] || 500;
  }

  private sendEvent(event: RealtimeEvent): void {
    if (!this.connectionStatus.connected) {
      this.eventQueue.push(event);
      console.log('📦 Event queued (offline):', event.type);
      return;
    }

    try {
      // Simulate WebSocket send
      console.log(`📡 Broadcasting real-time update: ${event.type} ${event.entity}`, event.data);
      
      // Simulate network delay
      setTimeout(() => {
        this.notifySubscribers(event);
        
        // Broadcast to other browser tabs/windows
        window.dispatchEvent(new CustomEvent('realtime-update', {
          detail: event
        }));
        
        // Use BroadcastChannel for cross-tab communication
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('shopping-list-sync');
          channel.postMessage(event);
        }
      }, Math.random() * 50 + 10);
      
    } catch (error) {
      console.error('❌ Failed to send real-time update:', error);
      this.eventQueue.push(event);
    }
  }

  private processQueuedEvents(): void {
    if (this.eventQueue.length === 0) return;

    console.log(`🔄 Processing ${this.eventQueue.length} queued real-time events...`);
    
    const events = [...this.eventQueue];
    this.eventQueue = [];

    events.forEach(event => {
      this.sendEvent(event);
    });
  }

  private reconnect(): void {
    if (this.connectionStatus.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.connectionStatus.reconnectAttempts++;
    const delay = this.baseReconnectDelay * Math.pow(2, this.connectionStatus.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect... (${this.connectionStatus.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.simulateWebSocketConnection();
    }, delay);
  }

  public simulateDisconnection(): void {
    console.log('📴 Simulating connection loss...');
    this.connectionStatus.connected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      this.reconnect();
    }, 2000);
  }

  public getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  public getQueuedEventsCount(): number {
    return this.eventQueue.length;
  }

  public getBatchedEventsCount(): number {
    let total = 0;
    for (const events of this.batchedUpdates.values()) {
      total += events.length;
    }
    return total;
  }

  public disconnect(): void {
    console.log('🔌 Disconnecting real-time updates...');
    
    this.connectionStatus.connected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.websocket) {
      this.websocket.close();
    }
    
    this.subscribers.clear();
  }

  // Advanced features for connection resilience
  public forceReconnect(): void {
    console.log('🔄 Force reconnecting...');
    this.connectionStatus.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => {
      this.initializeConnection();
    }, 1000);
  }

  public getLatencyStats(): { current: number; average: number; status: string } {
    const current = this.connectionStatus.latency;
    let status = 'excellent';
    
    if (current > 1000) status = 'poor';
    else if (current > 500) status = 'fair';
    else if (current > 200) status = 'good';
    
    return {
      current,
      average: current, // In real implementation, calculate rolling average
      status
    };
  }
}

export default RealTimeUpdatesEngine;