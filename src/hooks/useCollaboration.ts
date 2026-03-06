"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  HocuspocusProvider,
  type onAwarenessUpdateParameters,
} from "@hocuspocus/provider";
import * as Y from "yjs";

const COLLAB_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#feca57",
  "#ff9ff3",
  "#54a0ff",
  "#5f27cd",
  "#01a3a4",
  "#f368e0",
];

export interface CollabUser {
  name: string;
  color: string;
  userId: string;
}

export function useCollaboration(props: {
  noteId: string | undefined;
  userId: string | undefined;
  userName: string | undefined;
  collabUrl: string;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollabUser[]>([]);
  const providerRef = useRef<HocuspocusProvider | null>(null);

  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const ydoc = ydocRef.current;

  useEffect(() => {
    return () => {
      ydocRef.current.destroy();
    };
  }, []);

  const userColor = useMemo(() => {
    if (!props.userId) return COLLAB_COLORS[0];
    let hash = 0;
    for (let i = 0; i < props.userId.length; i++) {
      hash = props.userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
  }, [props.userId]);

  useEffect(() => {
    if (!props.noteId || !props.userId) return;

    const provider = new HocuspocusProvider({
      url: props.collabUrl,
      name: props.noteId,
      document: ydoc,
      token: props.userId,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onSynced: () => setIsSynced(true),
      onAwarenessUpdate: ({ states }: onAwarenessUpdateParameters) => {
        const users: CollabUser[] = [];
        states.forEach((state: Record<string, unknown>) => {
          if (state.user) {
            users.push(state.user as CollabUser);
          }
        });
        setActiveUsers(users);
      },
    });

    provider.setAwarenessField("user", {
      name: props.userName || props.userId.slice(0, 8),
      color: userColor,
      userId: props.userId,
    });

    providerRef.current = provider;

    return () => {
      provider.destroy();
      providerRef.current = null;
    };
  }, [props.noteId, props.userId, props.userName, props.collabUrl, userColor]);

  return {
    ydoc,
    provider: providerRef.current,
    isConnected,
    isSynced,
    activeUsers,
    userColor,
  };
}
