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

/**
 * Asynchronously transforms an image using `eleventy-img` plugin.
 * This is a long-running task (I/O-bound), so it should not block the main process.
 */
async function transformImage(src, cls, alt, sizes, widths = ["500", "700", "auto"]) {
  let options = {
    widths: widths,
    formats: ["webp", "jpeg"],
    outputDir: "./dist/img/optimized",
    urlPath: "/img/optimized",
  };

  await Image(src, options);
  let metadata = Image.statsSync(src, options);
  return metadata;
}

/**
 * Fetches anchor attributes for links.
 */
function getAnchorAttributes(filePath, linkTitle) {
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
    const file = fs.readFileSync(fullPath, "utf8");
    const frontMatter = matter(file);
    if (frontMatter.data.permalink) {
      permalink = frontMatter.data.permalink;
    }
    if (frontMatter.data.tags && frontMatter.data.tags.indexOf("gardenEntry") != -1) {
      permalink = "/";
    }
    if (frontMatter.data.noteIcon) {
      noteIcon = frontMatter.data.noteIcon;
    }
  } catch {
    deadLink = true;
  }

  if (deadLink) {
    return {
      attributes: {
        "class": "internal-link is-unresolved",
        "href": "/404",
        "target": "",
      },
      innerHTML: title,
    };
  }
  return {
    attributes: {
      "class": "internal-link",
      "target": "",
      "data-note-icon": noteIcon,
      "href": `${permalink}${headerLinkPath}`,
    },
    innerHTML: title,
  };
}

/**
 * Generates the HTML for an anchor link.
 */
function getAnchorLink(filePath, linkTitle) {
  const { attributes, innerHTML } = getAnchorAttributes(filePath, linkTitle);
  return `<a ${Object.keys(attributes).map(key => `${key}="${attributes[key]}"`).join(" ")}>${innerHTML}</a>`;
}

const tagRegex = /(^|\s|\>)(#[^\s!@#$%^&*()=+\.,\[{\]};:'"?><]+)(?!([^<]*>))/g;

module.exports = function (eleventyConfig) {
  eleventyConfig.setLiquidOptions({
    dynamicPartials: true,
  });

  // Markdown configuration with various plugins
  let markdownLib = markdownIt({
    breaks: true,
    html: true,
    linkify: true,
  })
    .use(require("markdown-it-anchor"), {
      slugify: headerToId,
    })
    .use(require("markdown-it-mark"))
    .use(require("markdown-it-footnote"))
    .use(require("markdown-it-mathjax3"), {
      tex: {
        inlineMath: [["$", "$"]],
      },
    })
    .use(require("markdown-it-attrs"))
    .use(require("markdown-it-task-checkbox"), {
      disabled: true,
      divWrap: false,
      divClass: "checkbox",
      idPrefix: "cbx_",
      ulClass: "task-list",
      liClass: "task-list-item",
    })
    .use(require("markdown-it-plantuml"), {
      openMarker: "```plantuml",
      closeMarker: "```",
    })
    .use(namedHeadingsFilter)
    .use(userMarkdownSetup);

  eleventyConfig.setLibrary("md", markdownLib);

  // Filters for transforming links, tags, JSON, etc.
  eleventyConfig.addFilter("link", function (str) {
    return str && str.replace(/\[\[(.*?\|.*?)\]\]/g, function (match, p1) {
      const [fileLink, linkTitle] = p1.split("|");
      return getAnchorLink(fileLink, linkTitle);
    });
  });

  eleventyConfig.addFilter("taggify", function (str) {
    return str && str.replace(tagRegex, function (match, precede, tag) {
      return `${precede}<a class="tag" onclick="toggleTagSearch(this)" data-content="${tag}">${tag}</a>`;
    });
  });

  eleventyConfig.addFilter("searchableTags", function (str) {
    let tags = str && str.match(tagRegex);
    if (tags) {
      return tags.map((m) => `"${m.split("#")[1]}"`).join(", ") + ",";
    }
    return "";
  });

  eleventyConfig.addFilter("validJson", function (variable) {
    if (Array.isArray(variable)) {
      return variable.map((x) => x.replaceAll("\\", "\\\\")).join(",");
    } else if (typeof variable === "string") {
      return variable.replaceAll("\\", "\\\\");
    }
    return variable;
  });

  eleventyConfig.addFilter("hideDataview", function (str) {
    return (
      str &&
      str.replace(/\(\S+\:\:(.*)\)/g, function (_, value) {
        return value.trim();
      })
    );
  });

  eleventyConfig.addFilter("dateToZulu", function (date) {
    try {
      return new Date(date).toISOString("dd-MM-yyyyTHH:mm:ssZ");
    } catch {
      return "";
    }
  });

  eleventyConfig.addFilter("isoDate", function (date) {
    return date && date.toISOString();
  });

  eleventyConfig.addFilter("jsonify", function (variable) {
    return JSON.stringify(variable) || '""';
  });

  // Adding the callout block transformation
  eleventyConfig.addTransform("callout-block", function (str) {
    const parsed = parse(str);
    const transformCalloutBlocks = (blockquotes = parsed.querySelectorAll("blockquote")) => {
      for (const blockquote of blockquotes) {
        transformCalloutBlocks(blockquote.querySelectorAll("blockquote"));
        let content = blockquote.innerHTML;
        let titleDiv = "", calloutType = "", isCollapsable, isCollapsed;
        const calloutMeta = /\[!([\w-]*)\|?(\s?.*)\](\+|\-){0,1}(\s?.*)/;
        if (!content.match(calloutMeta)) continue;
        content = content.replace(calloutMeta, function (metaInfoMatch, callout, metaData, collapse, title) {
          isCollapsable = Boolean(collapse);
          isCollapsed = collapse === "-";
          const titleText = title || `${callout.charAt(0).toUpperCase()}${callout.substring(1).toLowerCase()}`;
          const fold = isCollapsable ? `<div class="callout-fold"><i icon-name="chevron-down"></i></div>` : ``;
          calloutType = callout;
          titleDiv = `<div class="callout-title"><div class="callout-title-inner">${titleText}</div>${fold}</div>`;
          return "";
        });
        if (content === "\n<p>\n") content = "";
        blockquote.tagName = "div";
        blockquote.classList.add("callout", isCollapsable ? "is-collapsible" : "", isCollapsed ? "is-collapsed" : "");
        blockquote.setAttribute("data-callout", calloutType.toLowerCase());
        blockquote.innerHTML = `${titleDiv}<div class="callout-content">${content}</div>`;
      }
    };
    transformCalloutBlocks();
    return parsed.innerHTML;
  });

  // Picture element transformation
  eleventyConfig.addTransform("picture", function (str) {
    const parsed = parse(str);
    for (const imageTag of parsed.querySelectorAll(".cm-s-obsidian img")) {
      const src = imageTag.getAttribute("src");
      if (src && src.startsWith("/") && !src.endsWith(".svg")) {
        const cls = imageTag.classList.value;
        const alt = imageTag.getAttribute("alt");
        const width = imageTag.getAttribute("width") || '';
        try {
          const meta = transformImage(`./src/site${decodeURI(src)}`, cls, alt, ["(max-width: 480px)", "(max-width: 1024px)"]);
          if (meta) {
            imageTag.tagName = "picture";
            let html = `<source media="(max-width:480px)" srcset="${meta.webp[0].url}" type="image/webp" />
                        <source media="(max-width:480px)" srcset="${meta.jpeg[0].url}" />`;
            if (meta.webp[1]) {
              html += `<source media="(max-width:1920px)" srcset="${meta.webp[1].url}" type="image/webp" />`;
            }
            if (meta.jpeg[1]) {
              html += `<source media="(max-width:1920px)" srcset="${meta.jpeg[1].url}" />`;
            }
            html += `<img class="${cls}" src="${src}" alt="${alt}" width="${width}" />`;
            imageTag.innerHTML = html;
          }
        } catch {}
      }
    }
    return parsed.innerHTML;
  });

  // Minifying HTML for production
  eleventyConfig.addTransform("htmlMinifier", (content, outputPath) => {
    if ((process.env.NODE_ENV === "production" || process.env.ELEVENTY_ENV === "prod") && outputPath.endsWith(".html")) {
      return htmlMinifier.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        preserveLineBreaks: true,
        minifyCSS: true,
        minifyJS: true,
        keepClosingSlash: true,
      });
    }
    return content;
  });

  eleventyConfig.addTransform("table", function (str) {
    const parsed = parse(str);
    for (const t of parsed.querySelectorAll(".cm-s-obsidian > table")) {
      t.tagName = "div";
      t.classList.add("table-wrapper");
      t.innerHTML = `<table>${t.innerHTML}</table>`;
    }

    for (const t of parsed.querySelectorAll(".cm-s-obsidian > .block-language-dataview > table")) {
      t.classList.add("dataview");
      t.classList.add("table-view-table");
      t.querySelector("thead")?.classList.add("table-view-thead");
      t.querySelector("tbody")?.classList.add("table-view-tbody");
      t.querySelectorAll("thead > tr")?.forEach((tr) => tr.classList.add("table-view-tr-header"));
      t.querySelectorAll("thead > tr > th")?.forEach((th) => th.classList.add("table-view-th"));
    }
    return parsed.innerHTML;
  });

  eleventyConfig.addPassthroughCopy("src/site/img");
  eleventyConfig.addPassthroughCopy("src/site/scripts");
  eleventyConfig.addPassthroughCopy("src/site/styles/_theme.*.css");
  eleventyConfig.addPlugin(faviconsPlugin, { outputDir: "dist" });
  eleventyConfig.addPlugin(tocPlugin, { ul: true, tags: ["h1", "h2", "h3", "h4", "h5", "h6"] });

  eleventyConfig.addPlugin(pluginRss, {
    posthtmlRenderOptions: {
      closingSingleTag: "slash",
      singleTags: ["link"],
    },
  });

  userEleventySetup(eleventyConfig);

  return {
    dir: {
      input: "src/site",
      output: "dist",
      data: `_data`,
    },
    templateFormats: ["njk", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false,
    passthroughFileCopy: true,
  };
};