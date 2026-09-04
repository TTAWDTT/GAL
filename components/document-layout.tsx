import type { ReactNode } from "react";

import Link from "next/link";

import { DocumentTree } from "@/components/document-tree";
import type { DirectoryNode, Heading } from "@/lib/docs";

export function DocumentLayout({
  activeSlug,
  children,
  headings = [],
  tree,
}: {
  activeSlug: string;
  children: ReactNode;
  headings?: Heading[];
  tree: DirectoryNode;
}) {
  return (
    <div className="document-layout">
      <aside className="document-sidebar">
        <div className="document-sidebar__heading">
          <Link href="/">GAL</Link>
          <span>文章目录</span>
        </div>
        <DocumentTree activeSlug={activeSlug} tree={tree} />
      </aside>

      <main className="document-main">{children}</main>

      {headings.length ? (
        <>
          <aside className="document-toc" aria-label="文章目录">
            <p>目录</p>
            <nav>
              {headings.map((heading) => (
                <a className={heading.level === 3 ? "document-toc__nested" : undefined} href={`#${heading.id}`} key={heading.id}>
                  {heading.text}
                </a>
              ))}
            </nav>
          </aside>
          <details className="document-toc-mobile">
            <summary>文章目录</summary>
            <nav aria-label="文章目录">
              {headings.map((heading) => (
                <a className={heading.level === 3 ? "document-toc__nested" : undefined} href={`#${heading.id}`} key={heading.id}>
                  {heading.text}
                </a>
              ))}
            </nav>
          </details>
        </>
      ) : null}
    </div>
  );
}
