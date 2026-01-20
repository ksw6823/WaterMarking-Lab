import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import DashboardPanel from './components/DashboardPage';
import VerificationPage from './components/VerificationPage';
import AttackPage from './components/AttackPage';
import HistoryPage from './components/HistoryPage';
import { BarChart2 } from 'lucide-react';
import { apiRequest } from './utils/api';

function App() {
    // 1. 상태 관리
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('generate');
    const [dashboardData, setDashboardData] = useState(null);
    const [currentAttackType, setCurrentAttackType] = useState('deletion');
    const [generatedHistory, setGeneratedHistory] = useState([]);

    // 2. 생성 설정값
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

    // 3. 초기 데이터 로드
    async function fetchInitialHistory() {
        try {
            const data = await apiRequest('/api/generations?page=1&page_size=20');
            const mappedData = data.items.map(item => ({
                id: item.generation_id,
                text: item.input_text,
                date: item.created_at,
                model: item.model,
                ...item
            }));
            setGeneratedHistory(mappedData);
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    }

    useEffect(() => {
        fetchInitialHistory();
    }, []);

    // ✨ [추가됨] ESC 키로 대시보드 닫기 기능
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isDashboardOpen) {
                setIsDashboardOpen(false);
            }
        };

        // 이벤트 리스너 등록
        window.addEventListener('keydown', handleEscKey);

        // 컴포넌트 언마운트 시 리스너 제거 (메모리 누수 방지)
        return () => {
            window.removeEventListener('keydown', handleEscKey);
        };
    }, [isDashboardOpen]); // isDashboardOpen이 바뀔 때마다 실행

    const handleTextGenerated = () => {
        fetchInitialHistory();
    };

    const handleAnalysisComplete = (resultData) => {
        setDashboardData(resultData);
        setIsDashboardOpen(true);
    };

    return (
        <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans">

            {/* 1. 사이드바 (고정) */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                genConfig={genConfig}
                onConfigChange={setGenConfig}
                attackType={currentAttackType}
                onAttackTypeChange={setCurrentAttackType}
                recentHistory={generatedHistory}
            />

            {/* 2. 메인 영역 */}
            <main className="flex-1 flex flex-col h-full relative min-w-0 bg-gray-50/30 transition-all duration-200">

                {/* 대시보드 열기 버튼 (패널 닫혀있을 때만 표시) */}
                {!isDashboardOpen && (
                    <div className="absolute top-6 right-8 z-20">
                        <button
                            onClick={() => setIsDashboardOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:shadow-md hover:text-indigo-600 hover:border-indigo-200 transition-all font-bold"
                        >
                            <BarChart2 size={20} />
                            <span>대시보드 열기</span>
                        </button>
                    </div>
                )}

                {/* 메인 컨텐츠 */}
                <div className="flex-1 overflow-y-auto relative w-full pt-4">
                    {activeTab === 'generate' && (
                        <ChatArea
                            onTextGenerated={handleTextGenerated}
                            genConfig={genConfig}
                        />
                    )}

                    {activeTab === 'verify' && (
                        <VerificationPage onAnalyzeComplete={handleAnalysisComplete} />
                    )}

                    {activeTab === 'attack' && (
                        <AttackPage
                            history={generatedHistory}
                            attackType={currentAttackType}
                            // ✨ 수정됨: 대시보드를 여는 함수 대신, 목록만 다시 불러오는 함수를 연결
                            onAnalyzeComplete={fetchInitialHistory}
                        />
                    )}

                    {activeTab === 'history' && <HistoryPage />}
                </div>

                {/* ✨ 3. 대시보드 패널 오버레이 */}
                {/* 닫기 버튼(X) 기능은 DashboardPanel 내부의 onClose 프롭으로 전달됨 */}
                {isDashboardOpen && (
                    <div className="absolute inset-y-0 right-0 left-6 z-50 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] rounded-l-[2rem] border-l border-gray-100 flex-none animate-in slide-in-from-right duration-300 overflow-hidden">
                        <DashboardPanel
                            isOpen={isDashboardOpen}
                            onClose={() => setIsDashboardOpen(false)} // 여기서 닫기 기능 전달
                            data={dashboardData}
                        />
                    </div>
                )}

            </main>
        </div>
    );
}

export default App;