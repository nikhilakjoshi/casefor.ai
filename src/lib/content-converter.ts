import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { marked } from "marked";

// Initialize Turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
});

// Use GitHub Flavored Markdown plugin for proper table support
turndownService.use(gfm);

// Add custom rules for better conversion
turndownService.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

// Configure marked for GitHub Flavored Markdown (includes table support)
marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * Convert HTML content to Markdown
 * @param html - HTML string to convert
 * @returns Markdown string
 */
export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error("Error converting HTML to Markdown:", error);
    return html; // Return original HTML as fallback
  }
}

/**
 * Convert Markdown content to HTML
 * @param markdown - Markdown string to convert
 * @returns HTML string
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  if (!markdown || typeof markdown !== "string") {
    return "";
  }

  try {
    const html = await marked(markdown);
    return html;
  } catch (error) {
    console.error("Error converting Markdown to HTML:", error);
    return markdown; // Return original markdown as fallback
  }
}

/**
 * Synchronous version of markdownToHtml for client-side use
 * @param markdown - Markdown string to convert
 * @returns HTML string
 */
export function markdownToHtmlSync(markdown: string): string {
  if (!markdown || typeof markdown !== "string") {
    return "";
  }

  try {
    // Use marked.parse for synchronous conversion
    const html = marked.parse(markdown) as string;
    return html;
  } catch (error) {
    console.error("Error converting Markdown to HTML:", error);
    return markdown;
  }
}
