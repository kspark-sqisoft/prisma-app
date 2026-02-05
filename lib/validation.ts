import { z } from "zod";

// Zod 스키마 정의 (서버 액션에서 데이터 검증에 사용)

// 사용자 스키마
export const userSchema = z.object({
  name: z.string().min(1), // 이름은 최소 1글자 이상
});

// 포스트 스키마
export const postSchema = z.object({
  title: z.string().min(1), // 제목은 최소 1글자 이상
  userId: z.number(), // 작성자 ID는 숫자
});

// 댓글 스키마
export const commentSchema = z.object({
  content: z.string().min(1), // 댓글 내용은 최소 1글자 이상
  postId: z.number(), // 포스트 ID는 숫자
});
