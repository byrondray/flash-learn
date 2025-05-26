import React from "react";
import { Users, Wifi, WifiOff } from "lucide-react";
import { CollaborationUser } from "@/services/collaboration.service";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface CollaborationIndicatorProps {
  isConnected: boolean;
  isConnecting: boolean;
  activeUsers: CollaborationUser[];
  currentUserId?: string;
}

export function CollaborationIndicator({
  isConnected,
  isConnecting,
  activeUsers,
  currentUserId,
}: CollaborationIndicatorProps) {
  const otherUsers = activeUsers.filter((user) => user.id !== currentUserId);

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {isConnecting ? (
                <div className="flex items-center gap-1 text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-xs">Connecting...</span>
                </div>
              ) : isConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs">Connected</span>
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
                : isConnected
                ? "Real-time collaboration active"
                : "Collaboration unavailable"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Active Users */}
      {otherUsers.length > 0 && (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-1">
            {otherUsers.slice(0, 3).map((user) => (
              <TooltipProvider key={user.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="px-2 py-1 text-xs border-2"
                      style={{
                        borderColor: user.color,
                        backgroundColor: `${user.color}20`,
                      }}
                    >
                      {user.name?.slice(0, 2) || user.id.slice(0, 2)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{user.name || `User ${user.id}`} is editing</p>
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

interface UserCursorProps {
  user: CollaborationUser;
  position: { top: number; left: number };
}

export function UserCursor({ user, position }: UserCursorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-1px)",
      }}
    >
      <div
        className="w-0.5 h-5 animate-pulse"
        style={{ backgroundColor: user.color }}
      />
      <div
        className="mt-1 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name || `User ${user.id.slice(0, 8)}`}
      </div>
    </div>
  );
}
