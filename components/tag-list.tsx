"use client";

import { useQuery } from "@tanstack/react-query";
import { getTags } from "../actions/actions";
import { useState } from "react";

interface TagListProps {
    onTagClick?: (tagName: string) => void;
    selectedTag?: string;
}

export default function TagList({ onTagClick, selectedTag }: TagListProps) {
    const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: getTags });
    const [showAll, setShowAll] = useState(false);

    if (!tags || tags.length === 0) {
        return null;
    }

    const displayTags = showAll ? tags : tags.slice(0, 10);
    const hasMore = tags.length > 10;

    const handleTagClick = (tagName: string) => {
        if (onTagClick) {
            onTagClick(tagName);
        }
    };

    const handleClearTag = () => {
        // Blog App 로고 클릭과 같은 효과 (태그 선택 초기화)
        window.dispatchEvent(new CustomEvent("resetTagSelection"));
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 mr-2">Tags:</span>
                    {displayTags.map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => handleTagClick(tag.name)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${selectedTag === tag.name
                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                : "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:text-blue-900"
                                }`}
                        >
                            #{tag.name}
                        </button>
                    ))}
                    {hasMore && !showAll && (
                        <>
                            <span className="text-gray-400">...</span>
                            <button
                                onClick={() => setShowAll(true)}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                더보기
                            </button>
                        </>
                    )}
                    {showAll && hasMore && (
                        <button
                            onClick={() => setShowAll(false)}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            접기
                        </button>
                    )}
                </div>
                {/* 태그 선택 해제 버튼 (태그가 선택되어 있을 때만 표시) */}
                {selectedTag && (
                    <button
                        onClick={handleClearTag}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 hover:text-red-900 transition-colors cursor-pointer"
                        title="태그 선택 해제"
                    >
                        ✕ 초기화
                    </button>
                )}
            </div>
        </div>
    );
}
