"use client";

import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

export function LogoLink() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 이미 인덱스 페이지에 있으면 새로고침
    if (pathname === "/") {
      e.preventDefault();
      // 태그 선택 초기화를 위한 커스텀 이벤트 dispatch
      window.dispatchEvent(new CustomEvent("resetTagSelection"));
      // 쿼리 리셋 및 리페치
      queryClient.resetQueries({ queryKey: ["posts"] });
      queryClient.refetchQueries({ queryKey: ["posts"], type: "active" });
      // 페이지 새로고침 효과
      router.refresh();
    }
  };

  return (
    <Link
      href="/"
      onClick={handleClick}
      className="cursor-pointer hover:opacity-80 transition-opacity"
    >
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Blog App
      </h1>
    </Link>
  );
}
