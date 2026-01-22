import { useState, useEffect, useMemo } from 'react';
import {
    FileText, ShieldCheck, Clock, Search,
    CheckCircle, AlertTriangle, X,
    Loader2, ChevronLeft, ChevronRight,
    Cpu, Zap, Settings2, BarChart3, CheckCircle2, XCircle,
    TrendingUp, User, MessageSquare, Trash2
} from 'lucide-react';
import { apiRequest } from '../utils/api'; // 경로는 실제 프로젝트에 맞게 확인해주세요.

const PAGE_SIZE = 10;

// 필터 옵션 상수
const MODEL_OPTIONS = ['meta-llama/Meta-Llama-3-8B-Instruct', 'google/gemma-2-2b-it'];
const ATTACK_TYPES = ['substitution', 'deletion', 'summarization'];

// --- [유틸리티 함수] ---
const toPercent = (v) => Math.round((Number(v ?? 0)) * 100);

const safeDate = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString(); } catch { return '-'; }
};

const norm = (v) => (v ?? '').toString().toLowerCase().trim();

// --- [하위 컴포넌트 분리 (성능 최적화)] ---

// 1. 페이지네이션
const MiniPagination = ({ currentPage, totalCount, setPage }) => {
    const maxPage = Math.ceil(totalCount / PAGE_SIZE) || 1;
    return (
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            >
                <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] text-gray-500 font-bold px-1">
                {currentPage}/{maxPage}
            </span>
            <button
                onClick={() => setPage(p => Math.min(maxPage, p + 1))}
                disabled={currentPage === maxPage}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            >
                <ChevronRight size={14} />
            </button>
        </div>
    );
};

// 2. 원형 차트 (Detection Confidence)
const CircleChart = ({ percent, color }) => {
    const radius = 80;
    const stroke = 15;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return (
        <div className="relative flex items-center justify-center w-64 h-64">
            <svg className="transform -rotate-90 w-64 h-64">
                <circle cx="128" cy="128" r={radius} stroke="#f3f4f6" strokeWidth={stroke} fill="transparent" />
                <circle
                    cx="128"
                    cy="128"
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
                <span className="text-6xl font-black text-gray-800 tracking-tighter">{percent}%</span>
                <span className="text-sm font-bold text-gray-400 uppercase mt-2">Confidence</span>
            </div>
        </div>
    );
};

// 3. 바 그래프 (Statistical Metrics)
const BarGraph = ({ label, value, max = 100, color = "bg-indigo-500", desc, valColor = "text-gray-800" }) => (
    <div className="mb-8 last:mb-0">
        <div className="flex justify-between items-end mb-3">
            <div className="flex flex-col">
                <span className="text-base font-bold text-gray-700">{label}</span>
                <span className="text-xs font-medium text-gray-400">{desc}</span>
            </div>
            <span className={`text-xl font-black ${valColor}`}>{value}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-5">
            <div
                className={`h-5 rounded-full ${color} shadow-sm transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
            />
        </div>
    </div>
);


// --- [메인 페이지 컴포넌트] ---
export default function HistoryPage() {
    // --- [Left Panel] 생성(Generation) 상태 ---
    const [genSearchTerm, setGenSearchTerm] = useState('');
    const [genSort, setGenSort] = useState('latest');
    const [genModel, setGenModel] = useState('ALL');
    const [genWatermark, setGenWatermark] = useState('ALL');
    const [genType, setGenType] = useState('ALL');
    const [genAttackType, setGenAttackType] = useState('ALL');

    const [genHistory, setGenHistory] = useState([]);
    const [genPage, setGenPage] = useState(1);
    const [genTotal, setGenTotal] = useState(0);
    const [isLoadingGen, setIsLoadingGen] = useState(false);
    const [refreshGen, setRefreshGen] = useState(0); // 리스트 새로고침 트리거

    // --- [Right Panel] 검증(Detection) 상태 ---
    const [detSearchTerm, setDetSearchTerm] = useState('');
    const [detVerdict, setDetVerdict] = useState('ALL');
    const [detAttack, setDetAttack] = useState('ALL');
    const [detConfidence, setDetConfidence] = useState('ALL');
    const [detModel, setDetModel] = useState('ALL');

    const [detHistory, setDetHistory] = useState([]);
    const [detPage, setDetPage] = useState(1);
    const [detTotal, setDetTotal] = useState(0);
    const [isLoadingDet, setIsLoadingDet] = useState(false);

    // 상세 모달용
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalLoading, setIsModalLoading] = useState(false);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && selectedItem) setSelectedItem(null);
        };
        window.addEventListener('keydown', handleEscKey);
        return () => window.removeEventListener('keydown', handleEscKey);
    }, [selectedItem]);

    // 1) [API 호출] 생성 이력
    useEffect(() => {
        const fetchGenList = async () => {
            setIsLoadingGen(true);
            try {
                const params = new URLSearchParams({ page: genPage, page_size: PAGE_SIZE, sort: genSort });

                if (genModel !== 'ALL') params.append('model', genModel);
                if (genWatermark !== 'ALL') params.append('watermark_enabled', genWatermark === 'ON' ? 'true' : 'false');
                if (genType === 'ATTACK' && genAttackType !== 'ALL') params.append('attack_type', genAttackType);

                const data = await apiRequest(`/api/generations?${params.toString()}`);

                let filteredItems = data.items || [];
                // API에서 타입 필터링을 지원하지 않는 경우 프론트에서 2차 필터링 (필요 시 유지)
                if (genType === 'GEN') {
                    filteredItems = filteredItems.filter(item => !item.attack_type && item.type !== 'attack');
                } else if (genType === 'ATTACK') {
                    filteredItems = filteredItems.filter(item => item.attack_type || item.type === 'attack');
                }

                setGenHistory(filteredItems);
                setGenTotal(data.total || 0);
            } catch (error) {
                console.error("Gen Load Error", error);
            } finally {
                setIsLoadingGen(false);
            }
        };
        fetchGenList();
    }, [genPage, genSort, genModel, genWatermark, genType, genAttackType, refreshGen]);

    // 2) [API 호출] 검증 이력
    useEffect(() => {
        const fetchDetList = async () => {
            setIsLoadingDet(true);
            try {
                const params = new URLSearchParams({ page: detPage, page_size: PAGE_SIZE });
                const data = await apiRequest(`/api/detections?${params.toString()}`);
                let rawItems = data.items || [];

                // generation 정보를 붙여서 필터 가능하게 만들기 (Enrichment)
                const enrichedItems = await Promise.all(
                    rawItems.map(async (item) => {
                        try {
                            const genData = await apiRequest(`/api/generations/${item.generation_id}`);
                            return { ...item, genInfo: genData };
                        } catch (err) {
                            console.warn(`Generation 정보 로드 실패 (ID: ${item.generation_id})`);
                            return { ...item, genInfo: {} };
                        }
                    })
                );

                const filteredItems = enrichedItems.filter(item => {
                    const gen = item.genInfo || {};

                    // 1) Verdict 필터
                    if (detVerdict !== 'ALL') {
                        const wantDetected = detVerdict === 'DETECTED';
                        if ((item.is_watermarked ?? false) !== wantDetected) return false;
                    }
                    // 2) Attack Context 필터
                    if (detAttack !== 'ALL') {
                        const isAttacked = !!gen.attack_type || gen.type === 'attack';
                        const wantAttacked = detAttack === 'ATTACKED';
                        if (isAttacked !== wantAttacked) return false;
                    }
                    // 3) Confidence 필터
                    if (detConfidence !== 'ALL') {
                        const score = Number(item.confidence ?? 0);
                        if (detConfidence === 'HIGH' && score < 0.8) return false;
                        if (detConfidence === 'MID' && (score < 0.5 || score >= 0.8)) return false;
                        if (detConfidence === 'LOW' && score >= 0.5) return false;
                    }
                    // 4) Model 필터
                    if (detModel !== 'ALL') {
                        if (gen.model !== detModel) return false;
                    }
                    return true;
                });

                setDetHistory(filteredItems);
                setDetTotal(data.total || 0);
            } catch (error) {
                console.error("Det Load Error", error);
            } finally {
                setIsLoadingDet(false);
            }
        };
        fetchDetList();
    }, [detPage, detVerdict, detAttack, detConfidence, detModel]);

    // 페이지 리셋 트리거
    useEffect(() => { setGenPage(1); }, [genSearchTerm]);
    useEffect(() => { setDetPage(1); }, [detSearchTerm]);

    // 로컬 검색 필터링
    const filteredGenHistory = useMemo(() => {
        const q = norm(genSearchTerm);
        if (!q) return genHistory;
        return genHistory.filter((it) => (
            String(it.generation_id ?? '').includes(q) ||
            norm(it.input_text).includes(q) ||
            norm(it.output_text).includes(q) ||
            norm(it.model).includes(q) ||
            norm(it.quantization).includes(q) ||
            norm(it.attack_type).includes(q) ||
            norm(it.type).includes(q)
        ));
    }, [genHistory, genSearchTerm]);

    const filteredDetHistory = useMemo(() => {
        const q = norm(detSearchTerm);
        if (!q) return detHistory;
        return detHistory.filter((it) => (
            String(it.detection_id ?? '').includes(q) ||
            String(it.generation_id ?? '').includes(q) ||
            norm(it.input_text_preview).includes(q) ||
            norm(it.genInfo?.model).includes(q) ||
            norm(it.genInfo?.quantization).includes(q) ||
            norm(it.genInfo?.attack_type).includes(q)
        ));
    }, [detHistory, detSearchTerm]);

    const genShownCount = filteredGenHistory.length;
    const detShownCount = filteredDetHistory.length;

    // 모달 열기 핸들러
    const openModal = async (id, type) => {
        setSelectedItem({ type, generation_id: type === 'generation' ? id : null, detection_id: type === 'detection' ? id : null });
        setIsModalLoading(true);
        try {
            if (type === 'generation') {
                const data = await apiRequest(`/api/generations/${id}`);
                setSelectedItem({ ...data, type });
            } else {
                const detData = await apiRequest(`/api/detections/${id}`);
                let genData = {};
                try {
                    genData = await apiRequest(`/api/generations/${detData.generation_id}`);
                } catch (e) { console.warn("No Gen Data", e); }
                setSelectedItem({ ...detData, _gen: genData, type });
            }
        } catch (error) {
            console.error(error);
            alert("상세 정보를 불러오지 못했습니다.");
        } finally {
            setIsModalLoading(false);
        }
    };

    // --- [모달 렌더러 1] Generation 상세 ---
    const renderGenerationDetail = (data) => (
        <div className="flex gap-8 h-full">
            <div className="w-1/4 bg-gray-50 rounded-3xl p-6 border border-gray-200 flex flex-col gap-6 h-full overflow-y-auto">
                <h4 className="text-sm font-black text-gray-500 flex items-center gap-2 pb-3 border-b border-gray-200">
                    <Settings2 size={18} /> GENERATION CONFIG
                </h4>
                <div className="space-y-5 flex-1">
                    <div>
                        <span className="text-xs font-bold text-gray-400 block mb-2">MODEL & SPEC</span>
                        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-2">
                            <div className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                                <Cpu size={18} className="text-indigo-500" /> {data.model}
                            </div>
                            <div className="text-xs font-bold text-orange-600 flex items-center gap-2">
                                <Zap size={14} /> {data.quantization || '4-bit'}
                            </div>
                        </div>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-gray-400 block mb-2">SAMPLING</span>
                        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 text-center">
                            <div>
                                <span className="text-[10px] text-gray-400 block uppercase">Temp</span>
                                <span className="font-bold text-xl text-gray-700">{data.temperature ?? '-'}</span>
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <span className="text-[10px] text-gray-400 block uppercase">Top-P</span>
                                <span className="font-bold text-xl text-gray-700">{data.top_p ?? '-'}</span>
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <span className="text-[10px] text-gray-400 block uppercase">Top-K</span>
                                <span className="font-bold text-xl text-gray-700">{data.top_k ?? '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-gray-400 block mb-2">WATERMARK</span>
                        <div className={`p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center gap-2 font-bold ${data.watermark_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                            {data.watermark_enabled ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            {data.watermark_enabled ? 'Enabled' : 'Disabled'}
                        </div>
                    </div>

                    {(data.attack_type || data.type === 'attack') && (
                        <div className="mt-auto bg-red-100 border border-red-200 p-5 rounded-2xl">
                            <span className="text-xs font-bold text-red-500 block mb-2 flex items-center gap-1">
                                <AlertTriangle size={14} /> ATTACK INFO
                            </span>
                            <div className="text-xl font-black text-red-800 mb-1">{data.attack_type}</div>
                            <div className="text-sm font-bold text-red-600">Intensity: {data.attack_intensity}%</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 h-full">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col max-h-[30%]">
                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <User size={16} /> Input Prompt
                    </h5>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100">
                        {data.input_text}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col flex-1 min-h-0">
                    <h5 className="text-xs font-bold text-indigo-500 uppercase mb-3 flex items-center gap-2">
                        <MessageSquare size={16} /> Generated Output
                    </h5>
                    <div className="flex-1 overflow-y-auto p-6 bg-indigo-50/30 rounded-xl text-sm text-gray-800 leading-relaxed border border-indigo-100 shadow-inner font-mono whitespace-pre-wrap">
                        {data.output_text}
                    </div>
                </div>
                
                {data.type === 'generation' && (
                     <div className="flex justify-end">
                        <button 
                            onClick={async () => {
                                if(window.confirm("정말로 삭제하시겠습니까? 관련 데이터도 함께 삭제될 수 있습니다.")) {
                                    try {
                                        await apiRequest(`/api/generations/${data.generation_id}`, { method: 'DELETE' });
                                        alert("삭제되었습니다.");
                                        setSelectedItem(null);
                                        // 리스트 갱신 (트리거)
                                        setRefreshGen(n => n + 1);
                                    } catch(e) {
                                        alert("삭제 실패: " + e.message);
                                    }
                                }
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Delete Record
                        </button>
                     </div>
                )}
            </div>
        </div>
    );

    // --- [모달 렌더러 2] Detection 상세 ---
    const renderDetectionDetail = (data) => {
        const gen = data._gen || {};
        const isDetected = !!data.is_watermarked;
        const confPct = toPercent(data.confidence);

        return (
            <div className="flex gap-8 h-full">
                {/* 왼쪽: 설정 요약 */}
                <div className="w-[300px] flex-none bg-gray-50/50 rounded-3xl p-6 border border-gray-200 flex flex-col gap-6 h-full overflow-y-auto">
                    <h4 className="text-sm font-black text-gray-500 flex items-center gap-2 pb-3 border-b border-gray-200 sticky top-0 bg-gray-50/50 backdrop-blur-sm z-10">
                        <Settings2 size={18} /> GENERATION CONFIG
                    </h4>

                    <div className="space-y-6">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 block mb-2 uppercase tracking-wider">Target Model</span>
                            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-2 group hover:border-indigo-200 transition-colors">
                                <div className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                                    <Cpu size={20} className="text-indigo-500" /> {gen.model || 'Unknown'}
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 flex items-center gap-1">
                                        <Zap size={10} /> {gen.quantization || '4-bit'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold text-gray-400 block mb-2 uppercase tracking-wider">Sampling Parameters</span>
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                                <div className="p-4 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500">Temp</span>
                                    <span className="font-black text-gray-800 text-lg">{gen.temperature ?? '-'}</span>
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500">Top-P</span>
                                    <span className="font-black text-gray-800 text-lg">{gen.top_p ?? '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold text-gray-400 block mb-2 uppercase tracking-wider">Watermark Status</span>
                            <div className={`p-4 bg-white rounded-2xl border shadow-sm flex items-center justify-between font-bold ${gen.watermark_enabled ? 'border-green-100 text-green-700' : 'border-gray-200 text-gray-400'}`}>
                                <span className="text-sm">Injection</span>
                                {gen.watermark_enabled ? (
                                    <span className="flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full text-xs border border-green-200"><CheckCircle2 size={14} /> On</span>
                                ) : (
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full text-xs border border-gray-200"><XCircle size={14} /> Off</span>
                                )}
                            </div>
                        </div>

                        {(gen.attack_type || gen.type === 'attack') && (
                            <div className="bg-red-50 rounded-2xl border border-red-100 p-5 mt-4">
                                <span className="text-[10px] font-bold text-red-400 block mb-2 flex items-center gap-1 uppercase tracking-wider">
                                    <AlertTriangle size={12} /> Attack Info
                                </span>
                                <div className="text-xl font-black text-red-800 mb-1 capitalize">{gen.attack_type}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 오른쪽: 검증 결과 차트 및 텍스트 */}
                <div className="flex-1 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-4">
                    <div className={`rounded-3xl p-8 flex items-center justify-between border shadow-sm transition-all ${isDetected ? 'bg-gradient-to-r from-green-50 to-white border-green-200' : 'bg-gradient-to-r from-red-50 to-white border-red-200'}`}>
                        <div className="flex items-center gap-6">
                            <div className={`p-5 rounded-2xl shadow-sm ${isDetected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {isDetected ? <CheckCircle size={48} strokeWidth={2.5} /> : <AlertTriangle size={48} strokeWidth={2.5} />}
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Final Verdict</div>
                                <div className="text-5xl font-black tracking-tight">{isDetected ? 'Detected' : 'Not Detected'}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Confidence Score</div>
                            <div className={`text-6xl font-black ${isDetected ? 'text-green-600' : 'text-red-600'}`}>{confPct}%</div>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-6 min-h-[400px]">
                        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                            <div className={`absolute top-0 w-full h-2 ${isDetected ? 'bg-green-400' : 'bg-red-400'}`} />
                            <h5 className="text-xs font-bold text-gray-400 uppercase mb-8 flex items-center gap-2 w-full justify-center">
                                <TrendingUp size={16} /> Confidence Analysis
                            </h5>
                            <div className="flex-1 flex flex-col items-center justify-center scale-110">
                                <CircleChart percent={confPct} color={isDetected ? "#10b981" : "#ef4444"} />
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 w-full h-2 bg-indigo-400" />
                            <h5 className="text-xs font-bold text-gray-400 uppercase mb-10 flex items-center gap-2">
                                <BarChart3 size={16} /> Key Statistical Metrics
                            </h5>
                            <div className="flex flex-col gap-8 justify-center h-full">
                                <BarGraph label="Z-Score" desc="Statistical Distance" value={data.z_score ?? 0} max={10} color="bg-purple-500" valColor="text-purple-600" />
                                <BarGraph label="P-Value (Inv)" desc="Significance Level" value={data.p_value != null ? (1 - data.p_value) * 100 : 0} max={100} color="bg-teal-500" valColor="text-teal-600" />
                                <BarGraph label="TPR" desc="True Positive Rate" value={data.true_positive_rate != null ? data.true_positive_rate * 100 : 0} max={100} color="bg-blue-500" valColor="text-blue-600" />
                                <BarGraph label="FPR" desc="False Positive Rate" value={data.false_positive_rate != null ? data.false_positive_rate * 100 : 0} max={100} color="bg-red-400" valColor="text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col">
                        <h5 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                            <FileText size={16} /> Verified Input Text
                        </h5>
                        <div className="overflow-y-auto p-4 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-wrap max-h-[150px]">
                            {data.input_text}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full max-w-[1920px] mx-auto px-8 py-8 font-sans flex flex-col bg-gray-50/30">
            {/* 상단 헤더 */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Clock className="text-indigo-600" size={32} />
                        통합 이력 조회 (Unified History)
                    </h2>
                    <p className="text-gray-500 text-base mt-2 ml-1">
                        생성된 원본 텍스트와 검증 결과를 한 화면에서 비교/분석합니다.
                    </p>
                </div>
            </div>

            {/* 2분할 메인 컨텐츠 영역 */}
            <div className="flex-1 flex gap-8 min-h-0">

                {/* --- [Left] 생성 기록 패널 --- */}
                <div className="flex-1 border border-gray-200 rounded-[2rem] shadow-sm flex flex-col overflow-hidden bg-white">
                    <div className="px-6 py-4 bg-indigo-50/30 border-b border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><FileText size={16} /></div>
                                <span className="font-bold text-gray-700 text-sm">
                                    생성 기록 ({genShownCount}/{genTotal})
                                </span>
                            </div>
                            <MiniPagination currentPage={genPage} totalCount={genTotal} setPage={setGenPage} />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="생성 기록 검색..."
                                    value={genSearchTerm}
                                    onChange={(e) => setGenSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
                                <select value={genModel} onChange={(e) => { setGenModel(e.target.value); setGenPage(1); }} className="bg-white border px-3 py-2 rounded-xl text-xs font-bold text-gray-600">
                                    <option value="ALL">All Models</option>
                                    {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select value={genWatermark} onChange={(e) => { setGenWatermark(e.target.value); setGenPage(1); }} className="bg-white border px-3 py-2 rounded-xl text-xs font-bold text-gray-600">
                                    <option value="ALL">All WM</option>
                                    <option value="ON">WM On</option>
                                    <option value="OFF">WM Off</option>
                                </select>
                                <select value={genType} onChange={(e) => { setGenType(e.target.value); setGenAttackType('ALL'); setGenPage(1); }} className="bg-white border px-3 py-2 rounded-xl text-xs font-bold text-gray-600">
                                    <option value="ALL">All Types</option>
                                    <option value="GEN">General</option>
                                    <option value="ATTACK">Attack</option>
                                </select>
                                {genType === 'ATTACK' && (
                                    <select value={genAttackType} onChange={(e) => { setGenAttackType(e.target.value); setGenPage(1); }} className="bg-red-50/50 border border-red-100 px-3 py-2 rounded-xl text-xs font-bold text-red-600">
                                        <option value="ALL">All Attacks</option>
                                        {ATTACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                        {isLoadingGen ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
                        ) : filteredGenHistory.map((item) => {
                            const isAttack = item.type === 'attack' || item.attack_type;
                            return (
                                <div
                                    key={item.generation_id}
                                    onClick={() => openModal(item.generation_id, 'generation')}
                                    className="group bg-white p-5 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold font-mono">ID: {item.generation_id}</span>
                                            {isAttack ? (
                                                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[9px] font-black border border-red-100">ATTACK</span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[9px] font-black border border-indigo-100">GEN</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400">{safeDate(item.created_at)}</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-indigo-600">{item.input_text}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 border-t border-gray-50 pt-2">
                                        <Cpu size={12} /> {item.model}
                                        <span className="ml-auto text-[10px] text-gray-300 font-mono">{item.quantization || ''}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- [Right] 검증 기록 패널 --- */}
                <div className="flex-1 border border-gray-200 rounded-[2rem] shadow-sm flex flex-col overflow-hidden bg-white">
                    <div className="px-6 py-4 bg-green-50/30 border-b border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><ShieldCheck size={16} /></div>
                                <span className="font-bold text-gray-700 text-sm">검증 기록 ({detShownCount}/{detTotal})</span>
                            </div>
                            <MiniPagination currentPage={detPage} totalCount={detTotal} setPage={setDetPage} />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="검증 기록 검색..."
                                    value={detSearchTerm}
                                    onChange={(e) => setDetSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
                                <select value={detVerdict} onChange={(e) => { setDetVerdict(e.target.value); setDetPage(1); }} className="bg-white border px-3 py-2 rounded-xl text-xs font-bold text-gray-600">
                                    <option value="ALL">All Verdicts</option>
                                    <option value="DETECTED">Detected</option>
                                    <option value="NOT_DETECTED">Not Detected</option>
                                </select>
                                <select value={detAttack} onChange={(e) => { setDetAttack(e.target.value); setDetPage(1); }} className="bg-white border px-3 py-2 rounded-xl text-xs font-bold text-gray-600">
                                    <option value="ALL">All Contexts</option>
                                    <option value="GENERAL">General</option>
                                    <option value="ATTACKED">Attacked</option>
                                </select>
                                <select value={detConfidence} onChange={(e) => { setDetConfidence(e.target.value); setDetPage(1); }} className="bg-white border px-3 py-2 rounded-xl text-xs font-bold text-gray-600">
                                    <option value="ALL">All Scores</option>
                                    <option value="HIGH">High (80%+)</option>
                                    <option value="MID">Mid (50-79%)</option>
                                    <option value="LOW">Low (&lt;50%)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                        {isLoadingDet ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
                        ) : filteredDetHistory.map((item) => {
                            const confPct = toPercent(item.confidence);
                            const detected = !!item.is_watermarked;
                            return (
                                <div
                                    key={item.detection_id}
                                    onClick={() => openModal(item.detection_id, 'detection')}
                                    className="group bg-white p-5 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold font-mono">ID: {item.detection_id}</span>
                                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold">
                                                <span className="text-indigo-400 text-[9px]">Ref:</span>
                                                <span className="text-sm">{item.generation_id}</span>
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-[10px] text-gray-400">{safeDate(item.created_at)}</span>
                                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${detected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {detected ? 'Detected' : 'No WM'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">{item.input_text_preview}</p>
                                    <div className="pt-2 border-t border-gray-50 flex justify-between items-end">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Confidence</span>
                                        <span className="text-sm font-black text-gray-800">{confPct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 상세 모달 */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-6 animate-in fade-in duration-200"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="bg-white w-full max-w-[95vw] h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`p-8 border-b border-gray-100 flex justify-between items-center ${selectedItem.type === 'generation' ? 'bg-indigo-50/50' : 'bg-green-50/50'}`}>
                            <div className="flex flex-col">
                                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-3">
                                    {selectedItem.type === 'generation'
                                        ? <FileText size={28} className="text-indigo-600" />
                                        : <ShieldCheck size={28} className="text-green-600" />
                                    }
                                    {selectedItem.type === 'generation' ? 'Generation Details' : 'Detection Analysis Report'}
                                </h3>
                                <span className="text-sm text-gray-500 ml-10 mt-1">
                                    ID: {selectedItem.type === 'generation' ? selectedItem.generation_id : selectedItem.detection_id}
                                    <span className="mx-2">|</span>
                                    {safeDate(selectedItem.created_at)}
                                </span>
                            </div>

                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-3 hover:bg-white rounded-full text-gray-400 hover:text-gray-600 transition-colors bg-white/50"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        <div className="p-10 overflow-y-auto bg-white flex-1">
                            {isModalLoading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                                    <Loader2 size={48} className="animate-spin text-indigo-500" />
                                    <span className="font-bold">Loading Data...</span>
                                </div>
                            ) : (
                                selectedItem.type === 'generation'
                                    ? renderGenerationDetail(selectedItem)
                                    : renderDetectionDetail(selectedItem)
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}