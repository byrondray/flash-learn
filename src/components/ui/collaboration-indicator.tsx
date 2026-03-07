import React from "react";
import { Users, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import type { CollabUser } from "@/hooks/useCollaboration";

interface CollaborationIndicatorProps {
  isConnected: boolean;
  isSynced: boolean;
  activeUsers: CollabUser[];
  currentUserId?: string;
}

export function CollaborationIndicator(props: CollaborationIndicatorProps) {
  const currentUser = props.activeUsers.find(
    (u) => u.userId === props.currentUserId
  );
  const otherUsers = props.activeUsers.filter(
    (u) => u.userId !== props.currentUserId
  );
  const allDisplayUsers = [
    ...(currentUser ? [currentUser] : []),
    ...otherUsers,
  ];
  const previewUsers = allDisplayUsers.slice(0, 2);
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

      {allDisplayUsers.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 cursor-pointer rounded-md px-1 py-0.5 hover:bg-accent transition-colors">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-1">
                {previewUsers.map((u) => {
                  const isMe = u.userId === props.currentUserId;
                  return (
                    <Badge
                      key={u.userId}
                      variant="outline"
                      className="px-2 py-1 text-xs border-2"
                      style={{
                        borderColor: u.color,
                        backgroundColor: `${u.color}20`,
                      }}
                    >
                      {isMe ? "Me" : u.name || u.userId.slice(0, 2)}
                    </Badge>
                  );
                })}
                {allDisplayUsers.length > 2 && (
                  <Badge variant="outline" className="px-2 py-1 text-xs">
                    +{allDisplayUsers.length - 2}
                  </Badge>
                )}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <p className="text-sm font-medium px-2 py-1.5 text-muted-foreground">
              {allDisplayUsers.length} {allDisplayUsers.length === 1 ? "person" : "people"} editing
            </p>
            <div className="flex flex-col gap-1">
              {allDisplayUsers.map((u) => {
                const isMe = u.userId === props.currentUserId;
                return (
                  <div
                    key={u.userId}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: u.color }}
                    />
                    <span className="text-sm truncate">
                      {isMe ? "You" : u.name || `User ${u.userId.slice(0, 8)}`}
                    </span>
                    {isMe && (
                      <span className="text-xs text-muted-foreground ml-auto">(me)</span>
                    )}
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
