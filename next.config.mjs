import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin file tracing to this project so a lockfile elsewhere on the machine
  // can't be mistaken for the workspace root.
  outputFileTracingRoot: dir,
};
export default nextConfig;
