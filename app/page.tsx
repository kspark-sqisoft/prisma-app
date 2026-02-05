import PostList from "@/components/post-list";

// 메인 페이지 (서버 컴포넌트)
export default async function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">All Posts</h2>
        <p className="text-gray-600">Discover and interact with community posts</p>
      </div>
      {/* 포스트 리스트 컴포넌트 */}
      <PostList />
    </div>
  );
}
