const slugify = require("@sindresorhus/slugify");
const markdownIt = require("markdown-it");
const fs = require("fs"); // For synchronous file operations
const fsp = fs.promises;  // For asynchronous file operations (promises API)
const matter = require("gray-matter");
const faviconsPlugin = require("eleventy-plugin-gen-favicons");
const tocPlugin = require("eleventy-plugin-nesting-toc");
const { parse } = require("node-html-parser");
const htmlMinifier = require("html-minifier-terser");
const pluginRss = require("@11ty/eleventy-plugin-rss");

const { headerToId, namedHeadingsFilter } = require("./src/helpers/utils");
const { userMarkdownSetup, userEleventySetup } = require("./src/helpers/userSetup");

const Image = require("@11ty/eleventy-img");

/**
 * Asynchronously transforms an image using `eleventy-img` plugin.
 * This is a long-running task (I/O-bound), so it should not block the main process.
 */
async function transformImage(src, cls, alt, sizes, widths = ["500", "700", "auto"]) {
  let options = {
    widths: widths,
    formats: ["webp", "jpeg"],
    outputDir: "./dist/img/optimized",  // Where to save the optimized images
    urlPath: "/img/optimized",          // The URL path to use in the output HTML
  };

  // Async image generation (non-blocking I/O)
  await Image(src, options);

  // Synchronous method for metadata fetching (because we need it immediately)
  let metadata = Image.statsSync(src, options);
  return metadata;
}

/**
 * Asynchronously fetches anchor attributes for links in markdown.
 * File reading is I/O-bound and may be slow, so we use async to avoid blocking.
 */
async function getAnchorAttributes(filePath, linkTitle) {
  let fileName = filePath.replaceAll("&amp;", "&");
  let header = "";
  let headerLinkPath = "";
  if (filePath.includes("#")) {
    [fileName, header] = filePath.split("#");
    headerLinkPath = `#${headerToId(header)}`;
  }

  let noteIcon = process.env.NOTE_ICON_DEFAULT;
  const title = linkTitle ? linkTitle : fileName;
  let permalink = `/notes/${slugify(filePath)}`;
  let deadLink = false;
  
  try {
    const startPath = "./src/site/notes/";
    const fullPath = fileName.endsWith(".md")
      ? `${startPath}${fileName}`
      : `${startPath}${fileName}.md`;

    // Asynchronously read the file to avoid blocking
    const file = await fsp.readFile(fullPath, "utf8");
    const frontMatter = matter(file);

    if (frontMatter.data.permalink) {
      permalink = frontMatter.data.permalink;
    }
    
    if (frontMatter.data.tags && frontMatter.data.tags.includes("gardenEntry")) {
      permalink = "/";
    }
    
    if (frontMatter.data.noteIcon) {
      noteIcon = frontMatter.data.noteIcon;
    }
  } catch {
    // If the file does not exist or there is an error, it's a dead link
    deadLink = true;
  }

  // If it's a dead link, return 404 attributes
  if (deadLink) {
    return {
      attributes: {
        class: "internal-link is-unresolved",
        href: "/404",
        target: "",
      },
      innerHTML: title,
    };
  }
  
  // Otherwise, return the regular anchor attributes
  return {
    attributes: {
      class: "internal-link",
      target: "",
      "data-note-icon": noteIcon,
      href: `${permalink}${headerLinkPath}`,
    },
    innerHTML: title,
  };
}

/**
 * Synchronously fetches anchor attributes for links.
 * Used where immediate results are needed and blocking the process is acceptable.
 */
function getAnchorAttributesSync(filePath, linkTitle) {
  let fileName = filePath.replaceAll("&amp;", "&");
  let header = "";
  let headerLinkPath = "";
  if (filePath.includes("#")) {
    [fileName, header] = filePath.split("#");
    headerLinkPath = `#${headerToId(header)}`;
  }

  let noteIcon = process.env.NOTE_ICON_DEFAULT;
  const title = linkTitle ? linkTitle : fileName;
  let permalink = `/notes/${slugify(filePath)}`;
  let deadLink = false;

  try {
    const startPath = "./src/site/notes/";
    const fullPath = fileName.endsWith(".md")
      ? `${startPath}${fileName}`
      : `${startPath}${fileName}.md`;

    // Synchronously read the file to get front matter data (blocking)
    const file = fs.readFileSync(fullPath, "utf8");
    const frontMatter = matter(file);

    if (frontMatter.data.permalink) {
      permalink = frontMatter.data.permalink;
    }
    
    if (frontMatter.data.tags && frontMatter.data.tags.includes("gardenEntry")) {
      permalink = "/";
    }
    
    if (frontMatter.data.noteIcon) {
      noteIcon = frontMatter.data.noteIcon;
    }
  } catch {
    // If file is missing, it's a dead link
    deadLink = true;
  }

  // If it's a dead link, return 404 attributes
  if (deadLink) {
    return {
      attributes: {
        class: "internal-link is-unresolved",
        href: "/404",
        target: "",
      },
      innerHTML: title,
    };
  }

  // Otherwise, return the correct link attributes
  return {
    attributes: {
      class: "internal-link",
      target: "",
      "data-note-icon": noteIcon,
      href: `${permalink}${headerLinkPath}`,
    },
    innerHTML: title,
  };
}

/**
 * Synchronously fetches the anchor link HTML.
 * It uses the synchronous version of `getAnchorAttributes` because immediate results are required.
 */
function getAnchorLink(filePath, linkTitle) {
  const { attributes, innerHTML } = getAnchorAttributesSync(filePath, linkTitle); // Synchronous call
  return `<a ${Object.keys(attributes)
    .map((key) => `${key}="${attributes[key]}"`)
    .join(" ")}>${innerHTML}</a>`;
}

/**
 * Eleventy configuration export. 
 * Handles filters, transforms, and markdown processing.
 */
module.exports = function (eleventyConfig) {
  eleventyConfig.setLiquidOptions({
    dynamicPartials: true,
  });

  // Markdown configuration with various plugins
  let markdownLib = markdownIt({
    breaks: true,   // Breaks lines on newlines
    html: true,     // Allows HTML in markdown
    linkify: true,  // Automatically turns links into clickable links
  })
    .use(require("markdown-it-anchor"), {
      slugify: headerToId,  // For consistent heading IDs
    })
    .use(require("markdown-it-mark"))   // Plugin to handle mark syntax
    .use(require("markdown-it-footnote"))  // Plugin to handle footnotes
    .use(require("markdown-it-mathjax3"), {  // MathJax plugin for LaTeX equations
      tex: {
        inlineMath: [["$", "$"]],
      },
    })
    .use(require("markdown-it-attrs"))  // For handling custom attributes in markdown
    .use(require("markdown-it-task-checkbox"), {  // For handling checkboxes in markdown
      disabled: true,
      divWrap: false,
      divClass: "checkbox",
      idPrefix: "cbx_",
      ulClass: "task-list",
      liClass: "task-list-item",
    })
    .use(require("markdown-it-plantuml"), {  // For rendering PlantUML diagrams
      openMarker: "```plantuml",
      closeMarker: "```",
    })
    .use(namedHeadingsFilter)  // Filter to give names to markdown headings
    .use(userMarkdownSetup);  // Custom user-specific markdown setup

  // Set the custom markdown library in Eleventy
  eleventyConfig.setLibrary("md", markdownLib);

  // Custom Eleventy filter for transforming [[wikilinks]] into HTML links
  eleventyConfig.addFilter("link", function (str) {
    return (
      str &&
      str.replace(/\[\[(.*?\|.*?)\]\]/g, function (match, p1) {
        const [fileLink, linkTitle] = p1.split("|");
        return getAnchorLink(fileLink, linkTitle);  // Synchronous usage here
      })
    );
  });

  // Register the jsonify filter
  eleventyConfig.addFilter("jsonify", function (variable) {
    return JSON.stringify(variable) || '""';
  });

  // Additional filters and transforms can be added here...

  // Call user-defined setup
  userEleventySetup(eleventyConfig);

  // Return the Eleventy configuration object
  return {
    dir: {
      input: "src/site",   // Input folder for source files
      output: "dist",      // Output folder for the build
      data: `_data`,       // Data directory for Eleventy
    },
    templateFormats: ["njk", "md", "11ty.js"],  // Supported template formats
    htmlTemplateEngine: "njk",  // Nunjucks as the HTML template engine
    markdownTemplateEngine: false,  // Disable markdown as a template engine
    passthroughFileCopy: true,  // Copy static files directly
  };
};
