## getStaticPaths

Dynamic Route에서 `getStaticProps`를 사용할 경우 정적으로 생성할 경로 목록을 정의해야함

getStaticPaths에 지정된 모든 경로를 정적으로 pre-render

```tsx filename="pages/repo/[name].tsx" switcher
import type {
  InferGetStaticPropsType,
  GetStaticProps,
  GetStaticPaths,
} from "next";

type Repo = {
  name: string;
  stargazers_count: number;
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      {
        params: {
          name: "next.js",
        },
      }, // See the "paths" section below
    ],
    fallback: true, // false or "blocking"
  };
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

### When should I use getStaticPaths?

- 데이터가 헤드리스 CMS에서 가져온 경우
- 데이터가 데이터베이스에서 오는 경우
- 파일 시스템에서 데이터를 가져오는 경우
- 데이터가 공개적으로 캐시될 수 있는 경우(사용자별이 아님)
- 페이지가 사전 렌더링되어야 하며(SEO를 위해) 매우 빨라야 합니다. getStaticProps는 HTML 및 JSON 파일을 생성하며, 이 두 파일은 성능을 위해 CDN에서 캐싱할 수 있습니다.

### When does getStaticPaths run

`getStaticPaths`는 프로덕션 환경에서 빌드 중에만 실행되며 런타임 중에는 호출되지 않습니다. [next code elimination](https://next-code-elimination.vercel.app/) 사용하면 클라이언트 측 번들에서 getStaticPaths 내부에 작성된 코드가 제거되었는지 확인할 수 있습니다.

### How does getStaticProps run with regards to getStaticPaths

- 빌드 중에 반환된 모든 경로에 대해 `next build` 중에 `getStaticProps`를 실행
- `fallback: true` 사용 시 백그라운드에서 getStaticProps 실행
- `fallback: blocking` 사용 시 초기 렌더링 전에 getStaticProps가 호출됨

#### getStaticPaths의 `fallback`

- 빌드 타임에 생성해놓지 않은 path로 요청이 들어온 경우 어떻게 할지를 정하는 옵션
- `false`
  - `getStaticPaths`가 반환하지 않은 모든 path에 대해서 404 페이지를 반환한다.
- `true`

  - `getStaticPaths`가 반환하지 않은 모든 path에 대해서 404 페이지를 반환하지 않고, 페이지의 `"fallback"` 버전을 먼저 보여준다
  - 백그라운드에서 Next js가 요청된 path에 대해서 `getStaticProps`를 호출하여 HTML 파일과 JSON 파일을 만들어낸다
  - 백그라운드 작업이 끝나면, 요청된 path에 해당하는 JSON 파일을 받아서 새롭게 페이지를 렌더링한다. 사용자 입장에서는 `[ fallback → 전체 페이지 ]`와 같은 순서로 화면이 변하게된다.
  - 새롭게 생성된 페이지를 기존의 빌드 시 프리렌더링 된 페이지 리스트에 추가한다. 같은 path로 온 이후 요청들에 대해서는 이때 생성한 페이지를 반환하게 된다.
  - `"fallback"` 상태일 때 보여줄 화면은 `next/router`의 `router.isFallback` 값 체크를 통해서 조건 분기하면 된다. 이때 페이지 컴포넌트는 props로 빈값을 받게된다.

  ```tsx filename="pages/posts/[id].js" switcher
  import { useRouter } from "next/router";

  function Post({ post }) {
    const router = useRouter();

    // If the page is not yet generated, this will be displayed
    // initially until getStaticProps() finishes running
    if (router.isFallback) {
      return <div>Loading...</div>;
    }

    // Render post...
  }
  ```

  - 데이터에 의존하는 정적 페이지를 많이 가지고 있으나, 빌드 시에 모든 페이지를 생성하는건 너무나 큰 작업일 때, 몇몇 페이지들만 정적으로 생성하게 하고, `fallback` 옵션을 `true`로 설정해주면 이후 요청이 오는 것에 따라서 정적 페이지들을 추가하게 된다
    → 빌드 시간도 단축하고, 대부분 사용자들의 응답 속도도 단축할 수 있다

- `blocking`
  - `true` 동작 과정에서 `fallback` 페이지를 보여주지 않음. 그 외 동작은 동일.

### Where can I use getStaticPaths

- `getStaticPaths`는 `getStaticProps`와 함께 사용해야 함
- `getStaticPaths`는 `getServerSideProps`와 함께 사용할 수 없음
- 페이지가 아닌 파일(예: 컴포넌트 폴더)에서는 사용할 수 없음
- 페이지 컴포넌트의 프로퍼티가 아닌 독립형 함수로 `getStaticPaths`를 export해야 함

### Runs on every request in development

`next dev` 실행에서는 요청마다 `getStaticPaths`가 실행됨

- 사실상 SSR로 동작하기 때문에 SSG의 정확한 테스트를 위해선 `next build` 후 `next start`로 실행해야 함

### Generating paths on-demand

빌드 중에 더 많은 페이지를 생성하면 빌드 속도가 느려집니다.

경로에 대한 빈 배열을 반환하여 모든 페이지의 온디맨드 생성을 연기할 수 있습니다. 이 기능은 특히 Next.js 애플리케이션을 여러 환경에 배포할 때 유용할 수 있습니다.

예를 들어 모든 페이지를 미리 보기용으로 온디맨드 생성하여 빌드 속도를 높일 수 있습니다(프로덕션 빌드는 제외). 이는 수백/수천 개의 정적 페이지가 있는 사이트에 유용합니다.

```tsx filename="pages/posts/[id].js" switcher
export async function getStaticPaths() {
  // When this is true (in preview environments) don't
  // prerender any static pages
  // (faster builds, but slower initial page load)
  if (process.env.SKIP_BUILD_STATIC_GENERATION) {
    return {
      paths: [],
      fallback: "blocking",
    };
  }

  // Call an external API endpoint to get posts
  const res = await fetch("https://.../posts");
  const posts = await res.json();

  // Get the paths we want to prerender based on posts
  // In production environments, prerender all pages
  // (slower builds, but faster initial page load)
  const paths = posts.map((post) => ({
    params: { id: post.id },
  }));

  // { fallback: false } means other routes should 404
  return { paths, fallback: false };
}
```
