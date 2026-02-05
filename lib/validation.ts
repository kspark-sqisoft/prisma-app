import { z } from "zod";

// User
export const userSchema = z.object({
  name: z.string().min(1),
});

// Post
export const postSchema = z.object({
  title: z.string().min(1),
  userId: z.number(),
});

// Comment
export const commentSchema = z.object({
  content: z.string().min(1),
  postId: z.number(),
});
