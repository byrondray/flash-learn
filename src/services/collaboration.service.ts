import { WebSocketMessage } from "@/hooks/useWebSocket";

export interface CollaborationUser {
  id: string;
  name?: string;
  color: string;
  cursor?: {
    position: number;
    timestamp: number;
  };
}

export interface OperationalTransform {
  type: "insert" | "delete" | "retain";
  length?: number;
  text?: string;
  position: number;
}

export class CollaborationService {
  private users: Map<string, CollaborationUser> = new Map();
  private onUsersUpdate?: (users: CollaborationUser[]) => void;
  private onContentUpdate?: (content: string, title?: string) => void;
  private onCursorUpdate?: (userId: string, position: number) => void;

  private readonly userColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];

  constructor(
    onUsersUpdate?: (users: CollaborationUser[]) => void,
    onContentUpdate?: (content: string, title?: string) => void,
    onCursorUpdate?: (userId: string, position: number) => void
  ) {
    this.onUsersUpdate = onUsersUpdate;
    this.onContentUpdate = onContentUpdate;
    this.onCursorUpdate = onCursorUpdate;
  }

  addUser(userId: string, name?: string): CollaborationUser {
    if (this.users.has(userId)) {
      return this.users.get(userId)!;
    }

    const user: CollaborationUser = {
      id: userId,
      name: name || `User ${userId.slice(0, 8)}`,
      color: this.userColors[this.users.size % this.userColors.length],
    };

    this.users.set(userId, user);
    this.notifyUsersUpdate();
    return user;
  }

  removeUser(userId: string): void {
    this.users.delete(userId);
    this.notifyUsersUpdate();
  }

  updateUserCursor(userId: string, position: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.cursor = {
        position,
        timestamp: Date.now(),
      };
      this.onCursorUpdate?.(userId, position);
    }
  }

  getUsers(): CollaborationUser[] {
    return Array.from(this.users.values());
  }

  getUser(userId: string): CollaborationUser | undefined {
    return this.users.get(userId);
  }
  processMessage(message: WebSocketMessage): void {
    console.log("Processing collaboration message:", message);

    switch (message.type) {
      case "content_update":
        if (message.content !== undefined || message.title !== undefined) {
          console.log("Updating content:", {
            content: message.content,
            title: message.title,
          });
          this.onContentUpdate?.(message.content || "", message.title);
        }
        break;

      case "cursor_update":
        if (message.userId && message.position !== undefined) {
          console.log("Updating cursor:", {
            userId: message.userId,
            position: message.position,
          });
          this.updateUserCursor(message.userId, message.position);
        }
        break;

      case "user_joined":
        if (message.userId) {
          console.log("User joined:", message.userId);
          this.addUser(message.userId);
        }
        break;

      case "user_left":
        if (message.userId) {
          console.log("User left:", message.userId);
          this.removeUser(message.userId);
        }
        break;

      default:
        console.log("Unknown message type:", message.type);
    }
  }

  // Operational Transform utilities
  static transformOperation(
    op1: OperationalTransform,
    op2: OperationalTransform
  ): OperationalTransform {
    // Simple operational transform implementation
    // This is a basic version - for production, consider using a library like ShareJS or Yjs

    if (op1.type === "insert" && op2.type === "insert") {
      if (op1.position <= op2.position) {
        return {
          ...op2,
          position: op2.position + (op1.text?.length || 0),
        };
      }
    }

    if (op1.type === "delete" && op2.type === "insert") {
      if (op1.position < op2.position) {
        return {
          ...op2,
          position: Math.max(op1.position, op2.position - (op1.length || 0)),
        };
      }
    }

    if (op1.type === "insert" && op2.type === "delete") {
      if (op1.position <= op2.position) {
        return {
          ...op2,
          position: op2.position + (op1.text?.length || 0),
        };
      }
    }

    if (op1.type === "delete" && op2.type === "delete") {
      if (op1.position < op2.position) {
        return {
          ...op2,
          position: Math.max(op1.position, op2.position - (op1.length || 0)),
          length: op2.length,
        };
      }
    }

    return op2;
  }

  static applyOperation(text: string, operation: OperationalTransform): string {
    switch (operation.type) {
      case "insert":
        return (
          text.slice(0, operation.position) +
          (operation.text || "") +
          text.slice(operation.position)
        );

      case "delete":
        return (
          text.slice(0, operation.position) +
          text.slice(operation.position + (operation.length || 0))
        );

      case "retain":
        return text;

      default:
        return text;
    }
  }

  // Generate a diff between two texts and return operations
  static generateOperations(
    oldText: string,
    newText: string
  ): OperationalTransform[] {
    const operations: OperationalTransform[] = [];

    // Simple diff algorithm - for production, consider using a more sophisticated diff library
    let oldIndex = 0;
    let newIndex = 0;

    while (oldIndex < oldText.length || newIndex < newText.length) {
      if (oldIndex >= oldText.length) {
        // Insert remaining characters
        operations.push({
          type: "insert",
          position: oldIndex,
          text: newText.slice(newIndex),
        });
        break;
      }

      if (newIndex >= newText.length) {
        // Delete remaining characters
        operations.push({
          type: "delete",
          position: oldIndex,
          length: oldText.length - oldIndex,
        });
        break;
      }

      if (oldText[oldIndex] === newText[newIndex]) {
        // Characters match, retain
        oldIndex++;
        newIndex++;
      } else {
        // Find the next matching character
        let matchFound = false;
        for (
          let i = newIndex + 1;
          i < newText.length && i < newIndex + 10;
          i++
        ) {
          if (oldText[oldIndex] === newText[i]) {
            // Insert the characters before the match
            operations.push({
              type: "insert",
              position: oldIndex,
              text: newText.slice(newIndex, i),
            });
            newIndex = i;
            matchFound = true;
            break;
          }
        }

        if (!matchFound) {
          for (
            let i = oldIndex + 1;
            i < oldText.length && i < oldIndex + 10;
            i++
          ) {
            if (oldText[i] === newText[newIndex]) {
              // Delete the characters before the match
              operations.push({
                type: "delete",
                position: oldIndex,
                length: i - oldIndex,
              });
              oldIndex = i;
              matchFound = true;
              break;
            }
          }
        }

        if (!matchFound) {
          // Replace character
          operations.push({
            type: "delete",
            position: oldIndex,
            length: 1,
          });
          operations.push({
            type: "insert",
            position: oldIndex,
            text: newText[newIndex],
          });
          oldIndex++;
          newIndex++;
        }
      }
    }

    return operations;
  }

  private notifyUsersUpdate(): void {
    this.onUsersUpdate?.(this.getUsers());
  }

  destroy(): void {
    this.users.clear();
    this.onUsersUpdate = undefined;
    this.onContentUpdate = undefined;
    this.onCursorUpdate = undefined;
  }
}
