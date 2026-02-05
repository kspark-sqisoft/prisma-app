import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { inspect } from "util";

// Prisma 클라이언트 설정 및 SQL 쿼리 로깅

// ANSI 색상 코드 (콘솔 출력용)
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

// 전역 Prisma 인스턴스 (개발 환경에서 재사용)
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// PostgreSQL 어댑터 설정
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Prisma 클라이언트 인스턴스 생성
const basePrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    // 개발 환경에서만 쿼리 로깅 활성화
    log: process.env.NODE_ENV !== "production" ? [
      {
        emit: "event",
        level: "query",
      },
    ] : [],
  });

if (process.env.NODE_ENV !== "production") {
  // 쿼리 이벤트 리스너 등록 (인스턴스 생성 후에만 등록)
  if (!globalForPrisma.prisma) {
    // SQL 쿼리 실행 시 로깅
    basePrisma.$on("query" as never, (e: { query: string; params: string; duration: number; target: string }) => {
      console.log(`\n${colors.cyan}${colors.bright}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
      console.log(`${colors.cyan}${colors.bright}║${colors.reset} ${colors.yellow}${colors.bright}Prisma Query${colors.reset} ${colors.cyan}${colors.bright}                                    ║${colors.reset}`);
      console.log(`${colors.cyan}${colors.bright}╠═══════════════════════════════════════════════════════════╣${colors.reset}`);
      console.log(`${colors.cyan}${colors.bright}║${colors.reset} ${colors.blue}Query:${colors.reset} ${colors.white}${e.query}${colors.reset}`);
      console.log(`${colors.cyan}${colors.bright}║${colors.reset} ${colors.blue}Params:${colors.reset} ${colors.gray}${e.params}${colors.reset}`);
      console.log(`${colors.cyan}${colors.bright}║${colors.reset} ${colors.blue}Duration:${colors.reset} ${colors.green}${e.duration}ms${colors.reset}`);
      console.log(`${colors.cyan}${colors.bright}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
    });
  }
  globalForPrisma.prisma = basePrisma;
}

// Prisma Extension으로 쿼리 결과 로깅
const prisma = process.env.NODE_ENV !== "production"
  ? basePrisma.$extends({
      query: {
        $allModels: {
          // 모든 모델의 모든 작업에 대해 결과 로깅
          async $allOperations({ operation, model, args, query }: {
            operation: string;
            model: string;
            args: unknown;
            query: (args: unknown) => Promise<unknown>;
          }) {
            const result = await query(args);
            console.log(`\n${colors.magenta}${colors.bright}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
            console.log(`${colors.magenta}${colors.bright}║${colors.reset} ${colors.yellow}${colors.bright}Query Result${colors.reset} ${colors.magenta}${colors.bright}(${colors.cyan}${model}.${operation}${colors.magenta}${colors.bright})${colors.reset} ${colors.magenta}${colors.bright}                      ║${colors.reset}`);
            console.log(`${colors.magenta}${colors.bright}╠═══════════════════════════════════════════════════════════╣${colors.reset}`);
            console.log(inspect(result, { depth: null, colors: true, compact: false }));
            console.log(`${colors.magenta}${colors.bright}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
            return result;
          },
        },
      },
    })
  : basePrisma;

export default prisma as typeof basePrisma;
