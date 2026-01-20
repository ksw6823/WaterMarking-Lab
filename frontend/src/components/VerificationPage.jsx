import { useState, useEffect, useRef } from 'react';
import {
    ShieldCheck, ChevronLeft, ChevronRight,
    FileText, BarChart3, Activity, CheckCircle2, XCircle,
    Cpu, Calendar, ArrowLeft,
    Thermometer, Zap, Layers, Microscope, Hash,
    Loader2, TrendingUp, AlertTriangle
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function VerificationPage({ onAnalyzeComplete }) {
    // 1) 상태
    const [viewMode, setViewMode] = useState('list');
    const [generationList, setGenerationList] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoadingList, setIsLoadingList] = useState(false);

    const [selectedItem, setSelectedItem] = useState(null);
    const [analyzeResult, setAnalyzeResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // ✅ generation_id -> output_text(원문) 캐시
    const [outputPreviewMap, setOutputPreviewMap] = useState({});

    // 🔒 결과 생겨도 화면 점프/자동 스크롤 방지(필요 시 확장용)
    const shouldAutoScrollRef = useRef(false);

    // ✅ 미리보기 생성 (AI 답변 기반)
    const makePreview = (text, max = 160) => {
        if (!text) return 'AI 출력 텍스트가 없습니다.';
        const oneLine = String(text).replace(/\s+/g, ' ').trim();
        if (oneLine.length <= max) return oneLine;
        return oneLine.slice(0, max) + '...';
    };

    // 2) [API] 생성 목록 조회 + (프론트에서) output_text 미리보기 채우기
    useEffect(() => {
        let alive = true;

        const fetchGenerationList = async () => {
            setIsLoadingList(true);
            try {
                const data = await apiRequest(`/api/generations?page=${currentPage}&page_size=${itemsPerPage}`);
                const items = data.items || [];

                if (!alive) return;
                setGenerationList(items);
                setTotalItems(data.total || 0);

                // ✅ 현재 페이지 아이템들 output_text(상세) 미리보기 로딩
                const idsToFetch = items
                    .map((it) => it.generation_id)
                    .filter((id) => outputPreviewMap[id] == null); // 캐시에 없는 것만

                if (idsToFetch.length > 0) {
                    const results = await Promise.allSettled(
                        idsToFetch.map((id) => apiRequest(`/api/generations/${id}`))
                    );

                    const next = {};
                    results.forEach((res) => {
                        if (res.status === 'fulfilled') {
                            const d = res.value;
                            next[d.generation_id] = d.output_text || '';
                        }
                    });

                    if (!alive) return;
                    if (Object.keys(next).length > 0) {
                        setOutputPreviewMap((prev) => ({ ...prev, ...next }));
                    }
                }
            } catch (error) {
                console.error("List Fetch Error:", error);
                if (alive) setGenerationList([]);
            } finally {
                if (alive) setIsLoadingList(false);
            }
        };

        fetchGenerationList();
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    // 3) [핸들러] 아이템 선택 (상세 조회)
    const handleSelect = async (listItem) => {
        if (isLoadingDetail) return;
        setIsLoadingDetail(true);

        try {
            const detailData = await apiRequest(`/api/generations/${listItem.generation_id}`);

            const formattedItem = {
                id: detailData.generation_id,
                summary: detailData.input_text || "질문 내용 없음",
                fullText: detailData.output_text || "",
                model: detailData.model || "알 수 없음",
                date: new Date(detailData.created_at).toLocaleDateString(),
                generationConfig: {
                    temperature: detailData.temperature ?? '-',
                    top_k: detailData.top_k ?? '-',
                    top_p: detailData.top_p ?? '-',
                    quantization: detailData.quantization ?? '-',
                    watermark_enabled: detailData.watermark_enabled,
                    attack_type: detailData.attack_type,
                    attack_intensity: detailData.attack_intensity
                }
            };

            setSelectedItem(formattedItem);
            setAnalyzeResult(null);
            setViewMode('detail');
        } catch (error) {
            console.error("Detail Fetch Error:", error);
            alert("상세 정보를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleBackToList = () => {
        setSelectedItem(null);
        setAnalyzeResult(null);
        setViewMode('list');
    };

    // ESC 키 입력 시 목록으로
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && viewMode === 'detail') {
                handleBackToList();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    // 4) [API] 검증 실행 (DetectionOut 스키마 기준)
    const handleAnalyze = async () => {
        if (!selectedItem) return;

        setIsAnalyzing(true);
        shouldAutoScrollRef.current = false;

        try {
            const targetUrl = `/api/generations/${selectedItem.id}/detections`;

            const response = await apiRequest(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const isWatermarked = Boolean(response.is_watermarked);
            const confidencePct = Math.round(((response.confidence ?? 0) * 100));

            const resultData = {
                verdict: isWatermarked ? 'Watermark Detected' : 'No Watermark',
                is_safe: isWatermarked,
                confidence: confidencePct, // number(%)
                scores: {
                    tpr: response.true_positive_rate ?? 0,
                    fpr: response.false_positive_rate ?? 0,
                    roc_auc: response.roc_auc ?? 0,
                    z_score: response.z_score ?? 0,
                    p_value: response.p_value ?? 0
                }
            };

            setAnalyzeResult(resultData);
        } catch (error) {
            console.error("Analysis Error:", error);
            alert(`검증 실패: ${error?.message || 'Unknown error'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- UI Helper ---
    const CircleChart = ({ percent, color }) => {
        const radius = 70;
        const stroke = 14;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        return (
            <div className="relative flex items-center justify-center w-56 h-56">
                <svg className="transform -rotate-90 w-56 h-56">
                    <circle cx="112" cy="112" r={radius} stroke="#f3f4f6" strokeWidth={stroke} fill="transparent" />
                    <circle
                        cx="112"
                        cy="112"
                        r={radius}
                        stroke={color}
                        strokeWidth={stroke}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-black text-gray-800">{percent}%</span>
                    <span className="text-sm font-bold text-gray-400 uppercase mt-1">Confidence</span>
                </div>
            </div>
        );
    };

    const BarGraph = ({ label, value, max = 100, color = "bg-indigo-500", desc }) => (
        <div className="mb-5">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <span className="text-sm font-bold text-gray-700 block">{label}</span>
                    <span className="text-[10px] font-medium text-gray-400">{desc}</span>
                </div>
                <span className="text-sm font-black text-gray-800">{value}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3.5">
                <div
                    className={`h-3.5 rounded-full ${color}`}
                    style={{ width: `${Math.min((Number(value) / max) * 100, 100)}%` }}
                />
            </div>
        </div>
    );

    // --- [뷰 1] 목록 ---
    const renderListView = () => {
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        return (
            <div className="h-full flex flex-col p-6 max-w-6xl mx-auto font-sans relative">
                {isLoadingDetail && (
                    <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm rounded-3xl">
                        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                            <span className="text-sm font-bold text-gray-600">상세 정보를 불러오는 중...</span>
                        </div>
                    </div>
                )}

                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="text-indigo-600" />
                            검증 대기 목록
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            생성된 텍스트 목록입니다. 항목을 선택하여 <b>워터마크 검증</b>을 수행하세요.
                        </p>
                    </div>
                </div>

                {isLoadingList ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Activity className="animate-spin text-indigo-500 mr-2" />
                        <span className="text-gray-500 font-medium">목록을 불러오는 중...</span>
                    </div>
                ) : (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto pb-4 scrollbar-hide p-1">
                        {generationList.length > 0 ? generationList.map((item) => {
                            const previewRaw = outputPreviewMap[item.generation_id];
                            const preview = previewRaw == null
                                ? 'AI 답변 미리보기를 불러오는 중...'
                                : makePreview(previewRaw, 160);

                            return (
                                <div
                                    key={item.generation_id}
                                    onClick={() => !isLoadingDetail && handleSelect(item)}
                                    className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 group flex flex-col gap-3 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1 ${isLoadingDetail ? 'cursor-wait opacity-70' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-gray-200">
                        ID: {item.generation_id}
                      </span>
                                            {item.watermark_enabled ? (
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100 flex items-center gap-1">
                          <CheckCircle2 size={10} /> WM ON
                        </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-full border border-gray-200 flex items-center gap-1">
                          <XCircle size={10} /> WM OFF
                        </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-gray-400 flex items-center gap-1.5 font-medium">
                      <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString()}
                    </span>
                                    </div>

                                    <div className="flex-1 pt-1">
                                        <h4 className="text-[15px] font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                            Q. {item.input_text}
                                        </h4>

                                        {/* ✅ AI 답변 미리보기 */}
                                        <p className="text-xs text-gray-600 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                                            {preview}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center mt-auto">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                      <Cpu size={14} className="text-gray-400" /> {item.model}
                    </span>
                                        <span className="text-indigo-600 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                      검증하기 <ChevronRight size={14} />
                    </span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-full text-center py-20 text-gray-400">
                                생성된 텍스트가 없습니다.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || isLoadingList}
                        className="p-2.5 rounded-full bg-white shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-colors border border-gray-100 text-gray-600"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm font-bold text-gray-600 bg-white px-5 py-1.5 rounded-full shadow-sm border border-gray-100">
            {currentPage} / {totalPages} 페이지
          </span>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || isLoadingList}
                        className="p-2.5 rounded-full bg-white shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-colors border border-gray-100 text-gray-600"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    };

    // --- [뷰 2] 상세 ---
    const renderDetailView = () => {
        if (!selectedItem) return null;
        const conf = selectedItem.generationConfig;

        const configChips = [
            { label: 'Model', value: selectedItem.model, icon: Cpu, color: 'text-indigo-600' },
            { label: 'Temp', value: conf.temperature, icon: Thermometer, color: 'text-orange-500' },
            { label: 'Top-K', value: conf.top_k, icon: Hash, color: 'text-blue-500' },
            { label: 'Top-P', value: conf.top_p, icon: Layers, color: 'text-purple-500' },
            { label: 'Quant', value: conf.quantization, icon: Zap, color: 'text-yellow-500' },
        ];

        if (conf.attack_type) {
            configChips.push({
                label: 'Attack',
                value: `${conf.attack_type} (${conf.attack_intensity}%)`,
                icon: AlertTriangle,
                color: 'text-red-500 bg-red-50 border-red-200'
            });
        }

        return (
            <div className="h-full flex flex-col max-w-6xl mx-auto p-4 gap-6 font-sans overflow-y-auto scrollbar-hide">
                {/* 헤더 */}
                <div className="flex-none bg-white rounded-3xl p-1 shadow-sm border border-gray-200">
                    <div className="bg-white rounded-[20px] p-5 flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <button onClick={handleBackToList} className="group p-1.5 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <ArrowLeft size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                </button>
                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 tracking-wide">
                  ID: {selectedItem.id}
                </span>
                                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Calendar size={12} /> {selectedItem.date}
                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight ml-1">
                                Q. {selectedItem.summary}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* 텍스트 + 칩 + 버튼 */}
                <div className="flex-none bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 flex flex-col gap-6 border border-gray-100">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-indigo-500" />
                            <span className="text-sm font-bold text-gray-700">검증 대상 텍스트 내용</span>
                        </div>
                        <div className="w-full min-h-[150px] bg-gray-50/50 rounded-2xl p-6 text-[15px] text-gray-700 leading-7 overflow-y-auto border border-gray-100 shadow-inner whitespace-pre-wrap font-medium">
                            {selectedItem.fullText}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex flex-wrap gap-3">
                            {configChips.map((param, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center gap-3 bg-white pl-3 pr-5 py-2.5 rounded-full border shadow-sm hover:shadow-md transition-all cursor-default ${param.color.includes('bg-red') ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-indigo-200'}`}
                                >
                                    <div className={`p-1.5 rounded-full ${param.color.includes('text-red') ? 'bg-white' : 'bg-gray-50'} ${param.color.split(' ')[0]}`}>
                                        <param.icon size={14} />
                                    </div>
                                    <div className="flex flex-col leading-none">
                    <span className={`text-[9px] font-bold uppercase mb-0.5 ${param.color.includes('text-red') ? 'text-red-400' : 'text-gray-400'}`}>
                      {param.label}
                    </span>
                                        <span className={`text-sm font-black ${param.color.includes('text-red') ? 'text-red-700' : 'text-gray-800'}`}>
                      {param.value}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold transition-all text-sm shadow-md hover:shadow-lg ${isAnalyzing
                                ? 'bg-gray-100 text-gray-400 cursor-wait'
                                : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 hover:-translate-y-0.5'
                            }`}
                        >
                            {isAnalyzing ? <Activity size={18} className="animate-spin" /> : <Microscope size={18} />}
                            {isAnalyzing ? '분석 중...' : '검증 시작'}
                        </button>
                    </div>
                </div>

                {/* 결과 영역 */}
                {analyzeResult && (
                    <div className="flex flex-col gap-6 animate-in fade-in duration-300 mb-10">
                        {/* 판정 배너 */}
                        <div className={`rounded-3xl p-6 flex items-center justify-between border shadow-sm ${analyzeResult.is_safe ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-full ${analyzeResult.is_safe ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {analyzeResult.is_safe ? <CheckCircle2 size={40} /> : <AlertTriangle size={40} />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold opacity-60 uppercase tracking-wide mb-1">Final Verdict</div>
                                    <div className="text-4xl font-black tracking-tight">{analyzeResult.verdict}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 px-8 border-l border-black/5">
                                <div className="text-right">
                                    <div className="text-xs font-bold opacity-60 uppercase">Detection Confidence</div>
                                    <div className="text-5xl font-black">{analyzeResult.confidence}%</div>
                                </div>
                            </div>
                        </div>

                        {/* 대시보드 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[320px]">
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 flex flex-col">
                                <h5 className="text-xs font-bold text-gray-400 uppercase mb-8 flex items-center gap-2">
                                    <TrendingUp size={16} /> Model Confidence
                                </h5>
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <CircleChart percent={Math.round(analyzeResult.confidence)} color={analyzeResult.is_safe ? "#10b981" : "#ef4444"} />
                                    <div className={`mt-8 px-6 py-2.5 rounded-full text-base font-bold ${analyzeResult.is_safe ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {analyzeResult.is_safe ? 'HIGH RELIABILITY' : 'LOW RELIABILITY'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 flex flex-col justify-center">
                                <h5 className="text-xs font-bold text-gray-400 uppercase mb-8 flex items-center gap-2">
                                    <BarChart3 size={16} /> Statistical Metrics
                                </h5>

                                <div className="flex flex-col gap-6">
                                    <BarGraph label="Z-Score" desc="Stat Dist" value={Number(analyzeResult.scores.z_score).toFixed(2)} max={10} color="bg-purple-500" />
                                    <BarGraph label="P-Value (Inv)" desc="Sig (Inv)" value={Math.max(0, (1 - analyzeResult.scores.p_value) * 100).toFixed(1)} max={100} color="bg-teal-500" />
                                    <BarGraph label="TPR" desc="True Pos" value={(analyzeResult.scores.tpr * 100).toFixed(1)} max={100} color="bg-blue-500" />
                                    <BarGraph label="FPR" desc="False Pos" value={(analyzeResult.scores.fpr * 100).toFixed(1)} max={100} color="bg-red-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-gray-50/30">
            {viewMode === 'list' ? renderListView() : renderDetailView()}
        </div>
    );
}
