"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

const handler = async (event) => {
  console.log("Full event:", JSON.stringify(event, null, 2));

  // Handle missing requestContext
  if (!event.requestContext) {
    console.error(
      "No requestContext found - this Lambda should be called by API Gateway"
    );
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Direct invocation not supported. Use API Gateway WebSocket.",
      }),
    };
  }

  const { connectionId } = event.requestContext;

  if (!connectionId) {
    console.error("No connectionId found in requestContext");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No connection ID provided" }),
    };
  }

  let message;

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No message body provided" }),
      };
    }
    message = JSON.parse(event.body);
  } catch (error) {
    console.error("Error parsing message:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid message format" }),
    };
  }

  console.log("Message received:", {
    connectionId,
    action: message.action,
    environment: {
      CONNECTIONS_TABLE: process.env.CONNECTIONS_TABLE,
      WEBSOCKET_ENDPOINT: process.env.WEBSOCKET_ENDPOINT,
    },
  });

  // Validate required environment variables
  if (!process.env.CONNECTIONS_TABLE) {
    console.error("CONNECTIONS_TABLE environment variable not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }
  try {
    // Update last seen timestamp and set TTL (24 hours from now)
    const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours TTL
    await dynamodb.send(
      new UpdateCommand({
        TableName: process.env.CONNECTIONS_TABLE,
        Key: { connectionId },
        UpdateExpression: "SET lastSeen = :timestamp, #ttl = :ttl",
        ExpressionAttributeNames: {
          "#ttl": "ttl",
        },
        ExpressionAttributeValues: {
          ":timestamp": Date.now(),
          ":ttl": ttl,
        },
      })
    );
    switch (message.action) {
      case "connect":
        await handleConnect(connectionId, message);
        break;
      case "content_update":
        await handleContentUpdate(connectionId, message);
        break;
      case "cursor_update":
        await handleCursorUpdate(connectionId, message);
        break;
      case "ping":
        await handlePing(connectionId);
        break;
      default:
        console.warn("Unknown action:", message.action);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Unknown action" }),
        };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Message processed successfully" }),
    };
  } catch (error) {
    console.error("Error processing message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process message" }),
    };
  }
};

exports.handler = handler;

async function handleContentUpdate(connectionId, message) {
  if (!message.noteId || !message.userId) {
    console.error("Missing noteId or userId in content update");
    return;
  }

  const updateMessage = {
    type: "content_update",
    noteId: message.noteId,
    userId: message.userId,
    content: message.data?.content,
    title: message.data?.title,
    operation: message.data?.operation,
    position: message.data?.position,
    length: message.data?.length,
    timestamp: Date.now(),
  };

  await broadcastToNoteMembers(connectionId, message.noteId, updateMessage);
}

async function handleCursorUpdate(connectionId, message) {
  if (
    !message.noteId ||
    !message.userId ||
    typeof message.data?.position !== "number"
  ) {
    console.error("Missing required fields in cursor update");
    return;
  }

  const cursorMessage = {
    type: "cursor_update",
    noteId: message.noteId,
    userId: message.userId,
    position: message.data.position,
    timestamp: Date.now(),
  };

  await broadcastToNoteMembers(connectionId, message.noteId, cursorMessage);
}

async function handlePing(connectionId) {
  // Validate environment variables
  if (!process.env.WEBSOCKET_ENDPOINT) {
    console.error("WEBSOCKET_ENDPOINT environment variable not set");
    return;
  }

  // Convert WSS endpoint to HTTPS for API Gateway Management API
  const httpEndpoint = process.env.WEBSOCKET_ENDPOINT.replace(
    "wss://",
    "https://"
  );

  const apiGateway = new ApiGatewayManagementApiClient({
    endpoint: httpEndpoint,
  });

  try {
    await apiGateway.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          type: "pong",
          timestamp: Date.now(),
        }),
      })
    );
  } catch (error) {
    console.error("Failed to send pong:", error);
    if (error.statusCode === 410 || error.$metadata?.httpStatusCode === 410) {
      // Clean up stale connection
      await dynamodb.send(
        new DeleteCommand({
          TableName: process.env.CONNECTIONS_TABLE,
          Key: { connectionId },
        })
      );
    }
  }
}

async function broadcastToNoteMembers(senderConnectionId, noteId, message) {
  // Validate environment variables
  if (!process.env.WEBSOCKET_ENDPOINT) {
    console.error("WEBSOCKET_ENDPOINT environment variable not set");
    return;
  }

  // Convert WSS endpoint to HTTPS for API Gateway Management API
  const httpEndpoint = process.env.WEBSOCKET_ENDPOINT.replace(
    "wss://",
    "https://"
  );

  const apiGateway = new ApiGatewayManagementApiClient({
    endpoint: httpEndpoint,
  });
  try {
    // Get all connections for this note
    console.log("Querying connections for noteId:", noteId);
    const connections = await dynamodb.send(
      new QueryCommand({
        TableName: process.env.CONNECTIONS_TABLE,
        IndexName: "noteId-index",
        KeyConditionExpression: "noteId = :noteId",
        ExpressionAttributeValues: {
          ":noteId": noteId,
        },
      })
    );

    console.log("Found connections:", connections.Items?.length || 0);

    if (!connections.Items || connections.Items.length === 0) {
      console.log("No connections found for note:", noteId);
      return;
    }

    // Send message to all other users (not the sender)
    const connectionRecords = connections.Items;
    const broadcasts = connectionRecords
      .filter((conn) => conn.connectionId !== senderConnectionId)
      .map(async (connection) => {
        try {
          await apiGateway.send(
            new PostToConnectionCommand({
              ConnectionId: connection.connectionId,
              Data: JSON.stringify(message),
            })
          );
        } catch (error) {
          console.error(
            "Failed to broadcast to connection:",
            connection.connectionId,
            error
          );
          // Clean up stale connections
          if (
            error.statusCode === 410 ||
            error.$metadata?.httpStatusCode === 410
          ) {
            await dynamodb.send(
              new DeleteCommand({
                TableName: process.env.CONNECTIONS_TABLE,
                Key: { connectionId: connection.connectionId },
              })
            );
          }
        }
      });

    await Promise.all(broadcasts);
  } catch (error) {
    console.error("Error broadcasting to note members:", error);
  }
}

async function handleConnect(connectionId, message) {
  if (!message.userId || !message.noteId) {
    console.error("Missing userId or noteId in connect message");
    return;
  }

  console.log("Handling connect:", {
    connectionId,
    userId: message.userId,
    noteId: message.noteId,
  });
  try {
    // Update connection with user and note information and set TTL
    const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours TTL
    await dynamodb.send(
      new UpdateCommand({
        TableName: process.env.CONNECTIONS_TABLE,
        Key: { connectionId },
        UpdateExpression:
          "SET userId = :userId, noteId = :noteId, lastSeen = :lastSeen, #ttl = :ttl",
        ExpressionAttributeNames: {
          "#ttl": "ttl",
        },
        ExpressionAttributeValues: {
          ":userId": message.userId,
          ":noteId": message.noteId,
          ":lastSeen": Date.now(),
          ":ttl": ttl,
        },
      })
    );

    // Notify other users in the same note that someone joined
    await notifyOtherUsers(
      connectionId,
      message.noteId,
      message.userId,
      "user_joined"
    );

    console.log("User connected successfully:", {
      connectionId,
      userId: message.userId,
      noteId: message.noteId,
    });
  } catch (error) {
    console.error("Error handling connect:", error);
  }
}

async function notifyOtherUsers(currentConnectionId, noteId, userId, type) {
  // Validate environment variables
  if (!process.env.WEBSOCKET_ENDPOINT) {
    console.error("WEBSOCKET_ENDPOINT environment variable not set");
    return;
  }

  // Convert WSS endpoint to HTTPS for API Gateway Management API
  const httpEndpoint = process.env.WEBSOCKET_ENDPOINT.replace(
    "wss://",
    "https://"
  );

  const apiGateway = new ApiGatewayManagementApiClient({
    endpoint: httpEndpoint,
  });
  try {
    // Get all connections for this note
    console.log("Querying connections for noteId:", noteId);
    const connections = await dynamodb.send(
      new QueryCommand({
        TableName: process.env.CONNECTIONS_TABLE,
        IndexName: "noteId-index",
        KeyConditionExpression: "noteId = :noteId",
        ExpressionAttributeValues: {
          ":noteId": noteId,
        },
      })
    );

    console.log(
      "Found connections for notification:",
      connections.Items?.length || 0
    );

    if (!connections.Items || connections.Items.length === 0) {
      console.log("No other connections found for note:", noteId);
      return;
    }

    // Send notification to all other users (not the current user)
    const connectionRecords = connections.Items;
    const notifications = connectionRecords
      .filter((conn) => conn.connectionId !== currentConnectionId)
      .map(async (connection) => {
        try {
          const notificationMessage = {
            type: type,
            userId: userId,
            noteId: noteId,
            timestamp: Date.now(),
          };

          await apiGateway.send(
            new PostToConnectionCommand({
              ConnectionId: connection.connectionId,
              Data: JSON.stringify(notificationMessage),
            })
          );

          console.log(
            "Notified connection:",
            connection.connectionId,
            "about:",
            type
          );
        } catch (error) {
          console.error(
            "Failed to notify connection:",
            connection.connectionId,
            error
          );
          // Clean up stale connections
          if (
            error.statusCode === 410 ||
            error.$metadata?.httpStatusCode === 410
          ) {
            await dynamodb.send(
              new DeleteCommand({
                TableName: process.env.CONNECTIONS_TABLE,
                Key: { connectionId: connection.connectionId },
              })
            );
          }
        }
      });

    await Promise.all(notifications);
  } catch (error) {
    console.error("Error notifying other users:", error);
  }
}
