import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage {
  type: string;
  userId?: string;
  noteId?: string;
  content?: string;
  title?: string;
  position?: number;
  operation?: "insert" | "delete" | "replace";
  length?: number;
  timestamp: number;
  // Add error-related fields
  message?: string;
  connectionId?: string;
  requestId?: string;
}

export interface UseWebSocketOptions {
  url: string;
  userId?: string;
  noteId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event | string | Error) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (message: any) => void;
  sendContentUpdate: (content: string, title?: string) => void;
  sendCursorUpdate: (position: number) => void;
  connect: () => void;
  disconnect: () => void;
  connectionId: string | null;
  activeUsers: Set<string>;
}

export function useWebSocket({
  url,
  userId,
  noteId,
  onMessage,
  onUserJoined,
  onUserLeft,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null); // Store latest values in refs to avoid stale closures
  const userIdRef = useRef(userId);
  const noteIdRef = useRef(noteId);
  const callbacksRef = useRef({
    onMessage,
    onUserJoined,
    onUserLeft,
    onConnect,
    onDisconnect,
    onError,
  });

  // Update refs when values change
  useEffect(() => {
    userIdRef.current = userId;
    noteIdRef.current = noteId;
    callbacksRef.current = {
      onMessage,
      onUserJoined,
      onUserLeft,
      onConnect,
      onDisconnect,
      onError,
    };
  });

  const connect = useCallback(() => {
    console.log("useWebSocket.connect called", {
      url,
      userId: userIdRef.current,
      noteId: noteIdRef.current,
    });
    // Prevent multiple connection attempts
    if (
      isConnecting ||
      isConnected ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      console.log(
        "Connection attempt blocked - already connecting or connected"
      );
      return;
    }

    console.log("Initiating WebSocket connection...");
    setIsConnecting(true);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;

        // Send initial connection data using current ref values
        if (userIdRef.current && noteIdRef.current) {
          ws.send(
            JSON.stringify({
              action: "connect",
              userId: userIdRef.current,
              noteId: noteIdRef.current,
            })
          );
        }

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: "ping" }));
          }
        }, 30000); // Ping every 30 seconds

        callbacksRef.current.onConnect?.();
      };
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("Received WebSocket message:", message);

          // Handle Forbidden errors specifically
          if (message.message === "Forbidden") {
            console.error("WebSocket authorization error:", {
              message: message.message,
              connectionId: message.connectionId,
              requestId: message.requestId,
            });

            // Notify the error handler
            callbacksRef.current.onError?.(
              `Forbidden: API Gateway rejected the request (${message.requestId})`
            );

            // Don't attempt to reconnect on forbidden errors
            reconnectAttemptsRef.current = maxReconnectAttempts;
            return;
          }

          switch (message.type) {
            case "user_joined":
              if (message.userId && message.userId !== userIdRef.current) {
                console.log("Processing user_joined:", message.userId);
                setActiveUsers((prev) => new Set([...prev, message.userId!]));
                callbacksRef.current.onUserJoined?.(message.userId);
              }
              break;
            case "user_left":
              if (message.userId) {
                console.log("Processing user_left:", message.userId);
                setActiveUsers((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(message.userId!);
                  return newSet;
                });
                callbacksRef.current.onUserLeft?.(message.userId);
              }
              break;
            case "content_update":
            case "cursor_update":
              // Don't process our own messages
              if (message.userId !== userIdRef.current) {
                console.log(
                  "Processing message from other user:",
                  message.type,
                  message.userId
                );
                callbacksRef.current.onMessage?.(message);
              } else {
                console.log("Ignoring own message:", message.type);
              }
              break;
            case "pong":
              // Handle pong response
              console.log("Received pong");
              break;
            default:
              // Ignore messages that do not have a valid collaboration type
              console.log("Ignoring non-collaboration message:", message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionId(null);

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        callbacksRef.current.onDisconnect?.();

        // Only attempt to reconnect if it wasn't a manual disconnect and we haven't exceeded max attempts
        if (
          event.code !== 1000 && // Not a manual close
          event.code !== 1001 && // Not going away
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          console.log(
            `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error("Max reconnection attempts reached. Giving up.");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnecting(false);
        callbacksRef.current.onError?.(error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setIsConnecting(false);
    }
  }, [url]); // Only depend on URL to prevent infinite loops

  const disconnect = useCallback(() => {
    console.log("useWebSocket.disconnect called");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionId(null);
    setActiveUsers(new Set());
  }, []);

  const sendMessage = useCallback((message: any) => {
    console.log("useWebSocket.sendMessage with message:", message);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
    }
  }, []);
  const sendContentUpdate = useCallback(
    (content: string, title?: string) => {
      console.log("useWebSocket.sendContentUpdate with:", { content, title });
      sendMessage({
        action: "content_update",
        noteId: noteIdRef.current,
        userId: userIdRef.current,
        data: {
          content,
          title,
          operation: "replace",
        },
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  const sendCursorUpdate = useCallback(
    (position: number) => {
      console.log("useWebSocket.sendCursorUpdate with position:", position);
      sendMessage({
        action: "cursor_update",
        noteId: noteIdRef.current,
        userId: userIdRef.current,
        data: {
          position,
        },
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );
  // Auto-connect when hook is initialized or when userId/noteId changes
  useEffect(() => {
    console.log("useWebSocket.auto-connect effect triggered", {
      userId,
      noteId,
      isConnected,
      isConnecting,
    });
    if (userId && noteId && !isConnected && !isConnecting) {
      console.log(
        "Auto-connecting WebSocket for user:",
        userId,
        "note:",
        noteId
      );
      connect();
    }

    return () => {
      // Cleanup on unmount or when userId/noteId changes
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        console.log("Cleaning up WebSocket connection");
        disconnect();
      }
    };
  }, [userId, noteId]); // Only depend on userId and noteId

  // Separate cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clean up all timers and connection on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    sendContentUpdate,
    sendCursorUpdate,
    connect,
    disconnect,
    connectionId,
    activeUsers,
  };
}
