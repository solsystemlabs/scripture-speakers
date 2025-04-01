import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    categories: z.array(z.string()).default(["uncategorized"]),
    authors: z.array(z.string()).default(["default"]),
    featured: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string().optional(),
  }),
});

export const collections = { blog, authors };
