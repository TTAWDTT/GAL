import fs from "node:fs";
import path from "node:path";

import katex from "katex";

export type Heading = {
  id: string;
  level: 2 | 3;
  text: string;
};

export type DocumentMeta = {
  slug: string;
  segments: string[];
  title: string;
  relativePath: string;
  date?: string;
};

export type Document = DocumentMeta & {
  html: string;
  headings: Heading[];
};

export type DirectoryNode = {
  kind: "directory";
  name: string;
  path: string;
  children: Array<DirectoryNode | FileNode>;
};

export type FileNode = {
  kind: "file";
  name: string;
  path: string;
  title: string;
  slug: string;
  date?: string;
};

const contentDirectory = path.join(process.cwd(), "content");
const assetPrefix = process.env.NODE_ENV === "production" ? "/GAL" : "";

type MarkdownFile = { filePath: string; relativePath: string };

function readMarkdownFiles(
  directory = contentDirectory,
  prefix: string[] = [],
): MarkdownFile[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    const segments = [...prefix, entry.name];

    if (entry.isDirectory()) return readMarkdownFiles(entryPath, segments);
    if (
      !entry.isFile() ||
      !entry.name.toLowerCase().endsWith(".md") ||
      entry.name.toLowerCase() === "readme.md"
    ) return [];

    return [{ filePath: entryPath, relativePath: segments.join("/") }];
  });
}

function parseTitle(markdown: string, fallback: string) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || fallback;
}

function parseFrontmatter(markdown: string) {
  const match = markdown.replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return new Map<string, string>();

  return new Map(
    match[1].split(/\r?\n/).flatMap((line) => {
      const field = line.match(/^([A-Za-z][\w-]*):\s*(.*?)\s*$/);
      if (!field) return [];

      const value = field[2].replace(/^("|')(.*)\1$/, "$2").trim();
      return value ? [[field[1].toLowerCase(), value] as const] : [];
    }),
  );
}

function parseDate(markdown: string) {
  const frontmatter = parseFrontmatter(markdown);
  for (const value of [frontmatter.get("date"), frontmatter.get("time")]) {
    if (!value) continue;

    const datePart = value.match(/^(\d{4})-(\d{2})-(\d{2})(?=$|[T\s])/);
    if (!datePart) continue;

    const year = Number(datePart[1]);
    const month = Number(datePart[2]);
    const day = Number(datePart[3]);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth) continue;
    if (Number.isNaN(Date.parse(value))) continue;

    return value;
  }

  return undefined;
}

function compareDates(
  a: { date?: string; relativePath?: string; path?: string },
  b: { date?: string; relativePath?: string; path?: string },
) {
  const aTime = a.date ? Date.parse(a.date) : Number.NaN;
  const bTime = b.date ? Date.parse(b.date) : Number.NaN;

  if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) return bTime - aTime;
  if (!Number.isNaN(aTime) && Number.isNaN(bTime)) return -1;
  if (Number.isNaN(aTime) && !Number.isNaN(bTime)) return 1;
  return (a.relativePath || a.path || "").localeCompare(b.relativePath || b.path || "", "zh-CN");
}

function slugFor(relativePath: string) {
  return relativePath.replace(/\.md$/i, "");
}

function toSegments(slug: string) {
  return slug.split("/").filter(Boolean);
}

export function getDocuments(): DocumentMeta[] {
  return readMarkdownFiles()
    .map(({ filePath, relativePath }) => {
      const slug = slugFor(relativePath);
      const markdown = fs.readFileSync(filePath, "utf8");
      const date = parseDate(markdown);

      return {
        slug,
        segments: toSegments(slug),
        title: parseTitle(markdown, path.basename(slug)),
        relativePath,
        ...(date ? { date } : {}),
      };
    })
    .sort(compareDates);
}

export function getDocument(slug: string) {
  const safeSlug = slug.replace(/[\\]/g, "");
  const filePath = path.join(contentDirectory, `${safeSlug}.md`);

  if (
    safeSlug.includes("..") ||
    !filePath.startsWith(`${contentDirectory}${path.sep}`) ||
    !fs.existsSync(filePath)
  ) {
    throw new Error(`Document not found: ${slug}`);
  }

  const markdown = fs.readFileSync(filePath, "utf8");
  const meta = getDocuments().find((document) => document.slug === safeSlug);

  if (!meta) throw new Error(`Document not found: ${slug}`);

  const rendered = renderMarkdown(stripTitle(markdown));

  return { ...meta, ...rendered } satisfies Document;
}

export function getDirectoryTree(documents = getDocuments()): DirectoryNode {
  const root: DirectoryNode = {
    kind: "directory",
    name: "GAL",
    path: "",
    children: [],
  };

  for (const document of documents) {
    let current = root;
    const parts = document.segments;
    const fileName = parts.at(-1) || document.title;

    for (const segment of parts.slice(0, -1)) {
      let directory = current.children.find(
        (child): child is DirectoryNode =>
          child.kind === "directory" && child.name === segment,
      );

      if (!directory) {
        directory = {
          kind: "directory",
          name: segment,
          path: [...current.path.split("/").filter(Boolean), segment].join("/"),
          children: [],
        };
        current.children.push(directory);
      }

      current = directory;
    }

    current.children.push({
      kind: "file",
      name: fileName,
      path: document.relativePath,
      title: document.title,
      slug: document.slug,
      ...(document.date ? { date: document.date } : {}),
    });
  }

  const sortTree = (node: DirectoryNode) => {
    node.children.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
      if (a.kind === "file" && b.kind === "file") return compareDates(a, b);
      return a.name.localeCompare(b.name, "zh-CN");
    });
    node.children.forEach((child) => {
      if (child.kind === "directory") sortTree(child);
    });
  };

  sortTree(root);
  return root;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveAssetPath(source: string) {
  if (/^https?:\/\//i.test(source)) return source;
  if (/^\/GAL(?:\/|$)/i.test(source)) return source;

  const normalized = path.posix.normalize(`/${source.replace(/^\.\//, "")}`);
  if (normalized === "/.." || normalized.startsWith("/../")) return null;

  const encodedPath = normalized
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${assetPrefix}${encodedPath}`;
}

function stripTitle(markdown: string) {
  return markdown
    .replace(/^\uFEFF/, "")
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")
    .replace(/^#\s+.+\r?\n?/, "")
    .trimStart();
}

function renderMath(formula: string, displayMode = false) {
  return katex.renderToString(formula.trim(), {
    displayMode,
    output: "htmlAndMathml",
    strict: false,
    throwOnError: false,
    trust: false,
  });
}

function inlineMarkdown(value: string) {
  const placeholders: string[] = [];
  const addImagePlaceholder = (source: string, alt: string) => {
    const resolvedSource = resolveAssetPath(source.trim());
    if (!resolvedSource) return "";

    placeholders.push(
      `<img src="${escapeHtml(resolvedSource)}" alt="${escapeHtml(alt)}" loading="lazy" />`,
    );
    return `@@PLACEHOLDER${placeholders.length - 1}@@`;
  };

  const source = value
    .replace(/`([^`]+)`/g, (_, code) => {
      placeholders.push(`<code>${escapeHtml(code)}</code>`);
      return `@@PLACEHOLDER${placeholders.length - 1}@@`;
    })
    .replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, src, alt) =>
      addImagePlaceholder(src, (alt || src).trim()),
    )
    .replace(/\$\$([^$\n]+?)\$\$/g, (_, formula) => {
      placeholders.push(renderMath(formula, true));
      return `@@PLACEHOLDER${placeholders.length - 1}@@`;
    })
    .replace(/\$([^$\n]+?)\$/g, (_, formula) => {
      placeholders.push(renderMath(formula));
      return `@@PLACEHOLDER${placeholders.length - 1}@@`;
    });

  const escaped = escapeHtml(source)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
      return addImagePlaceholder(src.trim(), alt);
    })
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return escaped.replace(
    /@@PLACEHOLDER(\d+)@@/g,
    (_, index) => placeholders[Number(index)] || "",
  );
}

function parseTableRow(line: string) {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return null;

  let content = trimmed.replace(/^\|/, "");
  if (content.endsWith("|") && !content.endsWith("\\|")) content = content.slice(0, -1);

  const cells: string[] = [];
  let cell = "";
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === "\\" && content[index + 1] === "|") {
      cell += "|";
      index += 1;
    } else if (character === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function isTableSeparator(line: string) {
  const cells = parseTableRow(line);
  return Boolean(cells?.length && cells.every((cell) => /^:?-{3,}:?$/.test(cell)));
}

function getTableAlignment(cell: string) {
  if (/^:-+:$/.test(cell)) return "center";
  if (/^-+:$/.test(cell)) return "right";
  if (/^:-+$/.test(cell)) return "left";
  return undefined;
}

function renderTableCell(tag: "th" | "td", cell: string, alignment?: string) {
  const attribute = alignment ? ` style="text-align:${alignment}"` : "";
  return `<${tag}${attribute}>${inlineMarkdown(cell)}</${tag}>`;
}

function renderTable(header: string[], alignments: Array<string | undefined>, rows: string[][]) {
  const headerHtml = header
    .map((cell, index) => renderTableCell("th", cell, alignments[index]))
    .join("");
  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${header.map((_, index) => renderTableCell("td", row[index] ?? "", alignments[index])).join("")}</tr>`,
    )
    .join("");

  return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

type CodeFence = { length: number; info: string };

function parseCodeFence(line: string): CodeFence | null {
  const match = line.match(/^ {0,3}(`{3,})(.*)$/);
  if (!match || match[2].includes("`")) return null;

  return { length: match[1].length, info: match[2].trim() };
}

type DisplayMathBlock = {
  closeIndex: number;
  formula: string;
  trailing: string;
};

function findDisplayMathBlock(
  lines: string[],
  startIndex: number,
  openingContent: string,
): DisplayMathBlock | null {
  const inlineClosingIndex = openingContent.indexOf("$$");
  if (inlineClosingIndex >= 0) {
    return {
      closeIndex: startIndex,
      formula: openingContent.slice(0, inlineClosingIndex),
      trailing: openingContent.slice(inlineClosingIndex + 2),
    };
  }

  const formulaLines = openingContent ? [openingContent] : [];
  let inCode = false;
  let codeFenceLength = 3;

  for (let lineIndex = startIndex + 1; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex].trimEnd();
    const fence = parseCodeFence(line);

    if (fence) {
      if (inCode) {
        if (!fence.info && fence.length >= codeFenceLength) inCode = false;
      } else {
        inCode = true;
        codeFenceLength = fence.length;
      }
      continue;
    }

    if (!inCode) {
      const closingIndex = line.indexOf("$$");
      if (closingIndex >= 0) {
        formulaLines.push(line.slice(0, closingIndex));
        return {
          closeIndex: lineIndex,
          formula: formulaLines.join("\n"),
          trailing: line.slice(closingIndex + 2),
        };
      }
    }

    formulaLines.push(lines[lineIndex]);
  }

  return null;
}

function renderMarkdown(markdown: string) {
  const html: string[] = [];
  const headings: Heading[] = [];
  const lines = markdown.replace(/^---\n[\s\S]*?\n---\n?/, "").split(/\r?\n/);
  let paragraph: string[] = [];
  let list: string[] = [];
  let listTag: "ul" | "ol" = "ul";
  let code: string[] = [];
  let inCode = false;
  let codeLanguage = "text";
  let codeFenceLength = 3;
  let headingIndex = 0;

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) html.push(`<${listTag}>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${listTag}>`);
    list = [];
  };
  const flushCode = () => {
    html.push(`<pre><code class="language-${escapeHtml(codeLanguage)}">${escapeHtml(code.join("\n"))}</code></pre>`);
    code = [];
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    const line = rawLine.trimEnd();
    const fence = parseCodeFence(line);

    if (inCode) {
      if (fence && !fence.info && fence.length >= codeFenceLength) {
        flushCode();
        inCode = false;
      } else {
        code.push(line);
      }
      continue;
    }

    if (fence) {
      flushParagraph();
      flushList();
      inCode = true;
      codeFenceLength = fence.length;
      codeLanguage = fence.info || "text";
      continue;
    }

    const displayMathStart = line.trim().match(/^\$\$(.*)$/);
    if (displayMathStart) {
      flushParagraph();
      flushList();
      const inlineFormula = displayMathStart[1];
      const displayMath = findDisplayMathBlock(lines, lineIndex, inlineFormula);
      if (displayMath) {
        html.push(renderMath(displayMath.formula, true));
        lineIndex = displayMath.closeIndex;
        if (displayMath.trailing.trim()) paragraph.push(displayMath.trailing.trim());
      } else {
        // Keep malformed input visible and continue parsing later headings, tables,
        // images, and paragraphs instead of swallowing the rest of the document.
        paragraph.push(line.trim());
      }
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = heading[2].replace(/[`*_]/g, "").trim();
      const id = `section-${++headingIndex}`;
      if (level === 2 || level === 3) headings.push({ id, level, text });
      html.push(`<h${level} id="${id}">${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const nextLine = lines[lineIndex + 1];
    if (nextLine && isTableSeparator(nextLine)) {
      const header = parseTableRow(line);
      const separator = parseTableRow(nextLine);
      if (header && separator) {
        flushParagraph();
        flushList();
        const alignments = header.map((_, index) => getTableAlignment(separator[index] || ""));
        const rows: string[][] = [];
        lineIndex += 1;

        while (lineIndex + 1 < lines.length) {
          const row = parseTableRow(lines[lineIndex + 1]);
          if (!row || !lines[lineIndex + 1].trim()) break;
          rows.push(row);
          lineIndex += 1;
        }

        html.push(renderTable(header, alignments, rows));
        continue;
      }
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextTag = ordered ? "ol" : "ul";
      if (list.length && listTag !== nextTag) flushList();
      listTag = nextTag;
      list.push((unordered || ordered)?.[1] || "");
      continue;
    }

    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  if (inCode) flushCode();
  flushParagraph();
  flushList();
  return { html: html.join("\n"), headings };
}
