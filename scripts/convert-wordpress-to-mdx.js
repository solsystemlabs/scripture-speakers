import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseString } from "xml2js";
import TurndownService from "turndown";

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const turndownService = new TurndownService();

// Get the XML file path from command line arguments
const xmlFilePath = process.argv[2];

if (!xmlFilePath) {
  console.error("Error: Please specify the WordPress export XML file path.");
  console.error(
    "Usage: node convert-wordpress-to-mdx.mjs path/to/wordpress-export.xml",
  );
  process.exit(1);
}

// Check if the file exists
if (!fs.existsSync(xmlFilePath)) {
  console.error(`Error: File not found: ${xmlFilePath}`);
  console.error("Please make sure the file exists and the path is correct.");
  process.exit(1);
}

// Read WordPress XML export
console.log(`Reading WordPress export from: ${xmlFilePath}`);
const xmlData = fs.readFileSync(xmlFilePath, "utf8");

// Use promises with parseString
const parseXml = (xml) => {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// Main function using async/await
const convertWordPressToMdx = async () => {
  try {
    console.log("Parsing XML data...");
    const result = await parseXml(xmlData);

    if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) {
      console.error("Error: Invalid WordPress export XML format.");
      process.exit(1);
    }

    const items = result.rss.channel[0].item;
    console.log(`Found ${items.length} items in the export file.`);

    // Count posts to process
    const postsToProcess = items.filter(
      (item) =>
        item["wp:post_type"] &&
        item["wp:post_type"][0] === "post" &&
        item["wp:status"] &&
        item["wp:status"][0] === "publish",
    );

    console.log(`Processing ${postsToProcess.length} published posts...`);

    // Create the output directories if they don't exist
    const blogOutputDir = path.join(process.cwd(), "src/content/blog");
    const authorsOutputDir = path.join(process.cwd(), "src/content/authors");

    if (!fs.existsSync(blogOutputDir)) {
      console.log(`Creating blog output directory: ${blogOutputDir}`);
      fs.mkdirSync(blogOutputDir, { recursive: true });
    }

    if (!fs.existsSync(authorsOutputDir)) {
      console.log(`Creating authors output directory: ${authorsOutputDir}`);
      fs.mkdirSync(authorsOutputDir, { recursive: true });
    }

    // Track authors to create author files later
    const authors = new Set();

    let processedCount = 0;

    // Process each post
    items.forEach((item) => {
      if (
        item["wp:post_type"] &&
        item["wp:post_type"][0] === "post" &&
        item["wp:status"] &&
        item["wp:status"][0] === "publish"
      ) {
        const title = item.title ? item.title[0] : "Untitled";
        const content = item["content:encoded"]
          ? item["content:encoded"][0]
          : "";
        const pubDate = item.pubDate ? new Date(item.pubDate[0]) : new Date();
        const slug = item["wp:post_name"]
          ? item["wp:post_name"][0]
          : `post-${processedCount}`;

        // Extract author if available
        const author = item["dc:creator"] ? item["dc:creator"][0] : "default";
        authors.add(author);

        // Extract excerpt if available
        const excerpt = item["excerpt:encoded"]
          ? item["excerpt:encoded"][0]
          : "";

        // Extract categories if they exist
        const categories = item.category
          ? item.category
              .filter((cat) => cat.$ && cat.$.domain === "category")
              .map((cat) => cat._)
          : ["uncategorized"];

        // Extract tags if they exist
        const tags = item.category
          ? item.category
              .filter((cat) => cat.$ && cat.$.domain === "post_tag")
              .map((cat) => cat._)
          : [];

        // Convert HTML to Markdown
        const markdown = turndownService.turndown(content);

        // Create description from excerpt or truncate content
        const description = excerpt
          ? turndownService.turndown(excerpt).substring(0, 160).trim()
          : markdown.substring(0, 160).trim();

        // Create frontmatter
        const frontmatter = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
pubDate: ${pubDate.toISOString().split("T")[0]}
authors: [${JSON.stringify(author)}]
categories: ${JSON.stringify(categories)}
tags: ${JSON.stringify(tags)}
---`;

        // Write MDX file
        const outputPath = path.join(blogOutputDir, `${slug}.mdx`);
        fs.writeFileSync(outputPath, `${frontmatter}\n\n${markdown}`);

        processedCount++;
        console.log(
          `Processed (${processedCount}/${postsToProcess.length}): ${title} by ${author}`,
        );
      }
    });

    // Create author files
    console.log(`\nCreating author files for ${authors.size} authors...`);
    authors.forEach((author) => {
      const authorSlug = author.toLowerCase().replace(/\s+/g, "-");
      const authorFrontmatter = `---
name: ${JSON.stringify(author)}
bio: ""
avatar: ""
---

Author bio for ${author}.`;

      const authorOutputPath = path.join(authorsOutputDir, `${authorSlug}.mdx`);
      fs.writeFileSync(authorOutputPath, authorFrontmatter);
      console.log(`Created author file for: ${author}`);
    });

    console.log(
      `\nConversion completed successfully! ${processedCount} posts converted to MDX.`,
    );
    console.log(
      `Output directories:\n- Blog posts: ${blogOutputDir}\n- Authors: ${authorsOutputDir}`,
    );
  } catch (error) {
    console.error("Error processing WordPress export:", error);
    process.exit(1);
  }
};

// Execute the main function
convertWordPressToMdx();
