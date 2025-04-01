import { defineCollection, z } from "astro:content";

// Define the blog collection schema to match your imported WordPress content
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    categories: z.array(z.string()).default(["uncategorized"]),
    tags: z.array(z.string()).default([]),
    authors: z.array(z.string()).default(["scripturespeakers"]),
    featured: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  schema: z.object({
    name: z.string(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
  }),
});

export const collections = { blog, authors };
