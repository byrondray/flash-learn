"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
  QueryCommand,
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

  console.log("Disconnect request:", {
    connectionId,
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
    // Get connection details before deleting
    const connection = await dynamodb.send(
      new GetCommand({
        TableName: process.env.CONNECTIONS_TABLE,
        Key: { connectionId },
      })
    );

    // Delete the connection
    await dynamodb.send(
      new DeleteCommand({
        TableName: process.env.CONNECTIONS_TABLE,
        Key: { connectionId },
      })
    );

    // Notify other users that someone left
    if (connection.Item && connection.Item.noteId && connection.Item.userId) {
      await notifyOtherUsers(
        connectionId,
        connection.Item.noteId,
        connection.Item.userId,
        "user_left"
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Disconnected successfully" }),
    };
  } catch (error) {
    console.error("Error handling disconnect:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to disconnect" }),
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

  // Initialize API Gateway client with endpoint
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

    // Send notification to all other users
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
