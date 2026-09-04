import type { AppProps } from "next/app";
import localFont from "next/font/local";
import Head from "next/head";

import "katex/dist/katex.min.css";
import "@/styles/globals.css";

const lxgwWenKai = localFont({
  src: "../public/fonts/LXGWWenKai-Regular.ttf",
  variable: "--font-lxgw-wenkai",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`gal-font-scope ${lxgwWenKai.variable}`}>
      <Head>
        <title>GAL | Girl and Love</title>
        <meta content="Girl and Love，一个记录女孩、爱与心事的私人博客。" name="description" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
      </Head>
      <Component {...pageProps} />
    </div>
  );
}
