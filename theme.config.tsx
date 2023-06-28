import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import { Head } from "./components/Head";
import { useNextSeoProps } from "./config/useNextSeoProps";
import { Logo } from "./components/Logo";

const config: DocsThemeConfig = {
  logo: <Logo />,
  project: {
    link: "https://github.com/fe-book-study-kr/nextjs-docs-study",
  },
  docsRepositoryBase:
    "https://github.com/fe-book-study-kr/nextjs-docs-study/blob/main",
  footer: {
    text: "Made by Dahoon bok",
  },
  head: Head,
  feedback: {
    content: () => <>Question? Give me feedback →</>,
    labels: "feedback",
  },
  useNextSeoProps,
  i18n: [],
};

export default config;
