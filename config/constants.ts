export const description = "Next.js 공식 문서 스터디를 위한 페이지입니다.";

const isProduction = process.env.NODE_ENV === "production";
export const assetPrefix = isProduction ? "/nextjs-docs-study" : "";
