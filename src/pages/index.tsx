import Head from "next/head";
import { Inter } from "next/font/google";
import Hero from "../../components/hero";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <>
      <Head>
        <title>Wellington.govt.nz accessibility report</title>
        <meta
          property="og:title"
          content="Wellington.govt.nz accessibility report"
          key="title"
        />
        <meta
          property="twitter:title"
          content="Wellington.govt.nz accessibility report"
        />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#ffffff" />
        <meta
          name="theme-color"
          content="#000000"
          media="(prefers-color-scheme: dark)"
        />
        <meta
          property="description"
          content="See the latest Axe report and track outstanding accessibility issues."
        />
        <meta
          property="og:description"
          content="See the latest Axe report and track outstanding accessibility issues."
        />
        <meta
          property="twitter:description"
          content="See the latest Axe report and track outstanding accessibility issues."
        />
        <meta property="og:url" content="https://wellington-axe.vercel.app" />
        <meta property="og:image" content="og.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:image" content="og.png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="favicon-16x16.png"
        />
        <link rel="manifest" href="site.webmanifest" />
      </Head>
      <main
        className={`bg-dotted-spacing-4 bg-dotted-gray-200 flex min-h-screen flex-col items-center justify-between p-12 ${inter.className}`}
      >
        <Hero />
      </main>
    </>
  );
}
