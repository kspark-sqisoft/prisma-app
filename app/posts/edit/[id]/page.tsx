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
    post: { id: number; title: string; userId: number };
    users: { id: number; name: string }[];
    postId: number;
}

// 포스트 수정 폼 컴포넌트
function PostForm({ post, users, postId }: PostFormProps) {
    const [title, setTitle] = useState(post.title);
    const [userId, setUserId] = useState<number>(post.userId);
    const queryClient = useQueryClient();
    const router = useRouter();

    // 포스트 수정 mutation
    const mutation = useMutation({
        mutationFn: () => updatePost(postId, title, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] }); // 수정 후 리스트 갱신
            router.push("/"); // 메인 페이지로 이동
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Zod 스키마로 클라이언트 측 검증
        const parsed = postSchema.safeParse({ title, userId });
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
