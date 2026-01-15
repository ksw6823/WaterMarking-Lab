import { useState, useEffect } from 'react';
import {
    FileText, ShieldCheck, Clock, Search,
    CheckCircle, AlertTriangle, Calendar, X,
    Zap, Loader2, Fingerprint, Sliders
} from 'lucide-react';

// 👇 [필수] API 유틸리티 임포트
import { apiRequest } from '../utils/api';

export default function HistoryPage() {
    const [searchTerm, setSearchTerm] = useState('');

    // [State] 데이터 관리
    const [genHistory, setGenHistory] = useState([]);      // 좌측 리스트
    const [verifyHistory, setVerifyHistory] = useState([]); // 우측 리스트

    // [State] 로딩 상태
    const [isLoadingGen, setIsLoadingGen] = useState(true);
    const [isLoadingVer, setIsLoadingVer] = useState(true);
    const [isModalLoading, setIsModalLoading] = useState(false);

    // [State] 선택된 상세 아이템 (모달용)
    const [selectedItem, setSelectedItem] = useState(null);

    // 초기 데이터 로드
    useEffect(() => {
        fetchHistoryList();
        fetchVerificationList();
    }, []);

    // 1. 좌측 목록 조회 (GET /api/generations)
    const fetchHistoryList = async () => {
        try {
            // [수정] apiRequest 사용 (자동 에러 처리 & JSON 파싱)
            const data = await apiRequest('/api/generations?page=1&page_size=50');
            setGenHistory(data.items);
        } catch (error) {
            console.error("History List Error:", error);
            // 리스트 로딩 실패는 alert보다 조용히 로그만 남기는 게 UX상 좋을 수 있음
        } finally {
            setIsLoadingGen(false);
        }
    };

    // 2. 우측 목록 조회 (GET /api/detections)
    const fetchVerificationList = async () => {
        try {
            // [수정] apiRequest 사용
            const data = await apiRequest('/api/detections?page=1&page_size=50');
            setVerifyHistory(data.items);
        } catch (error) {
            console.error("Verification List Error:", error);
        } finally {
            setIsLoadingVer(false);
        }
    };

    // 3. 단일 상세 조회 함수 (클릭 시 실행)
    const handleItemClick = async (id, type) => {
        setSelectedItem({ type }); // 모달 먼저 열기
        setIsModalLoading(true);

        try {
            const endpoint = type === 'gen'
                ? `/api/generations/${id}`
                : `/api/detections/${id}`;

            // [수정] apiRequest 사용
            // 백엔드 에러(404 등) 발생 시 api.js에서 throw Error를 던짐
            const detailData = await apiRequest(endpoint);

            // 데이터 업데이트
            setSelectedItem({ ...detailData, type });

        } catch (error) {
            console.error("Detail Fetch Error:", error);
            alert(error.message); // 예: "해당 generation_id를 찾을 수 없습니다."
            setSelectedItem(null); // 에러나면 모달 닫기
        } finally {
            setIsModalLoading(false);
        }
    };

    // 날짜 포맷팅 헬퍼
    const formatDate = (isoString) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    };

    return (
        <div className="flex flex-col h-full w-full px-6 py-6 font-sans relative">

            {/* 헤더 */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Clock size={28} className="text-indigo-600"/>
                        통합 이력 조회 (History)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        과거 생성 내역과 검증 결과를 상세하게 확인하세요.
                    </p>
                </div>
                {/* 검색창 UI */}
                <div className="relative w-72">
                    <input type="text" placeholder="기록 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"/>
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                </div>
            </div>

            {/* 메인 컨텐츠 (2단 분할) */}
            <div className="flex-1 flex gap-6 min-h-0">

                {/* [좌측] 생성 기록 리스트 */}
                <div className="flex-1 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-indigo-50/30 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><FileText size={18} /></div>
                            <h2 className="font-bold text-gray-700">생성 기록</h2>
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border">Total: {genHistory.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoadingGen ? (
                            <div className="flex justify-center items-center h-40 text-gray-400 gap-2"><Loader2 size={24} className="animate-spin" /> 로딩 중...</div>
                        ) : (
                            genHistory.map((item) => (
                                <div
                                    key={item.generation_id}
                                    onClick={() => handleItemClick(item.generation_id, 'gen')}
                                    className="group p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer bg-white"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">{item.model}</span>
                                            {item.attack_type && (
                                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase border border-red-100">
                                                    <Zap size={10} className="fill-red-600"/> {item.attack_type}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-gray-400 flex items-center gap-1"><Calendar size={12}/> {formatDate(item.created_at)}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-indigo-700 transition-colors">{item.input_text}</h3>
                                    <div className="flex items-center gap-2 mt-3">
                                        {item.watermark_enabled ? (
                                            <span className="text-[10px] flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold border border-green-100"><CheckCircle size={10} /> Watermarked</span>
                                        ) : (
                                            <span className="text-[10px] flex items-center gap-1 text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-bold border border-gray-200">Not Applied</span>
                                        )}
                                        <span className="text-[10px] text-gray-300 ml-auto">ID: {item.generation_id}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* [우측] 검증 기록 리스트 */}
                <div className="flex-1 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-green-50/30 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ShieldCheck size={18} /></div>
                            <h2 className="font-bold text-gray-700">검증 기록</h2>
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border">Total: {verifyHistory.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoadingVer ? (
                            <div className="flex justify-center items-center h-40 text-gray-400 gap-2"><Loader2 size={24} className="animate-spin" /> 로딩 중...</div>
                        ) : (
                            verifyHistory.map((item) => (
                                <div
                                    key={item.detection_id}
                                    onClick={() => handleItemClick(item.detection_id, 'verify')}
                                    className="group p-4 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all cursor-pointer bg-white"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">Gen ID: {item.generation_id}</span>
                                        <span className="text-[11px] text-gray-400 flex items-center gap-1"><Calendar size={12}/> {formatDate(item.created_at)}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-2">{item.input_text_preview}</h3>
                                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 mt-2 group-hover:bg-white border border-transparent group-hover:border-green-100 transition-colors">
                                        <div className="flex items-center gap-2">
                                            {item.is_watermarked ? (
                                                <><CheckCircle size={16} className="text-green-500" /><span className="text-xs font-bold text-green-700">Detected</span></>
                                            ) : (
                                                <><AlertTriangle size={16} className="text-gray-400" /><span className="text-xs font-bold text-gray-600">Not Detected</span></>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-400 mr-1">Conf.</span>
                                            <span className="text-sm font-black text-gray-800">{(item.confidence * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 상세 정보 모달 */}
            {selectedItem && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-10 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl max-h-[90%] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* 헤더 */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${selectedItem.type === 'gen' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                        {selectedItem.type === 'gen' ? 'GENERATION DETAIL' : 'DETECTION DETAIL'}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {selectedItem.type === 'gen' ? `ID: ${selectedItem.generation_id}` : `Detection ID: ${selectedItem.detection_id}`}
                                </h2>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X size={20} /></button>
                        </div>

                        {/* 내용 */}
                        {isModalLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                                <Loader2 size={32} className="animate-spin text-indigo-600" />
                                <span className="text-sm font-medium">상세 정보를 불러오는 중입니다...</span>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><FileText size={14}/> Full Text</h3>
                                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                        {selectedItem.input_text || selectedItem.output_text || "내용 없음"}
                                    </div>
                                </div>

                                {selectedItem.type === 'gen' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-50">
                                            <h4 className="text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center gap-1"><Sliders size={12}/> Config</h4>
                                            <ul className="space-y-2 text-sm">
                                                <li className="flex justify-between"><span className="text-gray-500">Model</span> <span className="font-bold">{selectedItem.model}</span></li>
                                                <li className="flex justify-between"><span className="text-gray-500">Quantization</span> <span className="font-bold">{selectedItem.quantization}</span></li>
                                                <li className="flex justify-between"><span className="text-gray-500">Temp</span> <span className="font-bold">{selectedItem.temperature}</span></li>
                                                <li className="flex justify-between"><span className="text-gray-500">Top-K</span> <span className="font-bold">{selectedItem.top_k}</span></li>
                                                <li className="flex justify-between"><span className="text-gray-500">Top-P</span> <span className="font-bold">{selectedItem.top_p}</span></li>
                                            </ul>
                                        </div>
                                        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-50">
                                            <h4 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center gap-1"><Fingerprint size={12}/> Watermark</h4>
                                            <ul className="space-y-2 text-sm">
                                                <li className="flex justify-between"><span className="text-gray-500">Enabled</span> <span className={`font-bold ${selectedItem.watermark_enabled ? 'text-green-600' : 'text-gray-400'}`}>{selectedItem.watermark_enabled ? 'True' : 'False'}</span></li>
                                                <li className="flex justify-between"><span className="text-gray-500">G-Value</span> <span className="font-bold">{selectedItem.g_value}</span></li>
                                                <li className="flex justify-between"><span className="text-gray-500">Window</span> <span className="font-bold">{selectedItem.context_width}</span></li>
                                                <li className="flex justify-between"><span className="text-gray-500">Key</span> <span className="font-mono text-xs bg-white px-1 rounded">{selectedItem.watermark_key}</span></li>
                                            </ul>
                                        </div>
                                        {selectedItem.attack_type && (
                                            <div className="col-span-2 bg-red-50 p-4 rounded-xl border border-red-100">
                                                <div className="flex items-center gap-2 text-red-600 font-bold mb-2 text-sm"><Zap size={16}/> Attack Applied</div>
                                                <div className="flex gap-6 text-sm">
                                                    <div><span className="text-gray-500">Type:</span> <span className="font-bold ml-1">{selectedItem.attack_type}</span></div>
                                                    <div><span className="text-gray-500">Intensity:</span> <span className="font-bold ml-1">{selectedItem.attack_intensity}%</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 border rounded-xl bg-gray-50 text-center">
                                            <div className="text-xs text-gray-500 mb-1">Confidence</div>
                                            <div className="text-xl font-bold text-indigo-600">{(selectedItem.confidence * 100).toFixed(1)}%</div>
                                        </div>
                                        <div className="p-3 border rounded-xl bg-gray-50 text-center">
                                            <div className="text-xs text-gray-500 mb-1">Z-Score</div>
                                            <div className="text-xl font-bold text-gray-800">{selectedItem.z_score}</div>
                                        </div>
                                        <div className="p-3 border rounded-xl bg-gray-50 text-center">
                                            <div className="text-xs text-gray-500 mb-1">P-Value</div>
                                            <div className="text-xl font-bold text-gray-800">{selectedItem.p_value}</div>
                                        </div>
                                        <div className="p-3 border rounded-xl bg-gray-50 text-center">
                                            <div className="text-xs text-gray-500 mb-1">ROC-AUC</div>
                                            <div className="text-xl font-bold text-blue-600">{selectedItem.roc_auc}</div>
                                        </div>
                                        <div className="p-3 border rounded-xl bg-gray-50 text-center">
                                            <div className="text-xs text-gray-500 mb-1">BLEU</div>
                                            <div className="text-xl font-bold text-blue-600">{selectedItem.bleu_score}</div>
                                        </div>
                                        <div className="p-3 border rounded-xl bg-gray-50 text-center">
                                            <div className="text-xs text-gray-500 mb-1">TPR</div>
                                            <div className="text-xl font-bold text-green-600">{selectedItem.true_positive_rate}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setSelectedItem(null)} className="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}