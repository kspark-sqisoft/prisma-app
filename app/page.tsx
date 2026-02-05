import PostList from "@/components/post-list";

export default async function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">All Posts</h2>
        <p className="text-gray-600">Discover and interact with community posts</p>
      </div>
      <PostList />
    </div>
  );
}
