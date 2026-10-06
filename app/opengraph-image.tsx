import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social share card: deep vineyard gradient, gold serif title.
 * Served at /opengraph-image by the App Router.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #0c1f16 0%, #14301f 45%, #1d4a2a 100%)",
          position: "relative",
        }}
      >
        {/* soft golden glow */}
        <div
          style={{
            position: "absolute",
            top: "-160px",
            right: "-120px",
            width: "560px",
            height: "560px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0) 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginBottom: "26px",
          }}
        >
          <span style={{ fontSize: "54px", color: "#d4af37" }}>✦</span>
          <span
            style={{
              fontSize: "30px",
              letterSpacing: "10px",
              color: "#d4af37",
              fontFamily: "Georgia, serif",
            }}
          >
            TRUVINE
          </span>
          <span style={{ fontSize: "54px", color: "#d4af37" }}>✦</span>
        </div>
        <div
          style={{
            fontSize: "96px",
            fontFamily: "Georgia, serif",
            color: "#fdf6e3",
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          Word of God Risen
        </div>
        <div
          style={{
            marginTop: "28px",
            fontSize: "32px",
            color: "#b8c9a8",
            fontFamily: "Georgia, serif",
            textAlign: "center",
          }}
        >
          Bible, Apocrypha &amp; the Lost Books
        </div>
      </div>
    ),
    { ...size }
  );
}
