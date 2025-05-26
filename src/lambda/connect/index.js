"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
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

  // Handle missing requestContext (shouldn't happen in API Gateway)
  if (!event.requestContext) {
    console.error(
      "No requestContext found - this Lambda should be called by API Gateway"
    );

    // Check if this is a direct invocation with connection data
    if (event.action === "connect" && event.userId && event.noteId) {
      console.log("Detected direct invocation with connection data");
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Direct invocation not supported. Use API Gateway WebSocket.",
        }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid event format" }),
    };
  }

  const { connectionId, routeKey } = event.requestContext;

  // Additional safety check for connectionId
  if (!connectionId) {
    console.error("No connectionId found in requestContext");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No connection ID provided" }),
    };
  }
  if (!connectionId) {
    console.error("No connectionId found in requestContext");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No connection ID provided" }),
    };
  }
  console.log("Connection event:", {
    connectionId,
    routeKey,
    body: event.body,
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

  // Handle initial WebSocket connection ($connect route)
  if (routeKey === "$connect") {
    // For $connect, just store the connection with TTL
    const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours TTL
    const params = {
      TableName: process.env.CONNECTIONS_TABLE,
      Item: {
        connectionId,
        connectedAt: Date.now(),
        lastSeen: Date.now(),
        ttl: ttl,
      },
    };

    try {
      await dynamodb.send(new PutCommand(params));
      console.log("Initial connection stored:", connectionId);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "WebSocket connected",
          connectionId,
        }),
      };
    } catch (error) {
      console.error("Error saving initial connection:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to connect" }),
      };
    }
  }

  // Handle connect action message (with userId and noteId)
  // This handles the "connect" route or when called from $default
  let requestData = {};
  try {
    if (event.body) {
      requestData = JSON.parse(event.body);
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  const { userId, noteId } = requestData;

  if (!userId || !noteId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "userId and noteId are required" }),
    };
  }

  console.log("Connect action:", { connectionId, userId, noteId });
  // Update connection with user and note information and TTL
  const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours TTL
  const updateParams = {
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId },
    UpdateExpression:
      "SET userId = :userId, noteId = :noteId, lastSeen = :lastSeen, #ttl = :ttl",
    ExpressionAttributeNames: {
      "#ttl": "ttl",
    },
    ExpressionAttributeValues: {
      ":userId": userId,
      ":noteId": noteId,
      ":lastSeen": Date.now(),
      ":ttl": ttl,
    },
  };

  try {
    await dynamodb.send(new UpdateCommand(updateParams));

    // Notify other users in the same note that someone joined
    await notifyOtherUsers(connectionId, noteId, userId, "user_joined");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Connected successfully",
        connectionId,
        userId,
        noteId,
      }),
    };
  } catch (error) {
    console.error("Error updating connection:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update connection" }),
    };
  }
};

exports.handler = handler;

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

    if (!connections.Items || connections.Items.length === 0) {
      return;
    }

    const connectionRecords = connections.Items;
    const notifications = connectionRecords
      .filter((conn) => conn.connectionId !== currentConnectionId)
      .map(async (connection) => {
        try {
          const message = {
            type,
            userId,
            noteId,
            timestamp: Date.now(),
          };

          await apiGateway.send(
            new PostToConnectionCommand({
              ConnectionId: connection.connectionId,
              Data: JSON.stringify(message),
            })
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
