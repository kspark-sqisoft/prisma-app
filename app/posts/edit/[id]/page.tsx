"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPost, getUsers, updatePost } from "../../../../actions/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { postSchema } from "@/lib/validation";

interface PostFormProps {
    post: { id: number; title: string; userId: number; tags?: { tag: { id: number; name: string } }[] };
    users: { id: number; name: string }[];
    postId: number;
}

// 포스트 수정 폼 컴포넌트
function PostForm({ post, users, postId }: PostFormProps) {
    const [title, setTitle] = useState(post.title);
    const [userId, setUserId] = useState<number>(post.userId);
    const [tags, setTags] = useState<string[]>(
        post.tags && post.tags.length > 0
            ? post.tags.map(t => t.tag.name)
            : []
    );
    const [tagInput, setTagInput] = useState("");
    const queryClient = useQueryClient();
    const router = useRouter();

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

    // 포스트 수정 mutation
    const mutation = useMutation({
        mutationFn: () => {
            return updatePost(postId, title, userId, tags);
        },
        onSuccess: async () => {
            // 무한 스크롤 쿼리 리셋 (첫 페이지부터 다시 로드)
            queryClient.resetQueries({
                queryKey: ["posts"],
            });
            // 첫 페이지를 다시 가져와서 수정된 포스트가 맨 위에 보이도록
            await queryClient.refetchQueries({
                queryKey: ["posts"],
                type: "active",
            });
            router.push("/"); // refetch 완료 후 메인 페이지로 이동
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Zod 스키마로 클라이언트 측 검증
        const parsed = postSchema.safeParse({ title, userId, tags: tags.length > 0 ? tags : undefined });
        if (!parsed.success) {
            alert("Validation failed");
            return;
        }
        mutation.mutate();
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Post</h1>
                    <p className="text-gray-600">Update your post information</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Post Title</label>
                        <Input
                            placeholder="Enter a catchy title..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="h-12 text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Author</label>
                        <Combobox
                            options={users.map((u) => ({ value: u.id.toString(), label: u.name }))}
                            value={userId.toString()}
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
                        className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base font-semibold"
                    >
                        {mutation.isPending ? "⏳ Saving..." : "💾 Save Changes"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

// 포스트 수정 페이지
export default function PostEdit() {
    const params = useParams();
    const postId = Number(params.id); // URL 파라미터에서 포스트 ID 추출

    // 포스트 데이터 가져오기
    const { data: post, isLoading: postLoading, error: postError } = useQuery({
        queryKey: ["post", postId],
        queryFn: () => getPost(postId),
        enabled: !!postId && !isNaN(postId), // 유효한 ID일 때만 쿼리 실행
    });
    // 사용자 목록 가져오기
    const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers
    });

    if (postLoading || usersLoading) {
        return <p className="text-center mt-10">Loading...</p>;
    }

    if (postError) {
        return (
            <div className="text-center mt-10">
                <p className="text-red-500">Error loading post: {postError.message}</p>
                <p className="text-sm text-gray-500 mt-2">Post ID: {postId}</p>
            </div>
        );
    }

    if (usersError) {
        return <p className="text-center mt-10 text-red-500">Error loading users</p>;
    }

    if (!post) {
        return (
            <div className="text-center mt-10">
                <p>Post not found</p>
                <p className="text-sm text-gray-500 mt-2">Post ID: {postId} (type: {typeof postId})</p>
            </div>
        );
    }

    if (!users || users.length === 0) {
        return <p className="text-center mt-10">No users available</p>;
    }

    // key prop으로 포스트 변경 시 폼 리셋
    return <PostForm key={post.id} post={post} users={users} postId={postId} />;
}
