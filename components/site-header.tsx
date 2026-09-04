import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  const assetPrefix = process.env.NODE_ENV === "production" ? "/GAL" : "";

  return (
    <header className="site-header">
      <Link className="site-header__brand" href="/">
        <Image alt="GAL 头像" className="site-header__avatar" height={36} priority src={`${assetPrefix}/avatar.png`} unoptimized width={36} />
        <span>GAL</span>
      </Link>
      <p>girl and love / personal archive</p>
      <a href="https://github.com/TTAWDTT/GAL" rel="noreferrer" target="_blank">
        <span>GitHub</span>
        <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}
