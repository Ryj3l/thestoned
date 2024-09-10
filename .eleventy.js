const slugify = require("@sindresorhus/slugify");
const markdownIt = require("markdown-it");
const fs = require("fs");
const matter = require("gray-matter");
const faviconsPlugin = require("eleventy-plugin-gen-favicons");
const tocPlugin = require("eleventy-plugin-nesting-toc");
const { parse } = require("node-html-parser");
const htmlMinifier = require("html-minifier-terser");
const pluginRss = require("@11ty/eleventy-plugin-rss");

const { headerToId, namedHeadingsFilter } = require("./src/helpers/utils");
const { userMarkdownSetup, userEleventySetup } = require("./src/helpers/userSetup");

const Image = require("@11ty/eleventy-img");

// Cache for memoization
const cache = new Map();

// Optimized image transformation
async function transformImage(src, cls, alt, sizes, widths = ["500", "700", "auto"]) {
  let options = {
    widths,
    formats: ["webp", "jpeg"],
    outputDir: "./dist/img/optimized",
    urlPath: "/img/optimized",
  };
  
  // Concurrently process the image
  await Image(src, options);
  return Image.statsSync(src, options);
}

// Memoized getAnchorAttributes
function getAnchorAttributes(filePath, linkTitle) {
  if (cache.has(filePath)) {
    return cache.get(filePath);
  }

  let fileName = filePath.replaceAll("&amp;", "&");
  let header = "";
  let headerLinkPath = "";
  if (filePath.includes("#")) {
    [fileName, header] = filePath.split("#");
    headerLinkPath = `#${headerToId(header)}`;
  }

  let noteIcon = process.env.NOTE_ICON_DEFAULT;
  const title = linkTitle || fileName;
  let permalink = `/notes/${slugify(filePath)}`;
  let deadLink = false;

  try {
    const startPath = "./src/site/notes/";
    const fullPath = fileName.endsWith(".md")
      ? `${startPath}${fileName}`
      : `${startPath}${fileName}.md`;
    const file = fs.readFileSync(fullPath, "utf8");
    const frontMatter = matter(file);
    
    if (frontMatter.data.permalink) permalink = frontMatter.data.permalink;
    if (frontMatter.data.tags?.includes("gardenEntry")) permalink = "/";
    if (frontMatter.data.noteIcon) noteIcon = frontMatter.data.noteIcon;
    
  } catch {
    deadLink = true;
  }

  const result = deadLink ? {
    attributes: {
      "class": "internal-link is-unresolved",
      "href": "/404",
      "target": "",
    },
    innerHTML: title,
  } : {
    attributes: {
      "class": "internal-link",
      "target": "",
      "data-note-icon": noteIcon,
      "href": `${permalink}${headerLinkPath}`,
    },
    innerHTML: title,
  };

  cache.set(filePath, result);  // Cache the result
  return result;
}

function getAnchorLink(filePath, linkTitle) {
  const { attributes, innerHTML } = getAnchorAttributes(filePath, linkTitle);
  return `<a ${Object.keys(attributes).map(key => `${key}="${attributes[key]}"`).join(" ")}>${innerHTML}</a>`;
}

// Regex compiled outside the loop for performance
const tagRegex = /(^|\s|\>)(#[^\s!@#$%^&*()=+\.,\[{\]};:'"?><]+)(?!([^<]*>))/g;

module.exports = function (eleventyConfig) {
  // Improved Markdown-it initialization
  let markdownLib = markdownIt({ breaks: true, html: true, linkify: true })
    .use(require("markdown-it-anchor"), { slugify: headerToId })
    .use(require("markdown-it-mark"))
    .use(require("markdown-it-footnote"))
    .use(require("markdown-it-attrs"))
    .use(require("markdown-it-task-checkbox"), { disabled: true })
    .use(require("markdown-it-mathjax3"), { tex: { inlineMath: [["$", "$"]] } })
    .use(require("markdown-it-plantuml"))
    .use(namedHeadingsFilter)
    .use(userMarkdownSetup);

  eleventyConfig.setLibrary("md", markdownLib);

  // Filters and transforms
  eleventyConfig.addFilter("isoDate", (date) => date?.toISOString());
  eleventyConfig.addFilter("link", (str) => 
    str?.replace(/\[\[(.*?\|.*?)\]\]/g, (match, p1) => {
      if (p1.includes("],[") || p1.includes('"$"')) return match;
      const [fileLink, linkTitle] = p1.split("|");
      return getAnchorLink(fileLink, linkTitle);
    })
  );
  eleventyConfig.addFilter("taggify", (str) =>
    str?.replace(tagRegex, (match, precede, tag) =>
      `${precede}<a class="tag" data-content="${tag}">${tag}</a>`)
  );
  eleventyConfig.addFilter("searchableTags", (str) =>
    str ? (str.match(tagRegex)?.map(m => `"${m.split("#")[1]}"`).join(", ") + ",") : ""
  );
  eleventyConfig.addFilter("hideDataview", (str) =>
    str?.replace(/\(\S+\:\:(.*)\)/g, (_, value) => value.trim())
  );

  // Transformations with improvements
  eleventyConfig.addTransform("dataview-js-links", (str) => {
    const parsed = parse(str);
    parsed.querySelectorAll("a[data-href].internal-link").forEach((link) => {
      const notePath = link.getAttribute("data-href");
      const title = link.innerHTML;
      const { attributes, innerHTML } = getAnchorAttributes(notePath, title);
      Object.keys(attributes).forEach(key => link.setAttribute(key, attributes[key]));
      link.innerHTML = innerHTML;
    });
    return parsed.innerHTML;
  });

  eleventyConfig.addTransform("callout-block", (str) => {
    const parsed = parse(str);
    parsed.querySelectorAll("blockquote").forEach((blockquote) => {
      const content = blockquote.innerHTML;
      const calloutMeta = /\[!([\w-]*)\|?(\s?.*)\](\+|\-)?(\s?.*)/;
      if (!content.match(calloutMeta)) return;

      const [callout, metaData, collapse, title] = content.match(calloutMeta);
      blockquote.tagName = "div";
      blockquote.classList.add("callout", collapse ? "is-collapsible" : "");
      if (collapse === "-") blockquote.classList.add("is-collapsed");
      blockquote.setAttribute("data-callout", callout.toLowerCase());
      blockquote.setAttribute("data-callout-metadata", metaData);
      blockquote.innerHTML = `<div class="callout-title">${title}</div>
        <div class="callout-content">${content}</div>`;
    });
    return parsed.innerHTML;
  });

  function fillPictureSourceSets(src, cls, alt, meta, width, imageTag) {
    imageTag.tagName = "picture";
    imageTag.innerHTML = `
      <source media="(max-width:480px)" srcset="${meta.webp[0].url}" type="image/webp" loading="lazy" />
      <source media="(max-width:480px)" srcset="${meta.jpeg[0].url}" loading="lazy" />
      <img class="${cls}" src="${src}" alt="${alt}" width="${width}" loading="lazy" />
    `;
  }

  eleventyConfig.addTransform("picture", (str) => {
    if (process.env.USE_FULL_RESOLUTION_IMAGES === "true") return str;
    const parsed = parse(str);
    parsed.querySelectorAll(".cm-s-obsidian img").forEach(async (imageTag) => {
      const src = imageTag.getAttribute("src");
      if (src && src.startsWith("/") && !src.endsWith(".svg")) {
        const cls = imageTag.classList.value;
        const alt = imageTag.getAttribute("alt");
        const width = imageTag.getAttribute("width") || '';
        try {
          const meta = await transformImage(`./src/site${decodeURI(src)}`, cls, alt, ["(max-width: 480px)", "(max-width: 1024px)"]);
          if (meta) fillPictureSourceSets(src, cls, alt, meta, width, imageTag);
        } catch {
          // Fault tolerance
        }
      }
    });
    return parsed.innerHTML;
  });

  // Table transformation
  eleventyConfig.addTransform("table", (str) => {
    const parsed = parse(str);
    parsed.querySelectorAll(".cm-s-obsidian > table").forEach((table) => {
      table.tagName = "div";
      table.classList.add("table-wrapper");
      table.innerHTML = `<table>${table.innerHTML}</table>`;
    });
    parsed.querySelectorAll(".cm-s-obsidian > .block-language-dataview > table").forEach((table) => {
      table.classList.add("dataview", "table-view-table");
      table.querySelector("thead")?.classList.add("table-view-thead");
      table.querySelector("tbody")?.classList.add("table-view-tbody");
    });
    return parsed.innerHTML;
  });

  // Conditional minification
  eleventyConfig.addTransform("htmlMinifier", (content, outputPath) => {
    if (process.env.NODE_ENV === "production" && outputPath?.endsWith(".html")) {
      return htmlMinifier.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
      });
    }
    return content;
  });

  // Static asset passthrough
  eleventyConfig.addPassthroughCopy("src/site/img");
  eleventyConfig.addPassthroughCopy("src/site/scripts");
  eleventyConfig.addPassthroughCopy("src/site/styles/_theme.*.css");

  // Plugins
  eleventyConfig.addPlugin(faviconsPlugin, { outputDir: "dist" });
  eleventyConfig.addPlugin(tocPlugin, { ul: true, tags: ["h1", "h2", "h3", "h4", "h5", "h6"] });

  // Additional filters
  eleventyConfig.addFilter("dateToZulu", (date) => {
    try {
      return new Date(date).toISOString("dd-MM-yyyyTHH:mm:ssZ");
    } catch {
      return "";
    }
  });

  eleventyConfig.addFilter("jsonify", (variable) => JSON.stringify(variable) || '""');
  eleventyConfig.addFilter("validJson", (variable) => 
    Array.isArray(variable)
      ? variable.map((x) => x.replaceAll("\\", "\\\\")).join(",")
      : typeof variable === "string" ? variable.replaceAll("\\", "\\\\") : variable
  );

  // RSS plugin
  eleventyConfig.addPlugin(pluginRss, {
    posthtmlRenderOptions: { closingSingleTag: "slash", singleTags: ["link"] },
  });

  userEleventySetup(eleventyConfig);

  return {
    dir: { input: "src/site", output: "dist", data: `_data` },
    templateFormats: ["njk", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false,
    passthroughFileCopy: true,
  };
};