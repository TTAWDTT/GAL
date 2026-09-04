import type { GetStaticPaths, GetStaticProps } from "next";

import { DocumentLayout } from "@/components/document-layout";
import { SiteHeader } from "@/components/site-header";
import { getDirectoryTree, getDocument, getDocuments, type DirectoryNode, type Document } from "@/lib/docs";

type DocumentPageProps = { document: Document; tree: DirectoryNode };

export default function DocumentPage({ document, tree }: DocumentPageProps) {
  return (
    <>
      <SiteHeader />
      <DocumentLayout activeSlug={document.slug} headings={document.headings} tree={tree}>
        <article className="document-page">
          <p className="document-breadcrumb">GAL / {document.relativePath}</p>
          <h1>{document.title}</h1>
          <div className="document-content" dangerouslySetInnerHTML={{ __html: document.html }} />
        </article>
      </DocumentLayout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getDocuments().map((document) => ({ params: { slug: document.segments } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<DocumentPageProps> = async ({ params }) => {
  const segments = params?.slug;
  const slug = Array.isArray(segments) ? segments.join("/") : String(segments || "");

  return { props: { document: getDocument(slug), tree: getDirectoryTree() } };
};
