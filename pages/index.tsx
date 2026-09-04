import type { GetStaticProps } from "next";

import Link from "next/link";
import Image from "next/image";

import { DocumentLayout } from "@/components/document-layout";
import { SiteHeader } from "@/components/site-header";
import { getDirectoryTree, getDocuments, type DirectoryNode, type DocumentMeta } from "@/lib/docs";

export default function HomePage({ documents, tree }: { documents: DocumentMeta[]; tree: DirectoryNode }) {
  const assetPrefix = process.env.NODE_ENV === "production" ? "/GAL" : "";

  return (
    <>
      <SiteHeader />
      <DocumentLayout activeSlug="" tree={tree}>
        <section className="home-page">
          <div className="home-page__hero">
            <div className="home-page__copy">
              <p className="eyebrow">Girl and Love</p>
              <h1>GAL</h1>
              <p className="home-page__lead">
                此博客纯属像我这样的性压抑的产物。
              </p>
              <p className="home-page__note">当成臆想症就好。</p>
              <Link className="home-page__link" href="#latest">
                读最新文章 <span aria-hidden="true">↘</span>
              </Link>
            </div>
            <div className="home-page__portrait-wrap">
              <Image
                alt="GAL 的头像"
                className="home-page__portrait"
                height={640}
                priority
                src={`${assetPrefix}/avatar.png`}
                unoptimized
                width={520}
              />
              <span className="home-page__portrait-caption">感觉有点阴所以放个遗照</span>
            </div>
          </div>

          <div className="home-page__rule" />
          <section className="home-page__latest" id="latest">
            <div className="home-page__section-heading">
              <p className="eyebrow">Latest writing</p>
              <h2>最新文章</h2>
            </div>
            {documents.length ? (
              <ul className="home-document-list">
                {documents.map((document) => (
                  <li key={document.slug}>
                    <Link href={`/doc/${document.slug}`}>
                      <span>{document.title}</span>
                      <small>
                        {document.relativePath}
                        {document.date ? ` · ${document.date}` : ""}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="home-page__empty">
                <span>01</span>
                <p>第一篇文章还没有出现。</p>
                <small>等我把想说的话，慢慢写下来。</small>
              </div>
            )}
          </section>
        </section>
      </DocumentLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => ({
  props: { documents: getDocuments(), tree: getDirectoryTree() },
});
