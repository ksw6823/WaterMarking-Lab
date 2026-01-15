export const apiRequest = async (endpoint, options = {}) => {
    try {
        // 1. 헤더 설정
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // 2. 요청 보내기
        const response = await fetch(endpoint, {
            ...options,
            headers,
        });

        // 3. 응답 받기
        const data = await response.json();

        // 4. [핵심] 에러 처리 로직
        if (!response.ok) {
            // 백엔드가 준 에러 구조: { error: { message: "..." } }
            // 여기서 message를 뽑아냅니다.
            const errorMessage = data.error?.message || `서버 요청 실패 (${response.status})`;

            // 에러를 던지면 컴포넌트의 catch 블록으로 이동합니다.
            throw new Error(errorMessage);
        }

        // 5. 성공 시 데이터 반환
        return data;

    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
};