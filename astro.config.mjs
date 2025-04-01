// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // Add the MDX integration
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  // Make sure your content collection is properly configured
  content: {
    collections: {
      blog: {
        glob: ["**/*.md", "**/*.mdx"],
      },
    },
  },
});
