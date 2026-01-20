import { useState } from 'react';
import { Send, Bot, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function ChatArea({ onTextGenerated, genConfig }) {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (e) {
            console.error('Copy failed:', e);
            alert('복사에 실패했습니다. 텍스트를 드래그해서 복사해주세요.');
        }
    };

    const handleSend = async () => {
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setResult(null);

        try {
            const requestBody = {
                ...genConfig,
                input_text: prompt,
            };

            const data = await apiRequest('/api/generations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            setResult(data.output_text);

            // ✅ output_text만 넘기지 말고 전체 넘기기 (id/model/wm/original_id 등)
            onTextGenerated?.(data);
        } catch (error) {
            console.error('Generate Error:', error);
            alert(error?.message || '생성 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading) handleSend();
        }
    };

    return (
        <div className="h-full w-full max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6 overflow-y-auto scrollbar-hide font-sans">
            {/* 1) INPUT */}
            <div className="flex-none bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Bot size={14} className="text-indigo-600" />
                        Input Prompt
                    </h3>
                    <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">
            {prompt.length} chars
          </span>
                </div>

                <div className="p-2">
          <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="여기에 프롬프트를 입력하세요... (예: 인공지능의 윤리적 문제에 대해 설명해줘)"
              className="w-full h-32 p-4 resize-none outline-none text-gray-800 placeholder-gray-300 text-[15px] leading-relaxed"
          />
                </div>

                <div className="px-4 py-3 bg-white border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSend}
                        disabled={!prompt.trim() || isLoading}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm
              ${prompt.trim() && !isLoading
                            ? 'bg-indigo-600 text-black hover:bg-indigo-700 shadow-md transform hover:-translate-y-0.5'
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {isLoading ? 'Generating...' : 'Generate Text'}
                    </button>
                </div>
            </div>

            {/* 2) OUTPUT */}
            <div className="flex-1 min-h-[300px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
                <div className="bg-indigo-50/50 px-5 py-3 border-b border-indigo-100/50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-2">
                        <Sparkles size={14} className="text-indigo-600" />
                        Generated Output
                    </h3>

                    {result && (
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                        >
                            {isCopied ? <Check size={12} /> : <Copy size={12} />}
                            {isCopied ? 'Copied!' : 'Copy Text'}
                        </button>
                    )}
                </div>

                <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 animate-pulse">
                            <Loader2 size={32} className="animate-spin text-indigo-300" />
                            <span className="text-sm font-medium">AI가 텍스트를 생성하고 있습니다...</span>
                        </div>
                    ) : result ? (
                        <div className="prose prose-indigo max-w-none">
                            <p className="text-gray-800 leading-7 whitespace-pre-wrap text-[15px]">
                                {result}
                            </p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3 select-none">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                                <Sparkles size={24} className="text-gray-200" />
                            </div>
                            <span className="text-sm">프롬프트를 입력하고 생성을 시작하세요.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
