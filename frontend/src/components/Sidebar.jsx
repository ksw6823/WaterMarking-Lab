import { useEffect, useMemo, useState } from 'react';
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
    // ---- 1) 유틸: 숫자 규칙/기본값 ----
    const LIMITS = useMemo(() => ({
        temperature: { min: 0, max: 1, step: 0.1, default: 0.7 },
        top_p: { min: 0, max: 1, step: 0.05, default: 0.9 },
        top_k: { min: 1, max: 100, step: 1, default: null }, // ✅ 스키마: Optional[int], ge=1
    }), []);

    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    const toNumberOrNull = (raw) => {
        // raw: string from input
        if (raw === '' || raw == null) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    };

    // ---- 2) genConfig 업데이트 (항상 number|null만 들어가게) ----
    const patchConfig = (patch) => {
        onConfigChange({ ...genConfig, ...patch });
    };

    const updateText = (key, value) => {
        patchConfig({ [key]: value });
    };

    const updateNumber = (key, rawOrNumber) => {
        // rawOrNumber: string(인풋) or number
        const limit = LIMITS[key];

        let n =
            typeof rawOrNumber === 'number'
                ? rawOrNumber
                : toNumberOrNull(rawOrNumber);

        // null 허용 필드(top_k 등)도 있음
        if (n == null) {
            patchConfig({ [key]: null });
            return;
        }

        // 정수 필드 처리
        if (key === 'top_k') n = Math.trunc(n);

        // 범위 제한
        if (limit) n = clamp(n, limit.min, limit.max);

        patchConfig({ [key]: n });
    };

    // ---- 3) 숫자 input의 "입력중 빈칸 허용"을 위해 draft state 분리 ----
    // genConfig는 항상 number|null, draft는 string(빈칸 허용)
    const [draftNums, setDraftNums] = useState(() => ({
        temperature: genConfig.temperature ?? '',
        top_p: genConfig.top_p ?? '',
        top_k: genConfig.top_k ?? '',
    }));

    // 바깥에서 genConfig가 바뀌면 draft도 동기화
    useEffect(() => {
        setDraftNums({
            temperature: genConfig.temperature ?? '',
            top_p: genConfig.top_p ?? '',
            top_k: genConfig.top_k ?? '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [genConfig.temperature, genConfig.top_p, genConfig.top_k]);

    const handleNumInputChange = (key, raw) => {
        // 1) draft에는 그대로 저장(빈칸 포함)
        setDraftNums((prev) => ({ ...prev, [key]: raw }));

        // 2) genConfig에는 안전한 값만 저장 (빈칸이면 null)
        // 입력 중에도 실시간으로 clamp 해서 안정 유지
        if (raw === '') {
            patchConfig({ [key]: null });
            return;
        }

        const n = toNumberOrNull(raw);
        if (n == null) return; // 숫자 아니면 무시 (e.g. '-', 'e')
        updateNumber(key, n);
    };

    const handleNumInputBlur = (key) => {
        const limit = LIMITS[key];
        const raw = draftNums[key];

        // 빈칸이면 기본값 or null 처리
        if (raw === '' || raw == null) {
            // temperature/top_p는 기본값으로 복구, top_k는 null 유지(선택)
            const def = limit?.default ?? null;

            patchConfig({ [key]: def });
            setDraftNums((prev) => ({ ...prev, [key]: def ?? '' }));
            return;
        }

        // 숫자면 최종 clamp + 타입 확정
        let n = toNumberOrNull(raw);
        if (n == null) {
            const def = limit?.default ?? null;
            patchConfig({ [key]: def });
            setDraftNums((prev) => ({ ...prev, [key]: def ?? '' }));
            return;
        }

        if (key === 'top_k') n = Math.trunc(n);
        if (limit) n = clamp(n, limit.min, limit.max);

        patchConfig({ [key]: n });
        setDraftNums((prev) => ({ ...prev, [key]: n }));
    };

    // ---- 4) 워터마크 토글 ----
    const toggleWm = () => {
        patchConfig({ watermark_enabled: !genConfig.watermark_enabled });
    };

    // ---- 5) 탭 스타일 ----
    const getTabClass = (id) => `
    flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-200 border
    ${activeTab === id
        ? 'bg-white border-transparent text-black shadow-md font-black z-10'
        : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600 font-medium'
    }
  `;

    // ---- 6) 렌더 ----
    return (
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-[2px_0_20px_rgba(0,0,0,0.02)] z-20 font-sans">

            {/* 1. 헤더 */}
            <div className="p-6 border-b border-gray-100 flex-none">
                <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2 tracking-tight">
                    SynthID{' '}
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold tracking-wider uppercase border border-indigo-100">
            Testbed
          </span>
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

            {/* 3. 설정 컨트롤 영역 */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-8 scrollbar-hide">

                {activeTab === 'generate' && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300 space-y-8">

                        {/* Target Model */}
                        <section>
                            <label className="text-[11px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                                <Cpu size={12} /> Target Model
                            </label>
                            <div className="relative">
                                <select
                                    value={genConfig.model}
                                    onChange={(e) => updateText('model', e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all"
                                >
                                    <option value="Llama-3-8B">Llama-3-8B</option>
                                    <option value="Gemma-2-2B">Gemma-2-2B</option>
                                </select>
                            </div>
                        </section>

                        {/* Quantization */}
                        <section>
                            <label className="text-[11px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                                <Settings size={12} /> Quantization
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {['FP16', '8-bit', '4-bit'].map((bit) => (
                                    <button
                                        key={bit}
                                        onClick={() => updateText('quantization', bit)}
                                        className={`py-2.5 text-xs rounded-xl transition-all duration-200 border
                      ${genConfig.quantization === bit
                                            ? 'bg-white border-transparent text-black font-black shadow-md ring-1 ring-gray-100'
                                            : 'bg-white border-gray-100 text-gray-400 font-medium hover:bg-gray-50'
                                        }`}
                                    >
                                        {bit}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Sampling Params */}
                        <section className="space-y-6">
                            <label className="text-[11px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                                <Activity size={12} /> Sampling Params
                            </label>

                            {/* 1. Temperature */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-600">Temperature</span>
                                    <input
                                        type="number"
                                        min={LIMITS.temperature.min}
                                        max={LIMITS.temperature.max}
                                        step={LIMITS.temperature.step}
                                        value={draftNums.temperature}
                                        onChange={(e) => handleNumInputChange('temperature', e.target.value)}
                                        onBlur={() => handleNumInputBlur('temperature')}
                                        className="w-14 text-center bg-gray-50 border border-gray-200 rounded text-xs font-bold text-gray-900 py-1 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min={LIMITS.temperature.min}
                                    max={LIMITS.temperature.max}
                                    step={LIMITS.temperature.step}
                                    value={genConfig.temperature ?? LIMITS.temperature.default}
                                    onChange={(e) => updateNumber('temperature', Number(e.target.value))}
                                    className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                />
                            </div>

                            {/* 2. Top-k */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-600">Top-k</span>
                                    <input
                                        type="number"
                                        min={LIMITS.top_k.min}
                                        max={LIMITS.top_k.max}
                                        step={LIMITS.top_k.step}
                                        value={draftNums.top_k}
                                        onChange={(e) => handleNumInputChange('top_k', e.target.value)}
                                        onBlur={() => handleNumInputBlur('top_k')}
                                        className="w-14 text-center bg-gray-50 border border-gray-200 rounded text-xs font-bold text-gray-900 py-1 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        placeholder="null"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min={LIMITS.top_k.min}
                                    max={LIMITS.top_k.max}
                                    step={LIMITS.top_k.step}
                                    value={genConfig.top_k ?? LIMITS.top_k.min}
                                    onChange={(e) => updateNumber('top_k', Number(e.target.value))}
                                    className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                />
                            </div>

                            {/* 3. Top-p */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-600">Top-p</span>
                                    <input
                                        type="number"
                                        min={LIMITS.top_p.min}
                                        max={LIMITS.top_p.max}
                                        step={LIMITS.top_p.step}
                                        value={draftNums.top_p}
                                        onChange={(e) => handleNumInputChange('top_p', e.target.value)}
                                        onBlur={() => handleNumInputBlur('top_p')}
                                        className="w-14 text-center bg-gray-50 border border-gray-200 rounded text-xs font-bold text-gray-900 py-1 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min={LIMITS.top_p.min}
                                    max={LIMITS.top_p.max}
                                    step={LIMITS.top_p.step}
                                    value={genConfig.top_p ?? LIMITS.top_p.default}
                                    onChange={(e) => updateNumber('top_p', Number(e.target.value))}
                                    className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                />
                            </div>
                        </section>
                    </div>
                )}

                {/* 공격 전략 선택 */}
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
                                        <span className={`text-sm font-bold ${
                                            attackType === type.id ? 'text-black font-black' : 'text-gray-400'
                                        }`}>
                      {type.label}
                    </span>
                                    </div>
                                    <p className={`text-xs pl-5 ${
                                        attackType === type.id ? 'text-gray-600' : 'text-gray-400'
                                    }`}>
                                        {type.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="h-4" />
            </div>

            {/* 4. 워터마크 토글 */}
            {activeTab === 'generate' && (
                <div className="p-6 border-t border-gray-100 bg-white flex-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                        genConfig.watermark_enabled ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-200'
                    }`}>
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
