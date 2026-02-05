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
                        staleTime: 60 * 1000, // 1분간 데이터를 fresh로 유지
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
