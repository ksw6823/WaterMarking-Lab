import { useState } from 'react';
import { Search, ShieldCheck, Hash, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function VerificationPage({ onAnalyzeComplete }) {
    const [inputId, setInputId] = useState('');
    const [status, setStatus] = useState('idle');

    const handleVerify = async () => {
        if (!inputId.trim()) return;
        setStatus('analyzing');

        try {
            const endpoint = `/api/detect/${inputId}`;
            console.log(`검증 요청: ${endpoint}`);

            const data = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({})
            });

            const dashboardFormat = {
                verdict: data.is_watermarked ? "Watermark Detected" : "No Watermark",
                status: data.is_watermarked ? "Safe" : "Unknown",
                confidence: (data.confidence * 100).toFixed(1),
                tpr: (data.true_positive_rate * 100).toFixed(1),
                ppl: data.z_score,
                bleu: data.bleu_score,
                modelA: { name: "Target Model", score: (data.confidence * 100).toFixed(0) },
                modelB: { name: "Others", score: (100 - data.confidence * 100).toFixed(0) }
            };

            setStatus('done');

            if(onAnalyzeComplete) {
                onAnalyzeComplete(dashboardFormat);
            }

        } catch (error) {
            console.error("Verification Error:", error);
            alert(error.message);
            setStatus('idle');
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 py-8 relative">

            {/* 헤더 */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                    <ShieldCheck className="text-indigo-600" />
                    워터마크 탐지 (Watermark Detection)
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                    생성된 텍스트의 ID를 입력하여 SynthID 워터마크 패턴을 분석합니다.
                </p>
            </div>

            {/* 입력 영역 */}
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative max-h-[300px]">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                        <Hash size={14}/> TARGET GENERATION ID
                    </span>
                </div>

                <div className="flex-1 relative p-8 flex flex-col justify-center items-center">
                    {/* 로딩 오버레이 */}
                    {status === 'analyzing' && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <Loader2 size={40} className="animate-spin text-indigo-600 mb-3"/>
                            <span className="font-bold text-indigo-600 animate-pulse">Analyzing Watermark...</span>
                        </div>
                    )}

                    <input
                        type="number"
                        className="w-full max-w-md p-4 text-center text-3xl font-black text-gray-900 border-b-2 border-indigo-100 focus:border-indigo-600 outline-none transition-colors placeholder-gray-200"
                        placeholder="ID 입력 (예: 1)"
                        value={inputId}
                        onChange={(e) => setInputId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    />
                    <p className="text-sm text-gray-400 mt-4">
                        분석할 텍스트의 고유 ID(Generation ID)를 입력하세요.
                    </p>
                </div>

                {/* 하단 액션 버튼 */}
                <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                    <button
                        onClick={handleVerify}
                        disabled={!inputId.trim() || status === 'analyzing'}
                        // ✨ [수정] 입력값이 있으면: 흰 배경 + 검은 테두리 + 검은 글씨
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-200
                            ${!inputId.trim()
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed' // 비활성
                            : 'bg-white border-2 border-black text-black hover:bg-gray-50 shadow-md transform hover:-translate-y-0.5' // 활성
                        }
                        `}
                    >
                        {status === 'analyzing' ? <Loader2 size={18} className="animate-spin"/> : <Search size={18} />}
                        Start Detection
                    </button>
                </div>
            </div>
        </div>
    );
}