"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// React Query Provider 컴포넌트
export function Providers({ children }: { children: React.ReactNode }) {
    // QueryClient 인스턴스 생성 (한 번만 생성되도록 useState 사용)
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5분간 데이터를 fresh로 유지 (기본값)
                        gcTime: 10 * 60 * 1000, // 10분간 캐시 유지 (이전 cacheTime)
                        refetchOnMount: false, // 마운트 시 자동 refetch 비활성화 (캐시가 fresh하면)
                        refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
                        refetchOnReconnect: true, // 네트워크 재연결 시에는 refetch
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
