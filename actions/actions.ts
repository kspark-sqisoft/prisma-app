"use server" // Next.js Server Actions 지시어

import prisma from "../lib/prisma";
import {  postSchema, commentSchema } from "../lib/validation";

// ============================================================================
// Posts 관련 Server Actions
// ============================================================================

// 모든 포스트 조회 (사용자, 댓글, 태그 포함)
export const getPosts = async (skip: number = 0, take: number = 5, searchQuery?: string) => {
  const where = searchQuery
    ? {
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" as const } },
          { user: { name: { contains: searchQuery, mode: "insensitive" as const } } },
          { tags: { some: { tag: { name: { contains: searchQuery, mode: "insensitive" as const } } } } },
        ],
      }
    : undefined;

  const posts = await prisma.post.findMany({
    skip,
    take,
    where,
    include: { 
      user: true, 
      comments: true, 
      tags: { include: { tag: true } } // PostTag를 통해 Tag 포함
    },
    orderBy: { id: "desc" }, // 최신순 정렬
  });
  
  // 검색 조건에 맞는 전체 포스트 개수 조회
  const total = await prisma.post.count({ where });
  
  return {
    posts,
    hasMore: skip + take < total,
    total,
  };
};


/* SQL 문문
SELECT
    p.id AS post_id,
    p.title AS post_title,
    u.id AS user_id,
    u.name AS user_name,
    c.id AS comment_id,
    c.content AS comment_content
FROM "Post" p
JOIN "User" u ON u.id = p."userId"
LEFT JOIN "Comment" c ON c."postId" = p.id
ORDER BY p.id DESC
*/
/* SQL로 데이터 조회
interface PostSQLRow {
  post_id: number;
  post_title: string;
  user_id: number;
  user_name: string;
  comment_id: number | null;
  comment_content: string | null;
}

export const getPosts = async () => {
  const rows = await prisma.$queryRaw<PostSQLRow[]>(
    Prisma.sql`
      SELECT
        p.id AS post_id,
        p.title AS post_title,
        u.id AS user_id,
        u.name AS user_name,
        c.id AS comment_id,
        c.content AS comment_content
      FROM "Post" p
      JOIN "User" u ON u.id = p."userId"
      LEFT JOIN "Comment" c ON c."postId" = p.id
      ORDER BY p.id DESC
    `
  );

  // SQL 결과를 Prisma 모델 형식으로 변환
  const postsMap = new Map<number, {
    id: number;
    title: string;
    userId: number;
    user: { id: number; name: string };
    comments: { id: number; content: string; postId: number }[];
  }>();

  for (const row of rows) {
    if (!postsMap.has(row.post_id)) {
      postsMap.set(row.post_id, {
        id: row.post_id,
        title: row.post_title,
        userId: row.user_id,
        user: {
          id: row.user_id,
          name: row.user_name,
        },
        comments: [],
      });
    }

    const post = postsMap.get(row.post_id)!;
    if (row.comment_id && row.comment_content) {
      post.comments.push({
        id: row.comment_id,
        content: row.comment_content,
        postId: row.post_id,
      });
    }
  }

  return Array.from(postsMap.values());
};
*/


// 특정 포스트 조회
export const getPost = async (id: number) =>{
  const post = await prisma.post.findUnique({
    where: { id },
    include: { 
      user: true, 
      comments: true, 
      tags: { include: { tag: true } } // PostTag를 통해 Tag 포함
    },
  });
  return post;
}

// 포스트 생성 (Zod 스키마로 검증)
export const createPost = async (formData: FormData) => {
  const tagNames = formData.get("tags")?.toString().split(",").map(t => t.trim()).filter(t => t.length > 0) || [];
  
  const parsed = postSchema.parse({
    title: formData.get("title"),
    userId: Number(formData.get("userId")),
    tags: tagNames.length > 0 ? tagNames : undefined,
  });

  // 태그 처리: 존재하지 않는 태그는 생성하고, 존재하는 태그는 연결
  const tagConnections = await Promise.all(
    tagNames.map(async (tagName) => {
      const existingTag = await prisma.tag.findUnique({
        where: { name: tagName },
      });
      
      if (existingTag) {
        return { id: existingTag.id };
      } else {
        const newTag = await prisma.tag.create({
          data: { name: tagName },
        });
        return { id: newTag.id };
      }
    })
  );

  return await prisma.post.create({
    data: {
      title: parsed.title,
      userId: parsed.userId,
      tags: {
        create: tagConnections.map(tag => ({ tagId: tag.id })),
      },
    },
    include: { tags: { include: { tag: true } } },
  });
};

// 포스트 수정
export const updatePost = async (id: number, title: string, userId: number, tagNames: string[] = []) => {
  // 태그 처리: 존재하지 않는 태그는 생성하고, 존재하는 태그는 연결
  const tagConnections = await Promise.all(
    tagNames.map(async (tagName) => {
      const existingTag = await prisma.tag.findUnique({
        where: { name: tagName },
      });
      
      if (existingTag) {
        return { id: existingTag.id };
      } else {
        const newTag = await prisma.tag.create({
          data: { name: tagName },
        });
        return { id: newTag.id };
      }
    })
  );

  return await prisma.post.update({
    where: { id },
    data: {
      title,
      userId,
      tags: {
        deleteMany: {}, // 기존 태그 연결 모두 제거
        create: tagConnections.map(tag => ({ tagId: tag.id })), // 새로운 태그 연결 생성
      },
    },
    include: { tags: { include: { tag: true } } },
  });
};

// 포스트 삭제 (외래 키 제약 조건 때문에 댓글 먼저 삭제)
export const deletePost = async (id: number) => {
  // 먼저 관련된 모든 댓글 삭제
  await prisma.comment.deleteMany({ where: { postId: id } });
  // 태그 연결은 자동으로 해제됨 (다대다 관계)
  // 그 다음 포스트 삭제
  return await prisma.post.delete({ where: { id } });
};

// ============================================================================
// Comments 관련 Server Actions
// ============================================================================

// 댓글 생성 (Zod 스키마로 검증)
export const createComment = async (formData: FormData) => {
  const parsed = commentSchema.parse({
    content: formData.get("content"),
    postId: Number(formData.get("postId")),
  });
  return await prisma.comment.create({ data: parsed });
};

// 댓글 수정
export const updateComment = async (id: number, content: string) =>
  await prisma.comment.update({ 
    where: { id }, 
    data: { content } 
  });

// 댓글 삭제
export const deleteComment = async (id: number) =>
  await prisma.comment.delete({ where: { id } });

// ============================================================================
// Users 관련 Server Actions
// ============================================================================

// 모든 사용자 조회
export const getUsers = async () => {
  const users = await prisma.user.findMany();
  return users;
}

// ============================================================================
// Tags 관련 Server Actions
// ============================================================================

// 모든 태그 조회
export const getTags = async () => {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });
  return tags;
};