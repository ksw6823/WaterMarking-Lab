import { useState, useEffect, useMemo } from 'react';
import {
    FileText, ArrowRight, Zap, MousePointerClick, Loader2,
    ChevronLeft, ChevronRight, Hash, Cpu
} from 'lucide-react';
import { apiRequest } from '../utils/api';

const ITEMS_PER_PAGE = 10;

export default function AttackPage({ history = [], attackType, onAnalyzeComplete }) {
    const [selectedId, setSelectedId] = useState(null);
    const [attackedText, setAttackedText] = useState(null);
    const [isAttacking, setIsAttacking] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [intensity, setIntensity] = useState(30);

    // ✅ history는 GenerationListItem 배열이라고 가정
    // generation_id 기준으로 선택
    const selectedItem = useMemo(
        () => history.find(item => item.generation_id === selectedId),
        [history, selectedId]
    );

    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentHistory = history.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setAttackedText(null);
    }, [attackType, selectedId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [history.length]);

    const handleExecuteAttack = async () => {
        if (!selectedItem) return;

        setIsAttacking(true);
        setAttackedText(null);

        try {
            const endpoint = `/api/generations/${selectedItem.generation_id}/attacks`;
            const finalIntensity = intensity === '' ? 0 : intensity;

            const requestBody = {
                attack_type: attackType,
                attack_intensity: finalIntensity,
            };

            const data = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            // 공격 결과 텍스트
            setAttackedText(data.output_text);

            // 부모에게 알림
            onAnalyzeComplete?.(data);
        } catch (error) {
            console.error("Attack Error:", error);
            alert(error.message);
        } finally {
            setIsAttacking(false);
        }
    };

    const handleIntensityInputChange = (e) => {
        const value = e.target.value;
        if (value === '') {
            setIntensity('');
            return;
        }

        const numValue = parseInt(value, 10);
        const MAX = 100;
        const MIN = 0;

        if (Number.isNaN(numValue)) return;

        if (numValue > MAX) setIntensity(MAX);
        else if (numValue < MIN) setIntensity(MIN);
        else setIntensity(numValue);
    };

    const handleBlur = () => {
        if (intensity === '') setIntensity(0);
    };

    // ✅ 원본/공격본 라벨
    const isAttackItem = (item) => !!item.attack_type || item.original_id != null;

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-6 py-8">
            {/* 헤더 */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Zap size={28} className="text-red-500" />
                    공격 시뮬레이션 (Adversarial Attack)
                </h1>
                <p className="text-gray-500 text-sm">
                    생성된 텍스트 목록에서 대상을 선택하고, 사이드바에서 설정한 공격({attackType})을 수행합니다.
                </p>
            </div>

            <div className="flex gap-6 h-full min-h-0">
                {/* 좌측: 생성된 글 목록 */}
                <div className="w-1/3 min-w-[300px] bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} /> History List
            </span>
                        <span className="text-[10px] text-gray-400 font-medium">
              Total: {history.length}
            </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/30">
                        {currentHistory.length > 0 ? (
                            currentHistory.map((item) => {
                                const isSelected = selectedId === item.generation_id;
                                const isAttack = isAttackItem(item);
                                const refOrig = item.original_id; // ✅ 핵심

                                return (
                                    <div
                                        key={item.generation_id}
                                        onClick={() => setSelectedId(item.generation_id)}
                                        className={`relative p-4 rounded-xl cursor-pointer transition-all border text-left group
                      ${isSelected
                                            ? 'bg-white border-indigo-500 ring-1 ring-indigo-200 shadow-md z-10'
                                            : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                {/* ID */}
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-mono">
                          ID: {item.generation_id}
                        </span>

                                                {/* ORIG / ATTACK */}
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border
                          ${isAttack ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          {isAttack ? 'ATTACK' : 'ORIG'}
                        </span>

                                                {/* ✅ 원본 참조 표시 (공격본일 때만) */}
                                                {refOrig != null && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1">
                            Ref Orig: {refOrig}
                          </span>
                                                )}
                                            </div>

                                            {/* 날짜 */}
                                            <span className="text-[10px] text-gray-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                      </span>
                                        </div>

                                        {/* 내용 요약 (input_text) */}
                                        <p className={`text-sm line-clamp-2 leading-relaxed ${isSelected ? 'text-gray-800' : 'text-gray-600'}`}>
                                            {item.input_text}
                                        </p>

                                        {/* 모델 정보 */}
                                        <div className="flex justify-end mt-2 gap-2">
                                            {item.watermark_enabled === false && (
                                                <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          WM OFF
                        </span>
                                            )}
                                            <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {item.model}
                      </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-10 text-center text-sm text-gray-400">
                                생성된 기록이 없습니다.
                            </div>
                        )}
                    </div>

                    {/* 페이지네이션 */}
                    <div className="p-3 border-t border-gray-100 bg-white flex justify-center items-center gap-3">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-bold text-gray-600">
              {currentPage} / {totalPages || 1}
            </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* 우측: 공격 실행 및 결과 */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    {/* 원본 뷰어 */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-y-auto">
            <span className="absolute top-4 right-4 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded">
              Original
            </span>

                        {selectedItem ? (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2">
                                <div className="mb-4 pb-3 border-b border-gray-100 flex items-center gap-3 pr-20">
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg font-bold border border-indigo-100 flex items-center gap-1.5">
                    <Hash size={12} /> ID: {selectedItem.generation_id}
                  </span>
                                    <span className="text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg font-bold border border-gray-200 flex items-center gap-1.5">
                    <Cpu size={12} className="text-gray-500" /> {selectedItem.model}
                  </span>
                                </div>

                                <p className="text-gray-800 leading-relaxed text-lg pr-2 whitespace-pre-wrap flex-1">
                                    {selectedItem.input_text}
                                </p>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <MousePointerClick size={40} className="mb-2 opacity-50" />
                                <p>왼쪽 목록에서 공격할 텍스트를 선택하세요.</p>
                            </div>
                        )}
                    </div>

                    {/* 액션 영역 */}
                    <div className="flex flex-col items-center justify-center py-2 gap-3">
                        <div className="w-full max-w-lg bg-gray-50 px-6 py-3 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap min-w-[80px]">
                Intensity (%)
              </span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={intensity === '' ? 0 : intensity}
                                onChange={(e) => setIntensity(Number(e.target.value))}
                                disabled={isAttacking || !selectedItem}
                                className="flex-1 accent-red-500 h-2 bg-gray-200 rounded-lg cursor-pointer"
                            />
                            <div className="relative w-16">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={intensity}
                                    onChange={handleIntensityInputChange}
                                    onBlur={handleBlur}
                                    disabled={isAttacking || !selectedItem}
                                    className="w-full px-2 py-1 text-center text-sm font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700 disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleExecuteAttack}
                            disabled={!selectedItem || isAttacking}
                            className={`flex items-center gap-2 px-10 py-3 rounded-full font-bold shadow-md transition-all transform active:scale-95
                ${!selectedItem
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-red-500 text-black hover:bg-red-600 hover:shadow-lg'
                            }`}
                        >
                            {isAttacking ? (
                                <Loader2 size={20} className="animate-spin text-white" />
                            ) : (
                                <Zap size={20} className="fill-white" />
                            )}
                            <span>{attackType.toUpperCase()} Attack 실행</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    {/* 공격 결과 뷰어 */}
                    <div
                        className={`flex-1 border rounded-2xl p-6 shadow-sm relative overflow-y-auto transition-all duration-300
              ${attackedText ? 'border-red-200 bg-red-50/10' : 'border-gray-200 bg-white'}`}
                    >
            <span className="absolute top-4 right-4 px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">
              Result
            </span>

                        {attackedText ? (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2">
                                <div className="mb-4 pb-3 border-b border-red-200/50 flex items-center gap-2">
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg font-bold border border-indigo-100 flex items-center gap-1.5">
                    <Hash size={12} /> Ref Orig: {selectedItem?.generation_id}
                  </span>
                                </div>

                                <p className="text-gray-800 leading-relaxed text-lg font-medium pr-2 whitespace-pre-wrap flex-1">
                                    {attackedText}
                                </p>
                            </div>
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
