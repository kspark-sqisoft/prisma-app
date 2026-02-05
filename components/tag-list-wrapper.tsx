"use client";

import { useState, useEffect } from "react";
import TagList from "./tag-list";
import PostList from "./post-list";

export default function TagListWrapper() {
    const [tagSearchQuery, setTagSearchQuery] = useState("");

    // 로고 클릭 시 태그 선택 초기화를 위한 이벤트 리스너
    useEffect(() => {
        const handleResetTagSelection = () => {
            setTagSearchQuery("");
        };

        window.addEventListener("resetTagSelection", handleResetTagSelection);

        return () => {
            window.removeEventListener("resetTagSelection", handleResetTagSelection);
        };
    }, []);

    const handleTagClick = (tagName: string) => {
        // 태그 클릭 시 무조건 해당 태그 선택 (토글이 아님)
        setTagSearchQuery(tagName);
    };

    // 사용자 검색 시작 시 태그 선택 해제
    const handleUserSearchStart = () => {
        setTagSearchQuery("");
    };

    return (
        <>
            <TagList onTagClick={handleTagClick} selectedTag={tagSearchQuery} />
            <PostList
                tagSearchQuery={tagSearchQuery}
                onUserSearchStart={handleUserSearchStart}
            />
        </>
    );
}
