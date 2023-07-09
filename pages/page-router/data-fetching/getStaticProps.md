## getStaticProps

- `Page`에서 `getStaticProps` 함수를 expor하면 Next.js는 빌드 시점에 `getStaticProps가` 반환한 프로퍼티를 사용하여 이 페이지를 pre-render합니다.

```tsx
import type { InferGetStaticPropsType, GetStaticProps } from "next";

type Repo = {
  name: string;
  stargazers_count: number;
};

export const getStaticProps: GetStaticProps<{
  repo: Repo;
}> = async () => {
  const res = await fetch("https://api.github.com/repos/vercel/next.js");
  const repo = await res.json();
  return { props: { repo } };
};

export default function Page({
  repo,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return repo.stargazers_count;
}
```

### When should I use getStaticProps?

- 페이지 렌더링에 필요한 데이터는 사용자 요청에 앞서 `빌드 시점`에 사용할 수 있음
- 데이터가 헤드리스 CMS에서 제공되는 경우 사용
- 페이지가 pre-render되어야 하며(SEO를 위해) 매우 빨라야 할 경우. `getStaticProps`는 HTML 및 JSON 파일을 생성하며, 이 두 파일은 성능을 위해 CDN에서 캐시할 수 있음.
- 데이터는 공개적으로 캐시될 수 있음(사용자별이 아님). 특정 상황에서는 미들웨어를 사용하여 경로를 다시 작성함으로써 이 조건을 우회할 수 있음.

### When does getStaticProps run

`getStaticProps`는 항상 서버에서 실행되며 클라이언트에서는 실행되지 않습니다. [next code elimination](https://next-code-elimination.vercel.app/)를 사용하면 클라이언트 측 번들에서 제거된 `getStaticProps` 내부에 작성된 코드의 유효성을 검사할 수 있습니다.

- `next build` 시 항상 실행
- `fallback: true` 사용 시 백그라운드에서 실행
- `fallback: blocking` 사용 시 초기 렌더링 전에 실행
- `revalidate` 사용 시 백그라운드에서 실행
- `revalidate()`을 사용할 때 백그라운드에서 온디맨드 방식으로 실행

[참고 fallback](./getStaticPaths.md#참고-fallback)

`ISR`과 함께 사용하면 오래된 페이지가 재검증되고 브라우저에 새 페이지가 제공되는 동안 `getStaticProps`가 백그라운드에서 실행됩니다.

정적 HTML을 생성하기 때문에 `getStaticProps`는 들어오는 요청(예: 쿼리 매개변수 또는 HTTP 헤더)에 액세스할 수 없습니다. 페이지에 대한 요청에 액세스해야 하는 경우 `getStaticProps`와 함께 미들웨어를 사용하는 것을 고려하세요.

### Write server-side code directly

`getStaticProps`는 서버 측에서만 실행되므로 클라이언트 측에서는 절대 실행되지 않습니다. 브라우저용 JS 번들에도 포함되지 않으므로 브라우저로 전송되지 않고 직접 데이터베이스 쿼리를 작성할 수 있습니다.

```tsx filename="lib/load-posts.js" switcher
// The following function is shared
// with getStaticProps and API routes
// from a `lib/` directory
export async function loadPosts() {
  // Call an external API endpoint to get posts
  const res = await fetch("https://.../posts/");
  const data = await res.json();

  return data;
}
```

```tsx filename="pages/blog.js" switcher
import { loadPosts } from "../lib/load-posts";

// This function runs only on the server side
export async function getStaticProps() {
  // Instead of fetching your `/api` route you can call the same
  // function directly in `getStaticProps`
  const posts = await loadPosts();

  // Props returned will be passed to the page component
  return { props: { posts } };
}
```

### Statically generates both HTML and JSON

- 빌드 시점에 `getStaticProps`가 포함된 페이지가 pre-render되면 페이지 HTML과 실행 결과를 담은 JSON 생성
- 해당 페이지로 이동하면 클라이언트에서는 `getStaticProps`를 호출하지 않고 생성된 JSON 파일이 props로 사용됨
- ISR을 사용하면 백그라운드에서 `getStaticProps`가 실행되면서 JSON 파일 재생성

### Runs on every request in development

`next dev` 실행에서는 요청마다 `getStaticProps`가 실행됨

- 사실상 SSR로 동작하기 때문에 SSG의 정확한 테스트를 위해선 `next build` 후 `next start`로 실행해야 함
