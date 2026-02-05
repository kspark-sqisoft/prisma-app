"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPosts, deletePost, deleteComment } from "../actions/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import CommentForm from "./comment-from";

// 포스트 리스트 컴포넌트
export default function PostList() {
  const queryClient = useQueryClient();
  // React Query로 포스트 데이터 가져오기
  const { data: posts } = useQuery({ queryKey: ["posts"], queryFn: getPosts });

  // 포스트 삭제 mutation
  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }), // 삭제 후 리스트 갱신
  });
  // 댓글 삭제 mutation
  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }), // 삭제 후 리스트 갱신
  });

  // 댓글 펼침/접힘 상태 관리
  const [expandedPosts, setExpandedPosts] = useState<number[]>([]);
  const toggleComments = (id: number) => {
    setExpandedPosts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">No posts yet</h3>
        <p className="text-gray-500">Create your first post to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="p-6 bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-xl overflow-hidden"
        >
          <div
            className="flex justify-between items-start cursor-pointer group"
            onClick={() => toggleComments(post.id)}
          >
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                {post.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium text-gray-700">👤 {post.user.name}</span>
                <span>•</span>
                <span>{post.comments.length} 💬</span>
              </div>
            </div>
            {/* 버튼 클릭 시 카드 클릭 이벤트 전파 방지 */}
            <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
              <Link href={`/posts/edit/${post.id}`}>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  ✏️ Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                disabled={deletePostMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                  deletePostMutation.mutate(post.id);
                }}
              >
                {/* 현재 삭제 중인 포스트만 "Deleting..." 표시 */}
                {deletePostMutation.isPending && deletePostMutation.variables === post.id
                  ? "⏳ Deleting..."
                  : "🗑️ Delete"}
              </Button>
            </div>
          </div>

          {/* 댓글 섹션 (카드 클릭 시 펼쳐짐) */}
          {expandedPosts.includes(post.id) && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  💬 Comments ({post.comments.length})
                </h4>
                {post.comments.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No comments yet. Be the first to comment!</p>
                ) : (
                  <ul className="space-y-3">
                    {post.comments.map((c) => (
                      <li
                        key={c.id}
                        className="flex justify-between items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="flex-1 text-gray-700">{c.content}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                          disabled={deleteCommentMutation.isPending}
                          onClick={(e) => {
                            e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                            deleteCommentMutation.mutate(c.id);
                          }}
                        >
                          {/* 현재 삭제 중인 댓글만 "⏳" 표시 */}
                          {deleteCommentMutation.isPending && deleteCommentMutation.variables === c.id
                            ? "⏳"
                            : "🗑️"}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* 댓글 작성 폼 */}
              <CommentForm postId={post.id} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
