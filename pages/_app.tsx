import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Nanolist</title>
        <meta
          name="description"
          content="A browsable, community-curated directory of AI tools — with a bias toward open-source, local-first, privacy-respecting software. By the Nano Collective."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
