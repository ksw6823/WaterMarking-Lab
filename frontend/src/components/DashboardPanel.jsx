import { X, Activity, ShieldCheck, Cpu, TrendingUp, BarChart3, Fingerprint } from 'lucide-react';

// [수정] props에 'data'를 추가하여 부모(App.js)로부터 데이터를 받습니다.
export default function DashboardPanel({ isOpen, onClose, data }) {
    if (!isOpen) return null;

    // [New] 데이터가 아직 없을 경우를 대비한 기본값 (Safety Check)
    // App.js에서 넘겨주는 데이터 구조와 일치해야 합니다.
    const result = data || {
        verdict: 'Waiting...',
        status: 'Unknown',
        confidence: 0,
        tpr: 0,
        ppl: 0,
        bleu: 0,
        modelA: { name: '-', score: 0 },
        modelB: { name: '-', score: 0 }
    };

    return (
        <div className="w-full h-full flex flex-col bg-white font-sans overflow-hidden">

            {/* 1. 헤더 */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white flex-none z-10">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-600"/>
                    SynthID 분석 리포트
                </h2>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <X size={20} />
                </button>
            </div>

            {/* 2. 메인 컨텐츠 영역 (비율로 높이 분배) */}
            <div className="flex-1 p-6 flex flex-col gap-5 min-h-0 bg-gray-50/30">

                {/* [SECTION 1] 최종 판정 (Flex 3: 약 30% 차지) */}
                <div className="flex-[3] bg-white border border-indigo-50 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-0">
                    {/* 배경 데코 */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>

                    <div className="relative z-10 flex justify-between items-center h-full">
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-indigo-500 font-bold mb-2 uppercase text-xs tracking-wider">
                                <ShieldCheck size={16}/> Final Verdict
                            </div>
                            {/* [변수 적용] 판정 결과 텍스트 */}
                            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-3">
                                {result.verdict}
                            </h1>
                            <div className="self-start inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {/* [변수 적용] 상태 표시 */}
                                Status: {result.status}
                            </div>
                        </div>

                        {/* [변수 적용] 점수 영역 */}
                        <div className="text-right flex flex-col justify-center h-full">
                            <div className="text-xs font-bold text-gray-400 mb-1 uppercase">Confidence</div>
                            <div className="text-6xl lg:text-7xl font-black text-indigo-600 tracking-tighter">
                                {result.confidence}<span className="text-3xl text-gray-300 ml-1">%</span>
                            </div>
                            <div className="w-40 ml-auto bg-gray-100 rounded-full h-3 mt-3 overflow-hidden">
                                {/* 점수에 따라 게이지 바 길이 조절 */}
                                <div
                                    className="bg-indigo-600 h-full rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)] transition-all duration-1000 ease-out"
                                    style={{ width: `${result.confidence}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* [SECTION 2] 그래프 영역 (Flex 4: 약 40% 차지) */}
                <div className="flex-[4] bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col min-h-0">
                    <div className="flex justify-between items-start mb-4 flex-none">
                        <h3 className="text-base font-bold text-gray-700 flex items-center gap-2">
                            <TrendingUp size={18} className="text-gray-400"/>
                            Detection Performance
                        </h3>
                        <div className="text-right bg-gray-50 px-3 py-1 rounded-lg">
                            <span className="text-[10px] text-gray-400 font-bold block">TPR Score</span>
                            {/* [변수 적용] TPR 점수 */}
                            <span className="text-2xl font-black text-gray-800">{result.tpr}%</span>
                        </div>
                    </div>

                    {/* 그래프 컨테이너 */}
                    <div className="flex-1 relative w-full border-l border-b border-gray-200 min-h-0">
                        {/* 격자 배경 */}
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4">
                            {[...Array(4)].map((_, i) => <div key={`h-${i}`} className="border-t border-gray-50 w-full h-full"></div>)}
                            {[...Array(6)].map((_, i) => <div key={`v-${i}`} className="border-r border-gray-50 w-full h-full absolute top-0" style={{left: `${(i+1)*16.66}%`}}></div>)}
                        </div>

                        {/* SVG 그래프 (모양은 고정이지만 추후 데이터에 따라 path 변경 가능) */}
                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1"/>
                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
                                </linearGradient>
                            </defs>
                            <path d="M0 100 Q 15 5, 100 2 V 100 Z" fill="url(#chartGradient)" />
                            <path d="M0 100 Q 15 5, 100 2" fill="none" stroke="#4f46e5" strokeWidth="4" vectorEffect="non-scaling-stroke" strokeLinecap="round"/>
                            <circle cx="100%" cy="2%" r="6" fill="white" stroke="#4f46e5" strokeWidth="3" />
                        </svg>

                        <span className="absolute -bottom-6 right-0 text-xs font-bold text-gray-400">FPR (False Positive)</span>
                        <span className="absolute -left-6 top-0 text-xs font-bold text-gray-400 -rotate-90 origin-bottom-right">TPR</span>
                    </div>
                </div>

                {/* [SECTION 3] 하단 정보 (Flex 3: 약 30% 차지) */}
                <div className="flex-[3] grid grid-cols-2 gap-5 min-h-0">

                    {/* 3-1. 통계 지표 (PPL & BLEU) */}
                    <div className="flex flex-col gap-4 h-full">
                        {/* PPL Card */}
                        <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-1">
                                    <BarChart3 size={14}/> Perplexity
                                </div>
                                {/* [변수 적용] PPL 값 */}
                                <div className="text-3xl font-bold text-green-600 tracking-tight">{result.ppl}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-md font-bold uppercase block mb-1">Low</span>
                                <span className="text-[10px] text-gray-400 font-medium">Natural</span>
                            </div>
                        </div>
                        {/* BLEU Card */}
                        <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-1">
                                    <Fingerprint size={14}/> BLEU Score
                                </div>
                                {/* [변수 적용] BLEU 값 */}
                                <div className="text-3xl font-bold text-blue-600 tracking-tight">{result.bleu}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase block mb-1">High</span>
                                <span className="text-[10px] text-gray-400 font-medium">Match</span>
                            </div>
                        </div>
                    </div>

                    {/* 3-2. 모델 정보 */}
                    <div className="h-full bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                        <h3 className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                            <Cpu size={16}/> Source Model Prediction
                        </h3>
                        <div className="space-y-6">
                            {/* [변수 적용] 모델 A */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-gray-800">{result.modelA.name}</span>
                                    <span className="font-bold text-blue-600">{result.modelA.score}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${result.modelA.score}%` }}
                                    ></div>
                                </div>
                            </div>
                            {/* [변수 적용] 모델 B */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-gray-400">{result.modelB.name}</span>
                                    <span className="font-bold text-gray-400">{result.modelB.score}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="bg-gray-300 h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${result.modelB.score}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}