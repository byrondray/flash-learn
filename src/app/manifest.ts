import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flash Learn",
    short_name: "FlashLearn",
    description:
      "AI-powered note taking app that turns your notes into flash cards and quiz questions for smarter studying.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#6366F1",
    icons: [
      {
        src: "/flash-learn-favicon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
