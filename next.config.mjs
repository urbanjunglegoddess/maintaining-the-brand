import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin file tracing to this project so a lockfile elsewhere on the machine
  // can't be mistaken for the workspace root.
  outputFileTracingRoot: dir,
  // The PDF route reads the brand fonts off disk at runtime. Nothing imports
  // them, so tracing can't infer them — they must be listed explicitly or the
  // serverless function ships without them and silently uses fallback fonts.
  outputFileTracingIncludes: {
    "/api/export/pdf": ["./assets/fonts/**/*"],
  },
};
export default nextConfig;
