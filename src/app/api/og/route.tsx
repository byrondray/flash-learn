import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title");
  const type = searchParams.get("type");

  const typeLabel =
    type === "flashcard"
      ? "Flash Cards"
      : type === "quiz"
        ? "Quiz"
        : type === "note"
          ? "Shared Note"
          : null;

  const typeColor =
    type === "flashcard"
      ? "#8B5CF6"
      : type === "quiz"
        ? "#3B82F6"
        : type === "note"
          ? "#10B981"
          : "#6366F1";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0F172A",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            zIndex: 1,
            padding: "40px 60px",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                display: "flex",
              }}
            >
              ⚡
            </div>
            <div
              style={{
                fontSize: "52px",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
              }}
            >
              Flash Learn
            </div>
          </div>

          {typeLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: typeColor + "22",
                border: `2px solid ${typeColor}`,
                borderRadius: "9999px",
                padding: "8px 24px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  color: typeColor,
                }}
              >
                {typeLabel}
              </div>
            </div>
          )}

          {title ? (
            <div
              style={{
                fontSize: "36px",
                fontWeight: 600,
                color: "#E2E8F0",
                textAlign: "center",
                maxWidth: "900px",
                lineClamp: 2,
                display: "-webkit-box",
                overflow: "hidden",
              }}
            >
              {title}
            </div>
          ) : (
            <div
              style={{
                fontSize: "28px",
                fontWeight: 400,
                color: "#94A3B8",
                textAlign: "center",
                maxWidth: "800px",
              }}
            >
              AI-powered note taking that turns your notes into flash cards and
              quiz questions
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={{ fontSize: "18px", color: "#64748B" }}>
            flashlearn.ca
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
