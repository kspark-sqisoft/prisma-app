"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getUsers, createPost } from "../../../actions/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { postSchema } from "@/lib/validation";

export default function PostCreate() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: getUsers });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => createPost(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      router.push("/");
    },
  });

  const [title, setTitle] = useState("");
  const [userId, setUserId] = useState<number>();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = postSchema.safeParse({ title, userId });
    if (!parsed.success) {
      alert("Validation failed");
      return;
    }
    const formData = new FormData();
    formData.set("title", title);
    formData.set("userId", String(userId));
    mutation.mutate(formData);
    setTitle("");
    setUserId(undefined);
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
