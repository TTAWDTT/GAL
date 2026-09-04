import Link from "next/link";

import type { DirectoryNode, FileNode } from "@/lib/docs";

function FileItem({ file, activeSlug }: { file: FileNode; activeSlug: string }) {
  return (
    <li>
      <Link
        className={file.slug === activeSlug ? "tree-link tree-link--active" : "tree-link"}
        href={`/doc/${file.slug}`}
      >
        <span className="tree-icon">·</span>
        <span className="tree-label">{file.title}</span>
        {file.date ? <time className="tree-date" dateTime={file.date}>{file.date}</time> : null}
      </Link>
    </li>
  );
}

function DirectoryItem({ directory, activeSlug }: { directory: DirectoryNode; activeSlug: string }) {
  return (
    <li className="tree-directory">
      <details open>
        <summary>
          <span className="tree-chevron">›</span>
          <span className="tree-label">{directory.name}</span>
        </summary>
        <ul>
          {directory.children.map((child) =>
            child.kind === "directory" ? (
              <DirectoryItem key={child.path} activeSlug={activeSlug} directory={child} />
            ) : (
              <FileItem key={child.slug} activeSlug={activeSlug} file={child} />
            ),
          )}
        </ul>
      </details>
    </li>
  );
}

export function DocumentTree({ tree, activeSlug }: { tree: DirectoryNode; activeSlug: string }) {
  if (!tree.children.length) {
    return (
      <p className="tree-empty">
        还没有文章
        <span>新的故事会从这里开始。</span>
      </p>
    );
  }

  return (
    <nav aria-label="文档目录" className="document-tree">
      <ul>
        {tree.children.map((child) =>
          child.kind === "directory" ? (
            <DirectoryItem key={child.path} activeSlug={activeSlug} directory={child} />
          ) : (
            <FileItem key={child.slug} activeSlug={activeSlug} file={child} />
          ),
        )}
      </ul>
    </nav>
  );
}
