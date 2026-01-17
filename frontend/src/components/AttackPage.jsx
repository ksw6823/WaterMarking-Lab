import { useState, useEffect } from 'react';
import {
    FileText, ArrowRight, Zap, MousePointerClick, Loader2,
    ChevronLeft, ChevronRight, Calendar, Hash
} from 'lucide-react';
import { apiRequest } from '../utils/api';

const ITEMS_PER_PAGE = 10; // 페이지당 10개씩

export default function AttackPage({ history = [], attackType, onAnalyzeComplete }) {
    const [selectedId, setSelectedId] = useState(null);
    const [attackedText, setAttackedText] = useState(null);
    const [isAttacking, setIsAttacking] = useState(false);

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);

    // 공격 강도 상태 (0~100)
    const [intensity, setIntensity] = useState(30);

    const selectedItem = history.find(item => item.id === selectedId);

    // 페이지네이션 계산
    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentHistory = history.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // 공격 유형이나 선택 글이 바뀌면 결과 초기화
    useEffect(() => {
        setAttackedText(null);
    }, [attackType, selectedId]);

    // history 데이터가 바뀌면 1페이지로 리셋 (선택사항)
    useEffect(() => {
        setCurrentPage(1);
    }, [history.length]);

    // 공격 실행 함수
    const handleExecuteAttack = async () => {
        if (!selectedItem) return;

        setIsAttacking(true);
        setAttackedText(null);

        try {
            const endpoint = `/api/generations/${selectedItem.id}/attacks`;
            const finalIntensity = intensity === '' ? 0 : intensity;

            const requestBody = {
                attack_type: attackType,
                attack_intensity: finalIntensity
            };

            console.log("공격 요청:", endpoint, requestBody);

            const data = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            setAttackedText(data.output_text);

            if (onAnalyzeComplete) {
                // onAnalyzeComplete(data);
            }

        } catch (error) {
            console.error("Attack Error:", error);
            alert(error.message);
        } finally {
            setIsAttacking(false);
        }
    };

    // 입력 핸들러 (onChange)
    const handleIntensityInputChange = (e) => {
        const value = e.target.value;
        if (value === '') {
            setIntensity('');
            return;
        }
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
            setIntensity(numValue);
        }
    };

    // 포커스 해제 핸들러 (onBlur)
    const handleBlur = () => {
        if (intensity === '') {
            setIntensity(0);
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-6 py-8">

            {/* 헤더 */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Zap size={28} className="text-red-500"/>
                    공격 시뮬레이션 (Adversarial Attack)
                </h1>
                <p className="text-gray-500 text-sm">
                    생성된 텍스트 목록에서 대상을 선택하고, 사이드바에서 설정한 공격({attackType})을 수행합니다.
                </p>
            </div>

            <div className="flex gap-6 h-full min-h-0">

                {/* 1. 좌측: 생성된 글 목록 (페이지네이션 적용) */}
                <div className="w-1/3 min-w-[300px] bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14}/> History List
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                            Total: {history.length}
                        </span>
                    </div>

                    {/* 리스트 영역 */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/30">
                        {currentHistory.length > 0 ? (
                            currentHistory.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    className={`relative p-4 rounded-xl cursor-pointer transition-all border text-left group
                                        ${selectedId === item.id
                                        ? 'bg-white border-indigo-500 ring-1 ring-indigo-200 shadow-md z-10'
                                        : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'
                                    }`}
                                >
                                    {/* 상단 라인: ID와 날짜 상세 표시 */}
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1
                                            ${selectedId === item.id ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <Hash size={10}/> {item.id}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Calendar size={10}/>
                                            {item.date ? new Date(item.date).toLocaleString('ko-KR', {
                                                year: '2-digit', month: 'numeric', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            }) : '-'}
                                        </span>
                                    </div>

                                    {/* 하단 라인: 내용 요약 */}
                                    <p className={`text-sm line-clamp-2 leading-relaxed mb-2 ${selectedId === item.id ? 'text-gray-800' : 'text-gray-600'}`}>
                                        {item.text}
                                    </p>

                                    {/* 모델명 뱃지 */}
                                    <div className="flex justify-end">
                                        <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                            {item.model}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-sm text-gray-400">
                                생성된 기록이 없습니다.
                            </div>
                        )}
                    </div>

                    {/* 페이지네이션 컨트롤 (푸터) */}
                    <div className="p-3 border-t border-gray-100 bg-white flex justify-center items-center gap-3">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16}/>
                        </button>

                        <span className="text-xs font-bold text-gray-600">
                            {currentPage} / {totalPages || 1}
                        </span>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16}/>
                        </button>
                    </div>
                </div>

                {/* 2. 우측: 공격 실행 및 결과 */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">

                    {/* (A) 원본 뷰어 */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-y-auto">
                        <span className="absolute top-4 right-4 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded">Original</span>
                        {selectedItem ? (
                            <p className="text-gray-800 leading-relaxed text-lg pr-24 whitespace-pre-wrap">
                                {selectedItem.text}
                            </p>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <MousePointerClick size={40} className="mb-2 opacity-50"/>
                                <p>왼쪽 목록에서 공격할 텍스트를 선택하세요.</p>
                            </div>
                        )}
                    </div>

                    {/* (B) 액션 영역 (강도 조절 + 실행 버튼) */}
                    <div className="flex flex-col items-center justify-center py-2 gap-3">

                        {/* 공격 강도 조절 */}
                        <div className="w-full max-w-lg bg-gray-50 px-6 py-3 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
                            <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap min-w-[80px]">
                                Intensity (%)
                            </span>
                            <input
                                type="range" min="0" max="100" step="1"
                                value={intensity === '' ? 0 : intensity}
                                onChange={(e) => setIntensity(Number(e.target.value))}
                                disabled={isAttacking || !selectedItem}
                                className="flex-1 accent-red-500 h-2 bg-gray-200 rounded-lg cursor-pointer"
                            />
                            <div className="relative w-16">
                                <input
                                    type="number"
                                    min="0" max="100"
                                    value={intensity}
                                    onChange={handleIntensityInputChange}
                                    onBlur={handleBlur}
                                    disabled={isAttacking || !selectedItem}
                                    className="w-full px-2 py-1 text-center text-sm font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* 실행 버튼 */}
                        <button
                            onClick={handleExecuteAttack}
                            disabled={!selectedItem || isAttacking}
                            className={`flex items-center gap-2 px-10 py-3 rounded-full font-bold shadow-md transition-all transform active:scale-95
                                ${!selectedItem
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-red-500 text-black hover:bg-red-600 hover:shadow-lg hover:shadow-red-200'
                            }`}
                        >
                            {isAttacking ? (
                                <Loader2 size={20} className="animate-spin text-white"/>
                            ) : (
                                <Zap size={20} className="fill-white"/>
                            )}
                            <span>{attackType.toUpperCase()} Attack 실행</span>
                            <ArrowRight size={20}/>
                        </button>
                    </div>

                    {/* (C) 공격 결과 뷰어 */}
                    <div className={`flex-1 border rounded-2xl p-6 shadow-sm relative overflow-y-auto transition-all duration-300 
                        ${attackedText ? 'border-red-200 bg-red-50/10' : 'border-gray-200 bg-white'}`}>
                        <span className="absolute top-4 right-4 px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">Result</span>
                        {attackedText ? (
                            <p className="text-gray-800 leading-relaxed text-lg font-medium animate-in fade-in slide-in-from-bottom-2 pr-24 whitespace-pre-wrap">
                                {attackedText}
                            </p>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                결과가 여기에 표시됩니다.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}