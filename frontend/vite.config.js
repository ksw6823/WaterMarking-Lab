import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            // '/api'로 시작하는 요청이 오면
            '/api': {
                // 백엔드 서버 주소(8000번)로 보냅니다.
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});