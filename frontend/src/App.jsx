import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import VerificationPage from './components/VerificationPage';
import AttackPage from './components/AttackPage';
import HistoryPage from './components/HistoryPage';
import { apiRequest } from './utils/api';

function App() {
    // 1. 탭 및 데이터 상태 관리
    const [activeTab, setActiveTab] = useState('generate');
    const [currentAttackType, setCurrentAttackType] = useState('deletion');
    const [generatedHistory, setGeneratedHistory] = useState([]);

    // 2. 생성 설정값 (기본값)
    const [genConfig, setGenConfig] = useState({
        model: "Llama-3-8B",
        quantization: "4-bit",
        temperature: 0.7,
        top_k: 50,
        top_p: 0.9,
        max_tokens: 200,
        watermark_enabled: true,
        context_width: 3,
        tournament_size: 10,
        g_value: 0.25,
        watermark_key: "secret_key_123"
    });

    // 3. API를 통해 최신 생성 기록 가져오기 (공격 페이지 등에서 사용)
    async function fetchInitialHistory() {
        try {
            const data = await apiRequest('/api/generations?page=1&page_size=20');

            const mappedData = data.items.map(item => ({
                id: item.generation_id,
                text: item.input_text, // 사이드바 요약용으로 질문(Prompt) 사용
                date: item.created_at,
                model: item.model,
                ...item // 나머지 필드도 포함
            }));

            setGeneratedHistory(mappedData);
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    }

    // 앱 실행 시 초기 데이터 로드
    useEffect(() => {
        fetchInitialHistory();
    }, []);

    // 텍스트 생성 후 리스트 갱신 (ChatArea에서 호출)
    const handleTextGenerated = () => {
        fetchInitialHistory();
    };

    return (
        <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans">

            {/* 1. 사이드바 (설정 및 메뉴) */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                genConfig={genConfig}
                onConfigChange={setGenConfig}
                attackType={currentAttackType}
                onAttackTypeChange={setCurrentAttackType}
                recentHistory={generatedHistory}
            />

            {/* 2. 메인 컨텐츠 영역 */}
            <main className="flex-1 flex flex-col h-full relative min-w-0 bg-gray-50/30 transition-all duration-200">
                <div className="flex-1 overflow-y-auto relative w-full">

                    {/* (A) 텍스트 생성 탭 */}
                    {activeTab === 'generate' && (
                        <ChatArea
                            onTextGenerated={handleTextGenerated}
                            genConfig={genConfig}
                        />
                    )}

                    {/* (B) 워터마크 검증 탭 */}
                    {activeTab === 'verify' && (
                        <VerificationPage />
                    )}

                    {/* (C) 공격 시뮬레이션 탭 */}
                    {activeTab === 'attack' && (
                        <AttackPage
                            history={generatedHistory}
                            attackType={currentAttackType}
                        />
                    )}

                    {/* (D) 전체 이력 조회 탭 */}
                    {activeTab === 'history' && (
                        <HistoryPage />
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;