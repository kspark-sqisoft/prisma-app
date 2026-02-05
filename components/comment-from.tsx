"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "../actions/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CommentFormProps {
  postId: number;
}

// 댓글 작성 폼 컴포넌트
export default function CommentForm({ postId }: CommentFormProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  // 댓글 생성 mutation
  const mutation = useMutation({
    mutationFn: (formData: FormData) => createComment(formData),
    onSuccess: () => {
      // 즉시 refetch하여 변경사항 반영
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "active", // 활성 쿼리만 즉시 refetch
      });
      setContent(""); // 입력 필드 초기화
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // FormData로 서버 액션에 전달
    const formData = new FormData();
    formData.set("content", content);
    formData.set("postId", String(postId));
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <Input
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={mutation.isPending}
        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
      >
        {mutation.isPending ? "⏳ Adding..." : "💬 Add Comment"}
      </Button>
    </form>
  );
}
