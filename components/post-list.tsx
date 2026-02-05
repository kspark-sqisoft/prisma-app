"use client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPosts, deletePost, deleteComment, updateComment } from "../actions/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import CommentForm from "./comment-from";

interface PostListProps {
  tagSearchQuery?: string; // 태그로 인한 검색어 (검색창에 표시 안 함)
  onUserSearchStart?: () => void; // 사용자 검색 시작 시 태그 선택 해제를 위한 콜백
}

// 포스트 리스트 컴포넌트
export default function PostList({ tagSearchQuery = "", onUserSearchStart }: PostListProps) {
  const queryClient = useQueryClient();
  // 무한 스크롤을 위한 ref: 포스트 리스트 끝에 있는 감지용 div 요소를 참조
  // Intersection Observer가 이 요소가 화면에 보이는지 감지하여 자동으로 다음 페이지 로드
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 스크롤 모드 상태 (auto: 자동, manual: 수동)
  const [scrollMode, setScrollMode] = useState<"auto" | "manual">("manual");
  // 사용자 입력 검색어 (검색창에 표시)
  const [userSearchQuery, setUserSearchQuery] = useState("");
  // 디바운싱된 사용자 검색어
  const [debouncedUserSearchQuery, setDebouncedUserSearchQuery] = useState("");

  // ============================================================================
  // 태그와 검색어 상호작용 로직
  // ============================================================================

  // 태그 클릭으로 인한 검색어 초기화인지 구분하기 위한 플래그
  const isTagClickRef = useRef(false);

  // 태그가 선택되면 검색어 초기화
  useEffect(() => {
    if (tagSearchQuery) {
      // 태그 클릭으로 인한 초기화임을 표시
      isTagClickRef.current = true;
      const timer = setTimeout(() => {
        setUserSearchQuery("");
        setDebouncedUserSearchQuery("");
        // 태그 선택 시 즉시 데이터 로드
        queryClient.invalidateQueries({
          queryKey: ["posts"],
          refetchType: "active"
        });
        // 플래그 리셋 (다음 렌더 사이클에서)
        setTimeout(() => {
          isTagClickRef.current = false;
        }, 100);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [tagSearchQuery, queryClient]);

  // 사용자 검색어 디바운싱 (500ms 지연)
  // 검색어가 입력되면 항상 디바운싱 적용 (태그 선택 중에도)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearchQuery(userSearchQuery);
      // 디바운싱 완료 후 태그 선택 해제 (전체 포스트가 잠깐 보이는 것을 방지)
      if (!isTagClickRef.current && userSearchQuery.trim() !== "" && tagSearchQuery && onUserSearchStart) {
        onUserSearchStart();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [userSearchQuery, tagSearchQuery, onUserSearchStart]);

  // React Query Infinite Query로 포스트 데이터 가져오기
  // 검색어가 있으면 서버 측 검색, 없으면 일반 로드
  // 태그 검색과 사용자 검색을 완전히 별개로 처리
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    // 태그가 선택되어 있으면 검색어는 queryKey에서 완전히 제외하여 태그만으로 필터링
    // 태그가 없을 때만 검색어를 queryKey에 포함
    queryKey: tagSearchQuery
      ? ["posts", "", tagSearchQuery]
      : ["posts", debouncedUserSearchQuery, ""],
    queryFn: ({ pageParam = 0 }) => {
      // 태그가 선택되어 있으면 검색어는 완전히 무시하고 태그만으로 필터링
      // 태그가 없고 검색어만 있으면 검색어로만 필터링
      return getPosts(
        pageParam,
        5,
        tagSearchQuery ? undefined : (debouncedUserSearchQuery || undefined),
        tagSearchQuery || undefined
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length * 5; // 다음 skip 값
      }
      return undefined;
    },
    initialPageParam: 0,
    // 캐싱 설정: 같은 데이터는 캐시에서 사용
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지 (이 시간 동안은 서버 요청 안 함)
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지 (이전 cacheTime)
    refetchOnMount: false, // 마운트 시 자동 refetch 비활성화 (캐시가 fresh하면)
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
    refetchOnReconnect: true, // 네트워크 재연결 시에는 refetch (데이터 동기화)
  });

  // 모든 페이지의 포스트를 하나의 배열로 합치기
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  // Auto 모드일 때만 Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    if (scrollMode !== "auto") return;

    // Intersection Observer 생성: 특정 요소가 화면에 보이는지 감지하는 API
    const observer = new IntersectionObserver(
      (entries) => {
        // entries[0]: 관찰 중인 첫 번째 요소의 정보
        // entries[0].isIntersecting: 요소가 화면에 보이는지 여부 (true/false)
        // loadMoreRef 요소가 화면에 보이고, 다음 페이지가 있고, 현재 로딩 중이 아니면 다음 페이지 로드
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 } // 요소의 10%가 보이면 감지 (0.0 ~ 1.0 사이의 값)
    );

    // loadMoreRef.current: ref가 연결된 실제 DOM 요소를 가져옴
    // 예: <div ref={loadMoreRef}>...</div> → 이 div 요소가 currentRef에 저장됨
    const currentRef = loadMoreRef.current;

    // DOM 요소가 존재하는지 확인 (컴포넌트가 마운트되지 않았거나 ref가 연결되지 않았을 수 있음)
    if (currentRef) {
      // observer.observe(요소): 이 요소를 관찰 대상으로 등록
      // 이제 이 요소가 화면에 보이거나 사라질 때마다 위의 콜백 함수가 실행됨
      observer.observe(currentRef);
    }

    // cleanup 함수: 컴포넌트가 언마운트되거나 의존성이 변경될 때 실행
    return () => {
      if (currentRef) {
        // observer.unobserve(요소): 요소 관찰 중지 (메모리 누수 방지)
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, scrollMode]);

  // 포스트 삭제 mutation
  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      // 즉시 refetch하여 변경사항 반영
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "active", // 활성 쿼리만 즉시 refetch
      });
    },
  });
  // 댓글 삭제 mutation
  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      // 즉시 refetch하여 변경사항 반영
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "active", // 활성 쿼리만 즉시 refetch
      });
    },
  });

  // 댓글 수정 mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => updateComment(id, content),
    onSuccess: () => {
      // 즉시 refetch하여 변경사항 반영
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "active", // 활성 쿼리만 즉시 refetch
      });
      setEditingCommentId(null); // 수정 모드 종료
    },
  });

  // 댓글 펼침/접힘 상태 관리
  const [expandedPosts, setExpandedPosts] = useState<number[]>([]);
  // 댓글 수정 상태 관리
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  // 삭제 확인 다이얼로그 상태
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);

  const toggleComments = (id: number) => {
    setExpandedPosts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6">
      {/* 검색 바 */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search posts by title, author, or tags..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="h-12 text-base pl-10"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          {/* 검색어가 입력되어 있을 때만 Clear 버튼 표시 (태그 선택 시에는 검색어가 지워지므로 버튼도 사라짐) */}
          {userSearchQuery && (
            <Button
              variant="outline"
              onClick={() => {
                setUserSearchQuery("");
              }}
              className="h-12 px-4"
            >
              Clear
            </Button>
          )}
        </div>
        {(debouncedUserSearchQuery || tagSearchQuery) && (
          <p className="mt-2 text-sm text-gray-500">
            {isFetching && userSearchQuery !== debouncedUserSearchQuery ? (
              <span className="text-gray-400">Searching...</span>
            ) : (
              <>
                {tagSearchQuery && !debouncedUserSearchQuery ? (
                  <>
                    Showing posts with tag &quot;{tagSearchQuery}&quot;
                  </>
                ) : debouncedUserSearchQuery && !tagSearchQuery ? (
                  <>
                    Found {posts.length} post{posts.length !== 1 ? "s" : ""} matching &quot;{debouncedUserSearchQuery}&quot;
                  </>
                ) : (
                  <>
                    Found {posts.length} post{posts.length !== 1 ? "s" : ""} matching &quot;{debouncedUserSearchQuery}&quot; with tag &quot;{tagSearchQuery}&quot;
                  </>
                )}
                {hasNextPage && (
                  <span className="ml-2 text-gray-400">
                    (scroll for more)
                  </span>
                )}
              </>
            )}
          </p>
        )}
      </div>

      {/* 포스트가 없을 때 */}
      {!posts || posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">No posts yet</h3>
          <p className="text-gray-500">Create your first post to get started!</p>
        </div>
      ) : posts.length === 0 && (debouncedUserSearchQuery || tagSearchQuery) ? (
        // 검색 결과가 없을 때
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">No posts found</h3>
          <p className="text-gray-500">
            {tagSearchQuery && !debouncedUserSearchQuery
              ? `No posts match tag &quot;${tagSearchQuery}&quot;`
              : debouncedUserSearchQuery && !tagSearchQuery
                ? `No posts match &quot;${debouncedUserSearchQuery}&quot;`
                : `No posts match &quot;${debouncedUserSearchQuery}&quot; with tag &quot;${tagSearchQuery}&quot;`}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setUserSearchQuery("");
            }}
            className="mt-4"
          >
            Clear search
          </Button>
        </div>
      ) : (
        // 포스트 리스트 표시
        <>

          {/* 스크롤 모드 전환 버튼 */}
          <div className="flex justify-end items-center gap-3 mb-4">
            <span className="text-sm text-gray-600">Scroll Mode:</span>
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={scrollMode === "auto" ? "default" : "ghost"}
                onClick={() => setScrollMode("auto")}
                className={
                  scrollMode === "auto"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }
              >
                Auto
              </Button>
              <Button
                size="sm"
                variant={scrollMode === "manual" ? "default" : "ghost"}
                onClick={() => setScrollMode("manual")}
                className={
                  scrollMode === "manual"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }
              >
                Manual
              </Button>
            </div>
          </div>

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
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.tags.map((postTag) => (
                        <span
                          key={postTag.tag.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                        >
                          #{postTag.tag.name}
                        </span>
                      ))}
                    </div>
                  )}
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
                  <AlertDialog open={deletePostId === post.id} onOpenChange={(open) => {
                    if (!open) setDeletePostId(null);
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        disabled={deletePostMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                          setDeletePostId(post.id);
                        }}
                      >
                        {/* 현재 삭제 중인 포스트만 "Deleting..." 표시 */}
                        {deletePostMutation.isPending && deletePostMutation.variables === post.id
                          ? "⏳ Deleting..."
                          : "🗑️ Delete"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>포스트 삭제 확인</AlertDialogTitle>
                        <AlertDialogDescription>
                          정말로 이 포스트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 포스트와 관련된 모든 댓글도 함께 삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => {
                          e.stopPropagation();
                          setDeletePostId(null);
                        }}>
                          취소
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePostMutation.mutate(post.id);
                            setDeletePostId(null);
                          }}
                          disabled={deletePostMutation.isPending}
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
                            {editingCommentId === c.id ? (
                              // 수정 모드
                              <div className="flex-1 flex gap-2">
                                <Input
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="flex-1"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      updateCommentMutation.mutate({ id: c.id, content: editingContent });
                                    } else if (e.key === "Escape") {
                                      setEditingCommentId(null);
                                      setEditingContent("");
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCommentMutation.mutate({ id: c.id, content: editingContent });
                                  }}
                                  disabled={updateCommentMutation.isPending}
                                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                >
                                  {updateCommentMutation.isPending ? "⏳" : "✓"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCommentId(null);
                                    setEditingContent("");
                                  }}
                                  className="border-gray-300"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              // 일반 모드
                              <>
                                <span className="flex-1 text-gray-700">{c.content}</span>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCommentId(c.id);
                                      setEditingContent(c.content);
                                    }}
                                  >
                                    ✏️
                                  </Button>
                                  <AlertDialog open={deleteCommentId === c.id} onOpenChange={(open) => {
                                    if (!open) setDeleteCommentId(null);
                                  }}>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                                        disabled={deleteCommentMutation.isPending}
                                        onClick={(e) => {
                                          e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                                          setDeleteCommentId(c.id);
                                        }}
                                      >
                                        {/* 현재 삭제 중인 댓글만 "⏳" 표시 */}
                                        {deleteCommentMutation.isPending && deleteCommentMutation.variables === c.id
                                          ? "⏳"
                                          : "🗑️"}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent size="sm" onClick={(e) => e.stopPropagation()}>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>댓글 삭제 확인</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteCommentId(null);
                                        }}>
                                          취소
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          variant="destructive"
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteCommentMutation.mutate(c.id);
                                            setDeleteCommentId(null);
                                          }}
                                          disabled={deleteCommentMutation.isPending}
                                        >
                                          삭제
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </>
                            )}
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

          {/* 무한 스크롤 트리거 및 로딩 인디케이터 */}
          {/* Auto 모드일 때만 loadMoreRef 연결: 이 div가 화면에 보이면 자동으로 다음 페이지 로드 */}
          <div ref={scrollMode === "auto" ? loadMoreRef : undefined} className="py-8">
            {scrollMode === "auto" ? (
              // Auto 모드: 자동 로딩
              <>
                {isFetchingNextPage && (
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading more posts...</p>
                  </div>
                )}
                {!hasNextPage && posts.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No more posts to load</p>
                  </div>
                )}
              </>
            ) : (
              // Manual 모드: 더보기 버튼
              <div className="text-center">
                {hasNextPage ? (
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-base font-semibold"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Loading...
                      </>
                    ) : (
                      "더보기"
                    )}
                  </Button>
                ) : (
                  <p className="text-gray-500">No more posts to load</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
