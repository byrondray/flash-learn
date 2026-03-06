import React from "react";
import { Users, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import type { CollabUser } from "@/hooks/useCollaboration";

interface CollaborationIndicatorProps {
  isConnected: boolean;
  isSynced: boolean;
  activeUsers: CollabUser[];
  currentUserId?: string;
}

export function CollaborationIndicator(props: CollaborationIndicatorProps) {
  const otherUsers = props.activeUsers.filter(
    (u) => u.userId !== props.currentUserId
  );
  const isConnecting = !props.isConnected && !props.isSynced;

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {isConnecting ? (
                <div className="flex items-center gap-1 text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-xs">Connecting...</span>
                </div>
              ) : props.isConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs">
                    {props.isSynced ? "Synced" : "Connected"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs">Offline</span>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isConnecting
                ? "Connecting to collaboration server..."
                : props.isConnected
                ? "Real-time collaboration active"
                : "Collaboration unavailable"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {otherUsers.length > 0 && (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-1">
            {otherUsers.slice(0, 3).map((u) => (
              <TooltipProvider key={u.userId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="px-2 py-1 text-xs border-2"
                      style={{
                        borderColor: u.color,
                        backgroundColor: `${u.color}20`,
                      }}
                    >
                      {u.name?.slice(0, 2) || u.userId.slice(0, 2)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{u.name || `User ${u.userId}`} is editing</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {otherUsers.length > 3 && (
              <Badge variant="outline" className="px-2 py-1 text-xs">
                +{otherUsers.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
