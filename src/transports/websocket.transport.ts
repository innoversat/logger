import { BaseTransport, LogEntry, TransportOptions } from './base.transport';
import { LogLevel } from '../log-level';

/**
 * WebSocket transport specific options
 */
export interface WebSocketTransportOptions extends TransportOptions {
  /**
   * WebSocket server URL
   */
  url: string;
  
  /**
   * Protocols to send when establishing connection
   */
  protocols?: string | string[];
  
  /**
   * Whether to attempt reconnection
   */
  reconnect?: boolean;
  
  /**
   * Maximum reconnection attempts
   */
  maxReconnectAttempts?: number;
  
  /**
   * Wait time between reconnection attempts (ms)
   */
  reconnectInterval?: number;
  
  /**
   * Message sending timeout (ms)
   */
  sendTimeout?: number;
  
  /**
   * Keep messages in buffer until connected
   */
  bufferWhenDisconnected?: boolean;
  
  /**
   * Maximum number of messages to keep in buffer
   */
  maxBufferSize?: number;
}

/**
 * Transport that sends logs via WebSocket
 */
export class WebSocketTransport extends BaseTransport {
  protected options: WebSocketTransportOptions;
  private socket: WebSocket | null = null;
  private buffer: LogEntry[] = [];
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  
  constructor(options: WebSocketTransportOptions) {
    super(options);
    
    if (!options.url) {
      throw new Error('URL must be specified for WebSocketTransport');
    }
    
    this.options = {
      reconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 5000,
      sendTimeout: 10000,
      bufferWhenDisconnected: true,
      maxBufferSize: 100,
      ...options
    };
    
    this.connect();
  }
  
  /**
   * Processes log message and sends it via WebSocket
   */
  log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }
    
    // Buffer the message if socket is not connected and buffering is enabled
    if (this.socket?.readyState !== WebSocket.OPEN) {
      if (this.options.bufferWhenDisconnected) {
        this.bufferMessage(entry);
      }
      return;
    }
    
    this.sendLogEntry(entry);
  }
  
  /**
   * Establishes WebSocket connection
   */
  private connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }
    
    if (this.isConnecting) {
      return;
    }
    
    this.isConnecting = true;
    
    try {
      this.socket = new WebSocket(this.options.url, this.options.protocols);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Could not create WebSocket connection:', error);
      this.handleClose({ wasClean: false, code: 0, reason: 'Connection error', type: 'error' });
    } finally {
      this.isConnecting = false;
    }
  }
  
  /**
   * Handles WebSocket open event
   */
  private handleOpen(): void {
    console.log(`WebSocket connection established: ${this.options.url}`);
    this.reconnectAttempts = 0;
    
    // Send buffered messages
    this.sendBufferedMessages();
  }
  
  /**
   * Handles WebSocket close event
   */
  private handleClose(event: any): void {
    console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
    
    // Reconnection attempt
    if (this.options.reconnect && (!this.options.maxReconnectAttempts || this.reconnectAttempts < (this.options.maxReconnectAttempts || 0))) {
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handles WebSocket error event
   */
  private handleError(error: Event): void {
    console.error('WebSocket error occurred:', error);
  }
  
  /**
   * Schedules reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`WebSocket reconnection attempt (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`);
      this.connect();
    }, this.options.reconnectInterval);
  }
  
  /**
   * Buffers a message
   */
  private bufferMessage(entry: LogEntry): void {
    // Buffer size check
    if (this.options.maxBufferSize && this.buffer.length >= this.options.maxBufferSize) {
      this.buffer.shift(); // Remove oldest message
    }
    
    this.buffer.push(entry);
  }
  
  /**
   * Sends all buffered messages
   */
  private sendBufferedMessages(): void {
    if (!this.buffer.length) return;
    
    console.log(`Sending ${this.buffer.length} buffered messages...`);
    
    for (const entry of this.buffer) {
      this.sendLogEntry(entry);
    }
    
    this.buffer = [];
  }
  
  /**
   * Sends a log entry via WebSocket
   */
  private sendLogEntry(entry: LogEntry): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      if (this.options.bufferWhenDisconnected) {
        this.bufferMessage(entry);
      }
      return;
    }
    
    try {
      this.socket.send(JSON.stringify(entry));
    } catch (error) {
      console.error('Error sending log via WebSocket:', error);
      if (this.options.bufferWhenDisconnected) {
        this.bufferMessage(entry);
      }
    }
  }
  
  /**
   * Closes the WebSocket connection and cleans up resources
   */
  close(): void {
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Close socket
    if (this.socket) {
      // Prevent reconnection attempts
      this.options.reconnect = false;
      
      // Close connection if open
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      
      this.socket = null;
    }
  }
}