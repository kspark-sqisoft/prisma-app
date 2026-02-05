import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { inspect } from "util";

// ANSI 색상 코드
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

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const basePrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV !== "production" ? [
      {
        emit: "event",
        level: "query",
      },
    ] : [],
  });

if (process.env.NODE_ENV !== "production") {
  // 이벤트 리스너는 인스턴스 생성 후에 등록해야 함
  if (!globalForPrisma.prisma) {
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

// Extension을 사용하여 결과를 로깅
const prisma = process.env.NODE_ENV !== "production"
  ? basePrisma.$extends({
      query: {
        $allModels: {
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
