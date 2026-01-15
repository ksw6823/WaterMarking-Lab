import {
    History, Settings, Cpu, Activity, MessageSquare,
    ShieldCheck, Zap, ToggleLeft, ToggleRight, Sparkles,
    AlertTriangle
} from 'lucide-react';

export default function Sidebar({
                                    activeTab,
                                    onTabChange,
                                    genConfig,
                                    onConfigChange,
                                    attackType,
                                    onAttackTypeChange
                                }) {

    const toggleWm = () => {
        onConfigChange({
            ...genConfig,
            watermark_enabled: !genConfig.watermark_enabled
        });
    };

    const updateConfig = (key, value, isNumber = false) => {
        onConfigChange({
            ...genConfig,
            [key]: isNumber ? parseFloat(value) : value
        });
    };

    const getTabClass = (id) => `
        flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-200 border
        ${activeTab === id
        ? 'bg-white border-transparent text-black shadow-md font-black z-10'
        : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600 font-medium'
    }
    `;

    return (
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-[2px_0_20px_rgba(0,0,0,0.02)] z-20 font-sans">

            {/* 1. 헤더 */}
            <div className="p-6 border-b border-gray-100 flex-none">
                <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2 tracking-tight">
                    SynthID <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold tracking-wider uppercase border border-indigo-100">Testbed</span>
                </h1>
            </div>

            {/* 2. 메인 네비게이션 */}
            <div className="p-4 flex-none">
                <div className="grid grid-cols-2 gap-2 bg-gray-50/80 p-2 rounded-2xl border border-gray-100">
                    <button onClick={() => onTabChange('generate')} className={getTabClass('generate')}>
                        <MessageSquare size={18} /> <span className="text-xs">생성 (Gen)</span>
                    </button>
                    <button onClick={() => onTabChange('verify')} className={getTabClass('verify')}>
                        <ShieldCheck size={18} /> <span className="text-xs">검증 (Verify)</span>
                    </button>
                    <button onClick={() => onTabChange('attack')} className={getTabClass('attack')}>
                        <Zap size={18} /> <span className="text-xs">공격 (Attack)</span>
                    </button>
                    <button onClick={() => onTabChange('history')} className={getTabClass('history')}>
                        <History size={18} /> <span className="text-xs">조회 (History)</span>
                    </button>
                </div>
            </div>

            {/* 3. 설정 컨트롤 영역 (스크롤 가능) */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-8 scrollbar-hide">

                {/* ✨ CASE A: 오직 '생성(Generate)' 탭일 때만 보이는 설정들 ✨ */}
                {activeTab === 'generate' && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300 space-y-8">

                        {/* 1. Target Model (이제 생성 탭에서만 보임!) */}
                        <section>
                            <label className="text-[11px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                                <Cpu size={12} /> Target Model
                            </label>
                            <div className="relative">
                                <select
                                    value={genConfig.model}
                                    onChange={(e) => updateConfig('model', e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all"
                                >
                                    <option value="Llama-3-8B">Llama-3-8B</option>
                                    <option value="Gemma-2-2B">Gemma-2-2B</option>
                                    <option value="Mistral-7B">Mistral-7B</option>
                                </select>
                            </div>
                        </section>

                        {/* 2. Quantization */}
                        <section>
                            <label className="text-[11px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                                <Settings size={12} /> Quantization
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {['FP16', '8-bit', '4-bit'].map((bit) => (
                                    <button
                                        key={bit}
                                        onClick={() => updateConfig('quantization', bit)}
                                        className={`py-2.5 text-xs rounded-xl transition-all duration-200 border
                                        ${genConfig.quantization === bit
                                            ? 'bg-white border-transparent text-black font-black shadow-md ring-1 ring-gray-100'
                                            : 'bg-white border-gray-100 text-gray-400 font-medium hover:bg-gray-50'
                                        }`}>
                                        {bit}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 3. Sampling Params */}
                        <section className="space-y-5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                                <Activity size={12} /> Sampling Params
                            </label>

                            <div className="group">
                                <div className="flex justify-between text-xs mb-2 font-medium text-gray-600">
                                    <span>Temperature</span>
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900">{genConfig.temperature}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.1"
                                    value={genConfig.temperature}
                                    onChange={(e) => updateConfig('temperature', e.target.value, true)}
                                    className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                />
                            </div>

                            <div className="group">
                                <div className="flex justify-between text-xs mb-2 font-medium text-gray-600">
                                    <span>Top-k</span>
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900">{genConfig.top_k}</span>
                                </div>
                                <input
                                    type="range" min="1" max="100"
                                    value={genConfig.top_k}
                                    onChange={(e) => updateConfig('top_k', e.target.value, true)}
                                    className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                />
                            </div>

                            <div className="group">
                                <div className="flex justify-between text-xs mb-2 font-medium text-gray-600">
                                    <span>Top-p</span>
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900">{genConfig.top_p}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={genConfig.top_p}
                                    onChange={(e) => updateConfig('top_p', e.target.value, true)}
                                    className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                />
                            </div>
                        </section>
                    </div>
                )}

                {/* ✨ CASE B: 오직 '공격(Attack)' 탭일 때만 보이는 설정 ✨ */}
                {activeTab === 'attack' && (
                    <section className="animate-in fade-in slide-in-from-left-2 duration-300">
                        <label className="text-[11px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                            <AlertTriangle size={12} /> Attack Strategy
                        </label>
                        <div className="space-y-3">
                            {[
                                { id: 'deletion', label: '삭제 (Deletion)', desc: '임의의 단어/문장 삭제' },
                                { id: 'substitution', label: '치환 (Substitution)', desc: '유의어로 단어 교체' },
                                { id: 'summarization', label: '요약 (Summarization)', desc: 'LLM 기반 내용 요약' },
                            ].map((type) => (
                                <div
                                    key={type.id}
                                    onClick={() => onAttackTypeChange(type.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all relative ${
                                        attackType === type.id
                                            ? 'bg-white border-transparent shadow-md ring-1 ring-gray-100'
                                            : 'bg-white border-gray-100 hover:border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                                            attackType === type.id ? 'border-black bg-black' : 'border-gray-300'
                                        }`}>
                                            {attackType === type.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        <span className={`text-sm font-bold ${attackType === type.id ? 'text-black font-black' : 'text-gray-400'}`}>
                                            {type.label}
                                        </span>
                                    </div>
                                    <p className={`text-xs pl-5 ${attackType === type.id ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {type.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="h-4"></div>
            </div>

            {/* 4. 워터마크 토글 (역시 생성 탭에서만 보임) */}
            {activeTab === 'generate' && (
                <div className="p-6 border-t border-gray-100 bg-white flex-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${genConfig.watermark_enabled ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles size={12} className={genConfig.watermark_enabled ? "text-indigo-600" : "text-gray-400"} />
                                Watermark
                            </label>
                            <button onClick={toggleWm} className="transition-transform active:scale-95 focus:outline-none">
                                {genConfig.watermark_enabled
                                    ? <ToggleRight size={28} className="text-indigo-600" />
                                    : <ToggleLeft size={28} className="text-gray-300" />
                                }
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                            {genConfig.watermark_enabled
                                ? <span className="text-indigo-600 font-bold">워터마킹 활성화됨</span>
                                : <span>워터마킹 꺼짐</span>
                            }
                        </p>
                    </div>
                </div>
            )}
        </aside>
    );
}