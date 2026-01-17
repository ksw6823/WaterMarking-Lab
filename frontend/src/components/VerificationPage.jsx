import { useState, useEffect } from 'react';
import {
    ShieldCheck, ChevronLeft, ChevronRight,
    FileText, BarChart3, Activity, CheckCircle2, XCircle,
    Cpu, Calendar, ArrowLeft,
    Thermometer, Zap, Layers, Microscope, Hash, Settings2,
    Loader2 // 로딩 아이콘 추가
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function VerificationPage() {
    // 1. 상태 관리
    const [viewMode, setViewMode] = useState('list');
    const [generationList, setGenerationList] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoadingList, setIsLoadingList] = useState(false);

    const [selectedItem, setSelectedItem] = useState(null);
    const [analyzeResult, setAnalyzeResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // ✨ 상세 정보 로딩 상태 추가
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // 2. [API] 생성 목록 조회
    useEffect(() => {
        fetchGenerationList();
    }, [currentPage]);

    const fetchGenerationList = async () => {
        setIsLoadingList(true);
        try {
            const data = await apiRequest(`/api/generations?page=${currentPage}&page_size=${itemsPerPage}`);
            setGenerationList(data.items || []);
            setTotalItems(data.total || 0);
        } catch (error) {
            console.error("List Fetch Error:", error);
            setGenerationList([]);
        } finally {
            setIsLoadingList(false);
        }
    };

    // 3. [핸들러] 아이템 선택 (✨ 여기가 핵심 변경 사항입니다!)
    const handleSelect = async (listItem) => {
        setIsLoadingDetail(true); // 로딩 시작
        try {
            // (1) 클릭한 ID로 상세 정보를 서버에 다시 요청합니다.
            // GET /api/generations/{id}
            const detailData = await apiRequest(`/api/generations/${listItem.generation_id}`);

            // (2) 서버에서 받은 '상세 데이터(detailData)'로 포맷팅합니다.
            // 여기에는 quantization, temperature 등이 모두 포함되어 있습니다.
            const formattedItem = {
                id: detailData.generation_id,
                summary: detailData.input_text || "질문 내용 없음",
                fullText: detailData.output_text || "", // 이제 텍스트가 잘 보일 겁니다!
                model: detailData.model || "알 수 없음",
                date: new Date(detailData.created_at).toLocaleDateString(),
                // 상세 조회 API(GenerationOut)에는 이 값들이 들어있습니다.
                generationConfig: {
                    temperature: detailData.temperature ?? '-',
                    top_k: detailData.top_k ?? '-',
                    top_p: detailData.top_p ?? '-',
                    quantization: detailData.quantization ?? '-'
                }
            };

            setSelectedItem(formattedItem);
            setAnalyzeResult(null);
            setViewMode('detail'); // 화면 전환

        } catch (error) {
            console.error("Detail Fetch Error:", error);
            alert("상세 정보를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoadingDetail(false); // 로딩 끝
        }
    };

    const handleBackToList = () => {
        setSelectedItem(null);
        setViewMode('list');
    };

    // 4. [API] 검증 실행 (백엔드 라우터 설정인 /detections 사용)
    const handleAnalyze = async () => {
        if (!selectedItem) return;
        setIsAnalyzing(true);

        try {
            // [수정] 명세서의 'detect' 대신, 실제 라우터 설정인 'detections'를 사용해봅니다.
            // POST /api/detections/27
            const targetUrl = `/api/detections/${selectedItem.id}`;

            // Body 없이 URL로만 요청 (명세서 방식 유지)
            const response = await apiRequest(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            // --- 결과 처리 (기존 동일) ---
            const verdictMap = {
                'Watermark Detected': '워터마크 감지됨',
                'No Watermark Detected': '워터마크 미감지'
            };
            const isSafe = response.is_watermarked ?? (response.verdict === 'Watermark Detected');
            const verdictText = verdictMap[response.verdict] || (isSafe ? '워터마크 감지됨' : '워터마크 미감지');

            setAnalyzeResult({
                verdict: verdictText,
                is_safe: isSafe,
                scores: {
                    tpr: (response.true_positive_rate || 0).toFixed(1),
                    fpr: (response.false_positive_rate || 0).toFixed(1),
                    roc_auc: (response.roc_auc || 0).toFixed(3),
                    z_score: (response.z_score || 0).toFixed(2)
                }
            });

        } catch (error) {
            console.error("Analysis Error:", error);
            // 에러 내용을 띄워 확인
            alert(`오류 발생: ${error.message}\n(만약 405 에러라면 백엔드 미구현입니다)`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- [뷰 1] 목록 조회 ---
    const renderListView = () => {
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        return (
            <div className="h-full flex flex-col p-6 max-w-6xl mx-auto font-sans">
                {/* 전체 화면 로딩 오버레이 (상세 조회 중일 때) */}
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
                        {generationList.length > 0 ? generationList.map((item) => (
                            <div
                                key={item.generation_id}
                                onClick={() => !isLoadingDetail && handleSelect(item)}
                                className={`bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] cursor-pointer transition-all duration-300 group flex flex-col gap-3 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1 
                                    ${isLoadingDetail ? 'cursor-wait opacity-70' : ''}`}
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
                                        <Calendar size={12}/> {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex-1 pt-1">
                                    <h4 className="text-[15px] font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                        Q. {item.input_text}
                                    </h4>
                                    {/* 목록에는 output_text가 없으므로 input_text만 보여주거나 공란 처리 */}
                                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                                        {item.model} 모델로 생성된 텍스트입니다.
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex justify-between items-center mt-auto">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                        <Cpu size={14} className="text-gray-400"/> {item.model}
                                    </span>
                                    <span className="text-indigo-600 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                        검증하기 <ChevronRight size={14}/>
                                    </span>
                                </div>
                            </div>
                        )) : (
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
                        <ChevronLeft size={20}/>
                    </button>
                    <span className="text-sm font-bold text-gray-600 bg-white px-5 py-1.5 rounded-full shadow-sm border border-gray-100">
                        {currentPage} / {Math.ceil(totalItems / itemsPerPage) || 1} 페이지
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalItems / itemsPerPage) || 1, p + 1))}
                        disabled={currentPage === (Math.ceil(totalItems / itemsPerPage) || 1) || isLoadingList}
                        className="p-2.5 rounded-full bg-white shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-colors border border-gray-100 text-gray-600"
                    >
                        <ChevronRight size={20}/>
                    </button>
                </div>
            </div>
        );
    };

    // --- [뷰 2] 상세 및 검증 화면 ---
    const renderDetailView = () => {
        if (!selectedItem) return null;

        return (
            <div className="h-full flex flex-col max-w-5xl mx-auto p-4 gap-6 font-sans overflow-y-auto scrollbar-hide">
                {/* [상단] 헤더 카드 */}
                <div className="flex-none bg-white rounded-3xl p-1 shadow-sm border border-gray-200">
                    <div className="bg-white rounded-[20px] p-5 flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <button onClick={handleBackToList} className="group p-1.5 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <ArrowLeft size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors"/>
                                </button>
                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 tracking-wide">
                                    ID: {selectedItem.id}
                                </span>
                                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                    <Calendar size={12}/> {selectedItem.date}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight ml-1">
                                Q. {selectedItem.summary}
                            </h3>
                        </div>

                        <div className="text-right">
                            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">소스 모델</div>
                            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                <div className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm">
                                    <Cpu size={18} />
                                </div>
                                <span className="text-base font-bold text-gray-800">{selectedItem.model}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* [중단] 텍스트 & 설정 & 버튼 */}
                <div className="flex-none bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 flex flex-col gap-6 border border-gray-100">

                    {/* 텍스트 영역 */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-indigo-500"/>
                            <span className="text-sm font-bold text-gray-700">검증 대상 텍스트 내용</span>
                        </div>
                        <div className="w-full min-h-[300px] bg-gray-50/50 rounded-2xl p-6 text-[15px] text-gray-700 leading-7 overflow-y-auto border border-gray-100 shadow-inner whitespace-pre-wrap font-medium">
                            {selectedItem.fullText}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* 설정값 표시 & 검증 버튼 */}
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: 'Temp', value: selectedItem.generationConfig.temperature, icon: Thermometer, color: 'text-orange-500' },
                                { label: 'Top-K', value: selectedItem.generationConfig.top_k, icon: Hash, color: 'text-blue-500' },
                                { label: 'Top-P', value: selectedItem.generationConfig.top_p, icon: Layers, color: 'text-purple-500' },
                                { label: 'Quant', value: selectedItem.generationConfig.quantization, icon: Zap, color: 'text-yellow-500' },
                            ].map((param, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white pl-3 pr-5 py-2.5 rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-default">
                                    <div className={`p-1.5 bg-gray-50 rounded-full ${param.color}`}>
                                        <param.icon size={14}/>
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">{param.label}</span>
                                        <span className="text-sm font-black text-gray-800">{param.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 검증 버튼 */}
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold transition-all text-sm shadow-md hover:shadow-lg
                                ${isAnalyzing
                                ? 'bg-gray-100 text-gray-400 cursor-wait'
                                : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 hover:-translate-y-0.5'
                            }`}
                        >
                            {isAnalyzing ? <Activity size={18} className="animate-spin"/> : <Microscope size={18}/>}
                            {isAnalyzing ? '분석 중...' : '검증 시작 (Start Detection)'}
                        </button>
                    </div>
                </div>

                {/* [하단] 분석 결과 */}
                {analyzeResult ? (
                    <div className="flex-1 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 border border-gray-100 mb-10">
                        <div className="bg-white px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BarChart3 size={18}/></div>
                                분석 결과 리포트
                            </h3>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2 shadow-sm border
                                ${analyzeResult.is_safe ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {analyzeResult.is_safe ? <CheckCircle2 size={16}/> : <XCircle size={16}/>}
                                {analyzeResult.verdict}
                            </div>
                        </div>

                        <div className="p-8">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-1.5 px-2">
                                    <Settings2 size={12}/> 상세 분석 지표 (Metrics)
                                </h4>
                                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50/60 text-xs text-gray-500 uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 border-b border-gray-100 first:rounded-tl-2xl">지표 (Metric)</th>
                                            <th className="px-6 py-4 border-b border-gray-100 w-32">값 (Value)</th>
                                            <th className="px-6 py-4 border-b border-gray-100 last:rounded-tr-2xl">설명 (Description)</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-gray-700 bg-white">
                                        <tr>
                                            <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2">TPR</td>
                                            <td className="px-6 py-4 font-black text-blue-600 text-base">{analyzeResult.scores.tpr}%</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs font-medium">진양성률 (True Positive Rate)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2">FPR</td>
                                            <td className="px-6 py-4 font-black text-gray-800 text-base">{analyzeResult.scores.fpr}%</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs font-medium">위양성률 (False Positive Rate)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold text-gray-800">ROC-AUC</td>
                                            <td className="px-6 py-4 font-black text-indigo-600 text-base">{analyzeResult.scores.roc_auc}</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs font-medium">전반적인 탐지 성능</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold text-gray-800 last:rounded-bl-2xl">Z-Score</td>
                                            <td className="px-6 py-4 font-black text-gray-800 text-base">{analyzeResult.scores.z_score}</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs font-medium last:rounded-br-2xl">통계적 유의성 점수</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // 결과 대기 상태
                    <div className="flex-1 min-h-[150px] bg-white border-2 border-gray-200 border-dashed rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-4 hover:bg-gray-50 transition-colors group mb-10">
                        <div className="p-4 bg-gray-50 rounded-full shadow-sm group-hover:shadow-md transition-all">
                            <Activity size={32} className="text-gray-300 group-hover:text-indigo-400 transition-colors"/>
                        </div>
                        <div className="text-center">
                            <span className="text-sm font-bold text-gray-600 block mb-1">분석 대기 중</span>
                            <span className="text-xs text-gray-400">'검증 시작' 버튼을 누르면 워터마크 분석이 시작됩니다.</span>
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