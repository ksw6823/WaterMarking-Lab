import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import DashboardPanel from './components/DashboardPanel';
import VerificationPage from './components/VerificationPage';
import AttackPage from './components/AttackPage';
import HistoryPage from './components/HistoryPage';
import { BarChart2 } from 'lucide-react';
import { apiRequest } from './utils/api';

function App() {
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('generate');
    const [dashboardData, setDashboardData] = useState(null);
    const [currentAttackType, setCurrentAttackType] = useState('deletion');
    const [generatedHistory, setGeneratedHistory] = useState([]);

    // 생성 설정값 (기본값)
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

    // 앱 실행 시 초기 데이터 로드
    useEffect(() => {
        fetchInitialHistory();
    }, []);

    // API를 통해 최신 생성 기록 가져오기
    const fetchInitialHistory = async () => {
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
    };

    // 텍스트 생성 후 리스트 갱신
    const handleTextGenerated = () => {
        fetchInitialHistory();
    };

    // 분석 완료 후 대시보드 열기
    const handleAnalysisComplete = (resultData) => {
        setDashboardData(resultData);
        setIsDashboardOpen(true);
    };

    return (
        <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans">

            {/* 1. 사이드바 */}
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

                {!isDashboardOpen && (
                    <div className="absolute top-6 right-8 z-20">
                        <button
                            onClick={() => setIsDashboardOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:shadow-md hover:text-indigo-600 transition-all font-bold"
                        >
                            <BarChart2 size={20} />
                            <span>대시보드 열기</span>
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto relative w-full">
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
                            onAnalyzeComplete={handleAnalysisComplete}
                        />
                    )}

                    {activeTab === 'history' && <HistoryPage />}
                </div>
            </main>

            {/* 3. 대시보드 패널 */}
            {isDashboardOpen && (
                <div className="w-[900px] h-full bg-white border-l border-gray-200 shadow-2xl z-30 flex-none">
                    <DashboardPanel
                        isOpen={isDashboardOpen}
                        onClose={() => setIsDashboardOpen(false)}
                        data={dashboardData}
                    />
                </div>
            )}

        </div>
    );
}

export default App;