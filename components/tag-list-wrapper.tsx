"use client";

import TagList from "./tag-list";
import PostList from "./post-list";
import { useTag } from "./tag-context";

export default function TagListWrapper() {
    const { tagSearchQuery, setTagSearchQuery } = useTag();

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
            <TagList
                onTagClick={handleTagClick}
                selectedTag={tagSearchQuery}
            />
            <PostList
                tagSearchQuery={tagSearchQuery}
                onUserSearchStart={handleUserSearchStart}
            />
        </>
    );
}
