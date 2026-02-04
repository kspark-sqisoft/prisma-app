import prisma from "@/lib/prisma";

export default async function Home() {
  const users = await prisma.user.findMany({
    include: {
      posts: {
        include: {
          comments: true,
        },
      },
    },
  });

  console.dir(users, { depth: null });

  console.log(users);
  return <div>Hello Prisma</div>;
}
