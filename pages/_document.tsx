import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  const assetPrefix = process.env.NODE_ENV === "production" ? "/GAL" : "";

  return (
    <Html lang="zh-CN">
      <Head>
        <link href={`${assetPrefix}/avatar.png`} rel="icon" type="image/png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
