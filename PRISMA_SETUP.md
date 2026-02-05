# Prisma 설정 가이드

이 문서는 Next.js 프로젝트에서 Prisma ORM을 설정하는 방법을 설명합니다.

> 참고: [Prisma 공식 문서 - Next.js 가이드](https://www.prisma.io/docs/guides/nextjs)

---

## 목차

1. [Prisma 라이브러리 설치](#1-prisma-라이브러리-설치)
2. [Prisma 프로젝트 초기화](#2-prisma-프로젝트-초기화)
3. [스키마 정의](#3-스키마-정의)
4. [마이그레이션 실행](#4-마이그레이션-실행)
5. [Prisma Client 생성](#5-prisma-client-생성)
6. [Prisma Client 설정](#6-prisma-client-설정)
7. [Seed 데이터 설정](#7-seed-데이터-설정)

---

## 1. Prisma 라이브러리 설치

### 개발 의존성 설치

```bash
bun add prisma tsx @types/pg --save-dev
```

- `prisma`: Prisma CLI 도구
- `tsx`: TypeScript 실행 도구 (seed 파일 실행용)
- `@types/pg`: PostgreSQL 타입 정의

### 프로덕션 의존성 설치

```bash
bun add @prisma/client @prisma/adapter-pg dotenv pg
```

- `@prisma/client`: Prisma Client 라이브러리
- `@prisma/adapter-pg`: PostgreSQL 어댑터
- `dotenv`: 환경변수 관리
- `pg`: PostgreSQL 드라이버

> **참고**: 다른 데이터베이스(MySQL, SQL Server, SQLite)를 사용하는 경우 해당 어댑터 패키지를 설치하세요. 자세한 내용은 [Database drivers](https://www.prisma.io/docs/orm/overview/databases/database-drivers) 문서를 참고하세요.

---

## 2. Prisma 프로젝트 초기화

### 명령어

```bash
bunx prisma init --db --output ../app/generated/prisma
```

### 동작 방식

#### `prisma init`
- Prisma 프로젝트를 초기화합니다
- `prisma/` 폴더를 생성합니다
- 기본 `schema.prisma` 파일을 생성합니다

#### `--db` 플래그
- 데이터베이스 연결을 설정합니다
- `schema.prisma`에 `datasource db` 블록을 추가합니다
- `.env` 파일에 `DATABASE_URL` 환경변수를 추가합니다 (없는 경우)

#### `--output ../app/generated/prisma` 플래그
- Prisma Client의 출력 경로를 지정합니다
- `schema.prisma`의 `generator client` 블록에 `output` 설정을 추가합니다

### 생성되는 파일

```
프로젝트 루트/
├── prisma/
│   └── schema.prisma          # Prisma 스키마 파일
├── prisma.config.ts            # Prisma 설정 파일
└── .env                        # DATABASE_URL 환경변수
```

> **참고**: `app/generated/prisma` 디렉토리는 `prisma generate` 또는 `prisma migrate dev` 실행 시 자동으로 생성됩니다.

---

## 3. 스키마 정의

`prisma/schema.prisma` 파일에서 데이터베이스 모델을 정의합니다.

### 기본 구조

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// 모델 정의
model User {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}
```

### 현재 프로젝트의 스키마 예시

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}

model Post {
  id       Int       @id @default(autoincrement())
  title    String
  userId   Int
  user     User      @relation(fields: [userId], references: [id])
  comments Comment[]
  tags     PostTag[] // 다대다 (explicit)
}

model Comment {
  id      Int    @id @default(autoincrement())
  content String
  postId  Int
  post    Post   @relation(fields: [postId], references: [id])
}

model Tag {
  id    Int       @id @default(autoincrement())
  name  String    @unique
  posts PostTag[] // 다대다 (explicit)
}

// Post와 Tag의 중간 테이블 (explicit many-to-many)
model PostTag {
  postId Int
  tagId  Int
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId]) // 복합 기본 키
  @@index([postId])
  @@index([tagId])
}
```

### 관계 타입

- **일대다 (One-to-Many)**: `User` ↔ `Post`
- **다대다 (Many-to-Many)**: `Post` ↔ `Tag` (explicit, `PostTag` 중간 테이블 사용)

---

## 4. 마이그레이션 실행

스키마를 변경한 후 데이터베이스에 테이블을 생성/수정하려면 마이그레이션을 실행합니다.

### 개발 환경

```bash
bunx prisma migrate dev --name 마이그레이션_이름
```

예시:
```bash
bunx prisma migrate dev --name init
```

### 동작 방식

1. **스키마 변경사항 감지**: `prisma/schema.prisma` 파일의 변경사항을 분석합니다
2. **SQL 마이그레이션 파일 생성**: `prisma/migrations/` 폴더에 SQL 파일을 생성합니다
3. **데이터베이스에 적용**: Neon DB(또는 설정된 데이터베이스)에 마이그레이션을 적용합니다
4. **Prisma Client 자동 생성**: `bunx prisma generate`를 자동으로 실행합니다

### 프로덕션 환경

기존 마이그레이션만 적용하려면:

```bash
bunx prisma migrate deploy
```

> **주의**: `migrate deploy`는 새로운 마이그레이션 파일을 생성하지 않습니다. 기존 마이그레이션만 적용합니다.

### 마이그레이션 상태 확인

```bash
bunx prisma migrate status
```

---

## 5. Prisma Client 생성

### 명령어

```bash
bunx prisma generate
```

### 동작 방식

1. `prisma/schema.prisma` 파일을 읽습니다
2. 스키마의 모델(`User`, `Post`, `Comment`, `Tag`, `PostTag`)을 기반으로 TypeScript 타입과 Prisma Client 코드를 생성합니다
3. 생성된 파일을 `app/generated/prisma/` 디렉토리에 저장합니다

### 언제 실행해야 하나요?

- ✅ 스키마를 변경한 후 (모델 추가/수정/삭제)
- ✅ `prisma migrate dev` 실행 시 **자동으로 실행됩니다**
- ✅ 수동으로 실행하려면: `bunx prisma generate`

### 생성되는 파일들

```
app/generated/prisma/
├── client.ts              # Prisma Client 메인 파일
├── models/
│   ├── User.ts           # User 모델 타입 정의
│   ├── Post.ts           # Post 모델 타입 정의
│   ├── Comment.ts        # Comment 모델 타입 정의
│   ├── Tag.ts            # Tag 모델 타입 정의
│   └── PostTag.ts        # PostTag 모델 타입 정의
├── enums.ts              # 열거형 타입
└── ...                   # 기타 유틸리티 파일들
```

---

## 6. Prisma Client 설정

프로젝트 루트에 `lib/prisma.ts` 파일을 생성하여 Prisma Client 인스턴스를 설정합니다.

### 파일 생성

```bash
mkdir -p lib && touch lib/prisma.ts
```

### 기본 설정 예시

```typescript
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### 주요 설정 사항

1. **전역 인스턴스 재사용**: 개발 환경에서 Hot Reload 시 여러 인스턴스가 생성되는 것을 방지합니다
2. **PostgreSQL 어댑터**: `@prisma/adapter-pg`를 사용하여 Neon DB와 연결합니다
3. **환경변수**: `DATABASE_URL`을 통해 데이터베이스 연결 정보를 가져옵니다

### 사용 예시

```typescript
import prisma from "@/lib/prisma";

// 모든 포스트 조회
const posts = await prisma.post.findMany({
  include: {
    user: true,
    comments: true,
    tags: {
      include: {
        tag: true,
      },
    },
  },
});

// 새 포스트 생성
const newPost = await prisma.post.create({
  data: {
    title: "새 포스트",
    userId: 1,
  },
});
```

---

## 7. Seed 데이터 설정

초기 데이터를 데이터베이스에 삽입하려면 seed 파일을 설정합니다.

### Seed 파일 생성

`prisma/seed.ts` 파일을 생성합니다:

```typescript
import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const userData: Prisma.UserCreateInput[] = [
  {
    name: "철수",
    posts: {
      create: [
        {
          title: "철수의 첫 번째 글",
          comments: {
            create: [
              { content: "첫 번째 댓글!" },
              { content: "좋은 글이네요!" },
            ],
          },
        },
      ],
    },
  },
  {
    name: "영희",
    posts: {
      create: [
        {
          title: "영희의 첫 번째 글",
          comments: {
            create: [{ content: "영희 글에 댓글!" }],
          },
        },
      ],
    },
  },
];

export async function main() {
  console.log("🌱 Seed 시작...");

  // 기존 데이터 삭제 (관계 순서 중요)
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ 기존 데이터 삭제 완료");

  // 데이터 삽입
  for (const u of userData) {
    await prisma.user.create({
      data: u,
    });
  }

  console.log("✅ Seed 데이터 삽입 완료!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### prisma.config.ts 설정

`prisma.config.ts` 파일에 seed 설정을 추가합니다:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: `tsx prisma/seed.ts`, // Seed 스크립트 경로
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

### Seed 실행

```bash
bunx prisma db seed
```

---

## 전체 프로세스 요약

### 새 프로젝트 설정

```bash
# 1. 의존성 설치
bun add prisma tsx @types/pg --save-dev
bun add @prisma/client @prisma/adapter-pg dotenv pg

# 2. Prisma 초기화
bunx prisma init --db --output ../app/generated/prisma

# 3. 스키마 정의 (prisma/schema.prisma 파일 편집)

# 4. 마이그레이션 생성 및 적용
bunx prisma migrate dev --name init

# 5. (선택) Seed 데이터 삽입
bunx prisma db seed
```

### 스키마 변경 후

```bash
# 1. 스키마 수정 (prisma/schema.prisma 파일 편집)

# 2. 마이그레이션 생성 및 적용
bunx prisma migrate dev --name 변경사항_설명

# 3. (선택) Prisma Client만 다시 생성하고 싶을 때
bunx prisma generate
```

---

## 유용한 명령어

### Prisma Studio 실행

데이터베이스를 시각적으로 관리할 수 있는 GUI 도구:

```bash
bunx prisma studio
```

브라우저에서 `http://localhost:5555`로 접속하여 데이터를 확인하고 수정할 수 있습니다.

### 마이그레이션 상태 확인

```bash
bunx prisma migrate status
```

### 데이터베이스 리셋 (주의!)

모든 데이터를 삭제하고 마이그레이션을 처음부터 다시 적용:

```bash
bunx prisma migrate reset
```

> **주의**: 이 명령어는 모든 데이터를 삭제합니다. 프로덕션 환경에서는 사용하지 마세요!

---

## 참고 자료

- [Prisma 공식 문서](https://www.prisma.io/docs)
- [Prisma Next.js 가이드](https://www.prisma.io/docs/guides/nextjs)
- [Prisma Client API 레퍼런스](https://www.prisma.io/docs/orm/prisma-client)
- [Prisma Schema 레퍼런스](https://www.prisma.io/docs/orm/prisma-schema)

---

## 문제 해결

### 마이그레이션 오류

마이그레이션 파일이 수정된 경우:

```bash
# 마이그레이션 상태 확인
bunx prisma migrate status

# 필요시 마이그레이션 재적용
bunx prisma migrate deploy
```

### Prisma Client 타입 오류

스키마를 변경한 후 Prisma Client를 다시 생성:

```bash
bunx prisma generate
```

### 데이터베이스 연결 오류

`.env` 파일의 `DATABASE_URL`이 올바른지 확인:

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

---

**마지막 업데이트**: 2025년 2월
