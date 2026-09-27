import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (!env.MAPTILER_API_KEY) {
    throw new Error("MAPTILER_API_KEY is not configured.");
  }

  return {
    plugins: [viteSingleFile()],
    define: {
      "import.meta.env.MAPTILER_API_KEY": JSON.stringify(env.MAPTILER_API_KEY),
    },
    build: { target: "es2022", outDir: "dist", emptyOutDir: true },
  };
});
