import { useState, useEffect } from 'react';
import {
    FileText, ShieldCheck, Clock, Search,
    CheckCircle, AlertTriangle, Calendar, X,
    Loader2, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
    Cpu, Zap, Grip, Layers, Hash, Thermometer,
    BarChart3, Settings2, CheckCircle2, XCircle, Sparkles, RefreshCw
} from 'lucide-react';
import { apiRequest } from '../utils/api';

const PAGE_SIZE = 10;

export default function HistoryPage() {
    // --- [공통 컨트롤] 검색 및 필터 ---
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [selectedModel, setSelectedModel] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('latest');

    // --- [데이터 상태] ---
    const [genHistory, setGenHistory] = useState([]);
    const [genPage, setGenPage] = useState(1);
    const [genTotal, setGenTotal] = useState(0);
    const [isLoadingGen, setIsLoadingGen] = useState(false);

    const [detHistory, setDetHistory] = useState([]);
    const [detPage, setDetPage] = useState(1);
    const [detTotal, setDetTotal] = useState(0);
    const [isLoadingDet, setIsLoadingDet] = useState(false);

    // 상세 모달용
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalLoading, setIsModalLoading] = useState(false);

    // 1. [API 호출] 생성 이력
    useEffect(() => {
        const fetchGenList = async () => {
            setIsLoadingGen(true);
            try {
                const params = new URLSearchParams({
                    page: genPage,
                    page_size: PAGE_SIZE,
                    sort: sortOrder
                });
                if (activeSearch) params.append('search', activeSearch);
                if (selectedModel !== 'ALL') params.append('model', selectedModel);

                const data = await apiRequest(`/api/generations?${params.toString()}`);
                setGenHistory(data.items);
                setGenTotal(data.total || 0);
            } catch (error) {
                console.error("Gen Load Error", error);
            } finally {
                setIsLoadingGen(false);
            }
        };
        fetchGenList();
    }, [genPage, activeSearch, selectedModel, sortOrder]);

    // 2. [API 호출] 검증 이력
    useEffect(() => {
        const fetchDetList = async () => {
            setIsLoadingDet(true);
            try {
                const params = new URLSearchParams({
                    page: detPage,
                    page_size: PAGE_SIZE,
                    sort: sortOrder
                });
                if (activeSearch) params.append('search', activeSearch);

                const data = await apiRequest(`/api/detections?${params.toString()}`);
                setDetHistory(data.items);
                setDetTotal(data.total || 0);
            } catch (error) {
                console.error("Det Load Error", error);
            } finally {
                setIsLoadingDet(false);
            }
        };
        fetchDetList();
    }, [detPage, activeSearch, sortOrder]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setActiveSearch(searchTerm);
            setGenPage(1); setDetPage(1);
        }
    };

    const MiniPagination = ({ currentPage, totalCount, setPage }) => {
        const maxPage = Math.ceil(totalCount / PAGE_SIZE) || 1;
        return (
            <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                    <ChevronLeft size={14}/>
                </button>
                <span className="text-xs text-gray-500 font-medium">{currentPage}/{maxPage}</span>
                <button onClick={() => setPage(p => Math.min(maxPage, p + 1))} disabled={currentPage === maxPage} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                    <ChevronRight size={14}/>
                </button>
            </div>
        );
    };

    const openModal = async (id, type) => {
        setSelectedItem({ type }); // 로딩용
        setIsModalLoading(true);
        try {
            const endpoint = type === 'generation' ? `/api/generations/${id}` : `/api/detections/${id}`;
            const detailData = await apiRequest(endpoint);
            setSelectedItem({ ...detailData, type });
        } catch (error) {
            console.error(error); setSelectedItem(null);
        } finally {
            setIsModalLoading(false);
        }
    };

    // --- ✨ [UI Helper] 생성 상세 렌더링 ---
    const renderGenerationDetail = (data) => (
        <div className="space-y-6">
            {/* 1. 메타 정보 & 설정값 */}
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-1.5">
                    <Settings2 size={12}/> Configuration
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">MODEL</span>
                        <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm">
                            <Cpu size={14}/> {data.model}
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">TEMP / TOP-P</span>
                        <div className="flex items-center gap-1.5 text-gray-700 font-bold text-sm">
                            <Thermometer size={14}/> {data.temperature ?? '-'} / {data.top_p ?? '-'}
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">QUANTIZATION</span>
                        <div className="flex items-center gap-1.5 text-orange-600 font-bold text-sm">
                            <Zap size={14}/> {data.quantization || '4-bit'}
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">WATERMARK</span>
                        <div className={`flex items-center gap-1.5 font-bold text-sm ${data.watermark_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                            {data.watermark_enabled ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                            {data.watermark_enabled ? 'Enabled' : 'Disabled'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. 프롬프트 */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-gray-100 rounded text-gray-500"><FileText size={14}/></div>
                    <span className="text-sm font-bold text-gray-700">Input Prompt</span>
                </div>
                <div className="w-full bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-200">
                    {data.input_text}
                </div>
            </div>

            {/* 3. 생성 결과 */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-indigo-100 rounded text-indigo-600"><Zap size={14}/></div>
                    <span className="text-sm font-bold text-gray-700">Generated Output</span>
                </div>
                <div className="w-full max-h-[300px] overflow-y-auto bg-white rounded-xl p-4 text-sm text-gray-800 leading-relaxed border border-indigo-100 shadow-inner whitespace-pre-wrap">
                    {data.output_text}
                </div>
            </div>
        </div>
    );

    // --- ✨ [UI Helper] 검증 상세 렌더링 ---
    const renderDetectionDetail = (data) => (
        <div className="space-y-6">
            {/* 1. 판정 결과 배너 */}
            <div className={`rounded-2xl p-6 flex items-center justify-between border ${
                data.verdict === 'Watermark Detected' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
                <div>
                    <span className="text-xs font-bold opacity-60 uppercase mb-1 block">Final Verdict</span>
                    <h2 className={`text-2xl font-black flex items-center gap-2 ${
                        data.verdict === 'Watermark Detected' ? 'text-green-700' : 'text-red-700'
                    }`}>
                        {data.verdict === 'Watermark Detected' ? <CheckCircle size={24}/> : <AlertTriangle size={24}/>}
                        {data.verdict}
                    </h2>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold opacity-60 uppercase mb-1 block">Confidence Score</span>
                    <span className={`text-3xl font-black ${
                        data.verdict === 'Watermark Detected' ? 'text-green-800' : 'text-red-800'
                    }`}>{data.confidence_score || 0}%</span>
                </div>
            </div>

            {/* 2. 상세 지표 */}
            <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5 px-1">
                    <BarChart3 size={12}/> Analysis Metrics
                </h4>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                        <tr>
                            <th className="px-5 py-3 border-b border-r border-gray-100">Metric</th>
                            <th className="px-5 py-3 border-b border-r border-gray-100">Value</th>
                            <th className="px-5 py-3 border-b border-gray-100">Status</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                        <tr>
                            <td className="px-5 py-3 font-bold text-gray-500 border-r border-gray-100">Z-Score</td>
                            <td className="px-5 py-3 font-black border-r border-gray-100">{data.scores?.z_score ?? '-'}</td>
                            <td className="px-5 py-3 text-xs text-gray-400">통계적 거리</td>
                        </tr>
                        <tr>
                            <td className="px-5 py-3 font-bold text-gray-500 border-r border-gray-100">PPL (Perplexity)</td>
                            <td className="px-5 py-3 font-black border-r border-gray-100">{data.scores?.ppl ?? '-'}</td>
                            <td className="px-5 py-3 text-xs text-gray-400">텍스트 복잡도</td>
                        </tr>
                        <tr>
                            <td className="px-5 py-3 font-bold text-gray-500 border-r border-gray-100">TPR / FPR</td>
                            <td className="px-5 py-3 font-black border-r border-gray-100">
                                {data.scores?.tpr ?? 0}% / {data.scores?.fpr ?? 0}%
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-400">정탐률 / 오탐률</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. 분석 대상 텍스트 */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-gray-100 rounded text-gray-500"><Search size={14}/></div>
                    <span className="text-sm font-bold text-gray-700">Analyzed Text Fragment</span>
                </div>
                <div className="w-full max-h-[200px] overflow-y-auto bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed border border-gray-200 italic">
                    {data.input_text || "(No text content available)"}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full w-full max-w-[1600px] mx-auto px-6 py-6 font-sans flex flex-col bg-gray-50/30">
            {/* 1. 헤더 */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Clock className="text-indigo-600" />
                        통합 이력 조회 (Unified History)
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        생성된 원본 텍스트와 검증 결과를 한 화면에서 비교/분석합니다.
                    </p>
                </div>
            </div>

            {/* 2. 공통 컨트롤 바 */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 mb-6 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text" placeholder="ID, 텍스트 내용 통합 검색 (Enter)"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleSearch}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select value={selectedModel} onChange={(e) => {setSelectedModel(e.target.value); setGenPage(1);}} className="appearance-none bg-white border border-gray-200 pl-9 pr-8 py-2 rounded-xl text-xs font-bold text-gray-600 focus:border-indigo-400 outline-none cursor-pointer hover:bg-gray-50"><option value="ALL">All Models</option><option value="Llama-3-8B">Llama-3-8B</option><option value="Gemma-2-2B">Gemma-2-2B</option></select>
                    </div>
                    <div className="relative">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select value={sortOrder} onChange={(e) => {setSortOrder(e.target.value); setGenPage(1); setDetPage(1);}} className="appearance-none bg-white border border-gray-200 pl-9 pr-8 py-2 rounded-xl text-xs font-bold text-gray-600 focus:border-indigo-400 outline-none cursor-pointer hover:bg-gray-50"><option value="latest">최신순</option><option value="oldest">과거순</option></select>
                    </div>
                </div>
            </div>

            {/* 3. 2분할 메인 컨텐츠 */}
            <div className="flex-1 flex gap-6 min-h-0">

                {/* [Left] 생성 기록 (배지 시스템 적용) */}
                <div className="flex-1 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-indigo-50/30 flex justify-between items-center">
                        <div className="flex items-center gap-2"><div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><FileText size={16} /></div><span className="font-bold text-gray-700 text-sm">생성 기록</span></div>
                        <div className="flex items-center gap-3"><span className="text-[10px] text-gray-400 font-bold bg-white border px-2 py-0.5 rounded">Total: {genTotal}</span><MiniPagination currentPage={genPage} totalCount={genTotal} setPage={setGenPage} /></div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                        {isLoadingGen ? (
                            <div className="py-20 flex justify-center text-gray-400 gap-2"><Loader2 className="animate-spin"/></div>
                        ) : genHistory.map((item) => {
                            // ✨ 공격 여부 판별
                            const isAttack = item.type === 'attack' || item.attack_type;
                            return (
                                <div key={item.generation_id} onClick={() => openModal(item.generation_id, 'generation')} className="group bg-white p-4 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                                    {/* 상단: ID & 배지 */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-gray-400">#{item.generation_id}</span>
                                            {/* ✨ 배지 구분: ATTACK vs GEN */}
                                            {isAttack ? (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[9px] font-black uppercase border border-red-100">
                                                    <Zap size={8} className="fill-red-600"/> ATTACK
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase border border-indigo-100">
                                                    <Sparkles size={8} className="fill-indigo-600"/> GEN
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400"><Calendar size={10} className="inline mr-1"/>{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>

                                    {/* 내용 */}
                                    <p className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">{item.input_text}</p>

                                    {/* 하단 모델명 & Ref ID */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                            <Cpu size={12}/> {item.model}
                                        </div>
                                        {isAttack && item.ref_id && (
                                            <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                                                <RefreshCw size={8}/> from #{item.ref_id}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* [Right] 검증 기록 */}
                <div className="flex-1 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-green-50/30 flex justify-between items-center">
                        <div className="flex items-center gap-2"><div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><ShieldCheck size={16} /></div><span className="font-bold text-gray-700 text-sm">검증 기록</span></div>
                        <div className="flex items-center gap-3"><span className="text-[10px] text-gray-400 font-bold bg-white border px-2 py-0.5 rounded">Total: {detTotal}</span><MiniPagination currentPage={detPage} totalCount={detTotal} setPage={setDetPage} /></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                        {isLoadingDet ? <div className="py-20 flex justify-center text-gray-400 gap-2"><Loader2 className="animate-spin"/></div> : detHistory.map((item) => (
                            <div key={item.detection_id} onClick={() => openModal(item.detection_id, 'detection')} className="group bg-white p-4 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">ID: {item.detection_id}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full flex items-center gap-1 border ${item.verdict === 'Watermark Detected' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{item.verdict === 'Watermark Detected' ? <CheckCircle size={10}/> : <AlertTriangle size={10}/>} {item.verdict}</span>
                                </div>
                                <div className="mb-2"><span className="text-[9px] text-gray-400">Ref GenID: {item.generation_id}</span><p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{item.input_text_preview || "(내용 없음)"}</p></div>
                                <div className="flex gap-3 pt-2 border-t border-gray-50"><div className="flex flex-col"><span className="text-[8px] font-bold text-gray-400 uppercase">Confidence</span><span className="text-xs font-black text-green-600">{item.confidence_score}%</span></div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ✨ [Modal] 통합 상세 모달 */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedItem(null)}>
                    <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                        {/* 모달 헤더 */}
                        <div className={`p-5 border-b border-gray-100 flex justify-between items-center ${
                            selectedItem.type === 'generation' ? 'bg-indigo-50/50' : 'bg-green-50/50'
                        }`}>
                            <div className="flex flex-col">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                    {selectedItem.type === 'generation' ? <FileText size={20} className="text-indigo-600"/> : <ShieldCheck size={20} className="text-green-600"/>}
                                    {selectedItem.type === 'generation' ? '생성 상세 정보 (Generation Details)' : '검증 리포트 (Detection Report)'}
                                </h3>
                                <span className="text-xs text-gray-500 ml-7">
                                    ID: {selectedItem.type === 'generation' ? selectedItem.generation_id : selectedItem.detection_id} | {new Date(selectedItem.created_at).toLocaleString()}
                                </span>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-gray-600 transition-colors border border-transparent hover:border-gray-200">
                                <X size={24}/>
                            </button>
                        </div>

                        {/* 모달 내용 */}
                        <div className="p-6 overflow-y-auto">
                            {isModalLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
                                    <Loader2 size={40} className="animate-spin text-indigo-500"/>
                                    <span>데이터를 불러오고 있습니다...</span>
                                </div>
                            ) : (
                                selectedItem.type === 'generation'
                                    ? renderGenerationDetail(selectedItem)
                                    : renderDetectionDetail(selectedItem)
                            )}
                        </div>

                        {/* 닫기 버튼 */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setSelectedItem(null)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                                닫기 (Close)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}