import { useState, useEffect } from 'react';
import { FileText, ArrowRight, Zap, MousePointerClick, Loader2 } from 'lucide-react';

// 👇 [필수] API 유틸리티 임포트
import { apiRequest } from '../utils/api';

export default function AttackPage({ history = [], attackType, onAnalyzeComplete }) {
    const [selectedId, setSelectedId] = useState(null);
    const [attackedText, setAttackedText] = useState(null);
    const [isAttacking, setIsAttacking] = useState(false);

    // 공격 강도 상태 (0~100)
    const [intensity, setIntensity] = useState(30);

    // 선택된 원본 글 찾기
    const selectedItem = history.find(item => item.id === selectedId);

    // 공격 유형이나 선택 글이 바뀌면 결과 초기화
    useEffect(() => {
        setAttackedText(null);
    }, [attackType, selectedId]);

    // 공격 실행 함수
    const handleExecuteAttack = async () => {
        if (!selectedItem) return;

        setIsAttacking(true);
        setAttackedText(null);

        try {
            // 1. 엔드포인트 설정
            // POST /api/attack/{generation_id}
            const endpoint = `/api/attack/${selectedItem.id}`;

            const requestBody = {
                attack_type: attackType,       // "deletion", "substitution", "summarization"
                attack_intensity: intensity    // 0 ~ 100
            };

            console.log("공격 요청:", endpoint, requestBody);

            // 2. 백엔드 통신 (apiRequest 사용)
            // 자동으로 JSON 파싱 및 공통 에러 처리가 수행됨
            const data = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            // 3. 결과 표시
            setAttackedText(data.output_text);

            // (선택사항) 분석 완료 알림
            if (onAnalyzeComplete) {
                // onAnalyzeComplete(data);
            }

        } catch (error) {
            console.error("Attack Error:", error);
            // api.js에서 파싱해준 백엔드 에러 메시지 출력
            alert(error.message);
        } finally {
            setIsAttacking(false);
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

                {/* 1. 좌측: 생성된 글 목록 (List) */}
                <div className="w-1/3 min-w-[280px] bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14}/> Generated History
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {history.length > 0 ? (
                            history.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border text-left
                                        ${selectedId === item.id
                                        ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-200 shadow-sm'
                                        : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className={`text-xs font-bold ${selectedId === item.id ? 'text-indigo-700' : 'text-gray-500'}`}>
                                            {item.model}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {item.date ? new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                        </span>
                                    </div>
                                    <p className={`text-sm line-clamp-2 ${selectedId === item.id ? 'text-indigo-900' : 'text-gray-600'}`}>
                                        {item.text}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-400">
                                생성된 기록이 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. 우측: 공격 실행 및 결과 (Workspace) */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">

                    {/* (A) 원본 뷰어 */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-y-auto">
                        <span className="absolute top-4 right-4 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded">Original</span>
                        {selectedItem ? (
                            // 👇 [수정] pr-24 클래스 추가 (배지 가림 방지)
                            <p className="text-gray-800 leading-relaxed text-lg pr-24">
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

                        {/* 공격 강도 슬라이더 */}
                        <div className="w-full max-w-md bg-gray-50 px-6 py-3 rounded-xl border border-gray-100 flex items-center gap-4">
                            <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Intensity ({intensity}%)</span>
                            <input
                                type="range" min="0" max="100" step="10"
                                value={intensity}
                                onChange={(e) => setIntensity(Number(e.target.value))}
                                disabled={isAttacking || !selectedItem}
                                className="w-full accent-red-500 h-2 bg-gray-200 rounded-lg cursor-pointer"
                            />
                        </div>

                        {/* 실행 버튼 */}
                        <button
                            onClick={handleExecuteAttack}
                            disabled={!selectedItem || isAttacking}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-md transition-all transform active:scale-95
        ${!selectedItem
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-red-500 text-black hover:bg-red-600 hover:shadow-lg hover:shadow-red-200'
                                // 👆 [수정됨] text-white -> text-black (활성 상태일 때 검은 글씨)
                            }`}
                        >
                            {isAttacking ? (
                                <Loader2 size={20} className="animate-spin"/>
                            ) : (
                                // 👇 [수정됨] 아이콘도 글씨랑 맞춰서 검은색(fill-black)으로 변경
                                <Zap size={20} className="fill-black"/>
                            )}
                            <span>{attackType.toUpperCase()} Attack 실행</span>
                            <ArrowRight size={20}/>
                        </button>
                    </div>

                    {/* (C) 공격 결과 뷰어 */}
                    <div className={`flex-1 border rounded-2xl p-6 shadow-sm relative overflow-y-auto transition-all duration-300 ...`}>
                        <span className="absolute top-4 right-4 px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">Result</span>
                        {attackedText ? (
                            // 👇 [수정] pr-24 클래스 추가
                            <p className="text-gray-800 leading-relaxed text-lg font-medium animate-in fade-in slide-in-from-bottom-2 pr-24">
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