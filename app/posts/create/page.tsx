"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getUsers, createPost } from "../../../actions/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { postSchema } from "@/lib/validation";

// 포스트 생성 페이지
export default function PostCreate() {
  const queryClient = useQueryClient();
  const router = useRouter();
  // 사용자 목록 가져오기
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: getUsers });

  // 포스트 생성 mutation
  const mutation = useMutation({
    mutationFn: (formData: FormData) => createPost(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // 생성 후 리스트 갱신
      router.push("/"); // 메인 페이지로 이동
    },
  });

  const [title, setTitle] = useState("");
  const [userId, setUserId] = useState<number>();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Zod 스키마로 클라이언트 측 검증
    const parsed = postSchema.safeParse({ title, userId, tags: tags.length > 0 ? tags : undefined });
    if (!parsed.success) {
      alert("Validation failed");
      return;
    }
    // FormData로 서버 액션에 전달
    const formData = new FormData();
    formData.set("title", title);
    formData.set("userId", String(userId));
    if (tags.length > 0) {
      formData.set("tags", tags.join(","));
    }
    mutation.mutate(formData);
    setTitle("");
    setUserId(undefined);
    setTags([]);
    setTagInput("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Post</h1>
          <p className="text-gray-600">Share your thoughts with the community</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Post Title</label>
            <Input
              placeholder="Enter a catchy title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Author</label>
            <Combobox
              options={users?.map((u) => ({ value: u.id.toString(), label: u.name })) || []}
              value={userId?.toString()}
              onValueChange={(v) => setUserId(Number(v))}
              placeholder="Select an author..."
              searchPlaceholder="Search users..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Tags</label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a tag and press Enter or comma"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="h-12 text-base"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-blue-600 focus:outline-none"
                        aria-label={`Remove ${tag} tag`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">Press Enter or comma to add a tag</p>
            </div>
          </div>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base font-semibold"
          >
            {mutation.isPending ? "⏳ Creating..." : "✨ Create Post"}
          </Button>
        </form>
      </div>
    </div>
  );
}
