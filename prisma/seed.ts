import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

/**
 * Neon/Postgres 연결 Adapter
 */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Prisma Client 생성
 */
const prisma = new PrismaClient({
  adapter,
});

/**
 * Seed 데이터 타입 안전하게 정의
 */
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
        {
          title: "철수의 두 번째 글",
          comments: {
            create: [{ content: "두 번째 글 댓글!" }],
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

/**
 * Seed 실행 함수
 */
export async function main() {
  console.log("🌱 Seed 시작...");

  // 기존 데이터 삭제 (관계 순서 중요)
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
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

/**
 * 실행
 */
main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
