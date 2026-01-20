import { useState, useEffect } from 'react';
import {
    Activity, ShieldCheck, AlertTriangle, CheckCircle2,
    BarChart3, TrendingUp, Database, X, Zap
} from 'lucide-react';

// initialData: 백엔드에서 받아온 데이터 (없으면 더미 데이터 사용)
export default function DashboardPage({ onClose, initialData }) {

    // --- [Data Logic] 데이터가 들어오면 그것을 쓰고, 아니면 더미 사용 ---
    const [stats, setStats] = useState({
        total_verifications: 0,
        avg_auc: 0,
        detection_rate: 0,
        attack_attempts: 0,
        roc_points: [],
        distribution: []
    });

    useEffect(() => {
        if (initialData) {
            setStats(initialData);
        } else {
            // 더미 데이터 로드 (백엔드 연결 전 시연용)
            setStats({
                total_verifications: 1240,
                avg_auc: 0.985,
                detection_rate: 94.2,
                attack_attempts: 156,
                roc_points: [
                    { fpr: 0.00, tpr: 0.00 }, { fpr: 0.02, tpr: 0.15 }, { fpr: 0.05, tpr: 0.45 },
                    { fpr: 0.10, tpr: 0.85 }, { fpr: 0.15, tpr: 0.92 }, { fpr: 0.20, tpr: 0.96 },
                    { fpr: 0.30, tpr: 0.98 }, { fpr: 0.50, tpr: 0.99 }, { fpr: 1.00, tpr: 1.00 }
                ],
                distribution: [
                    { range: '0-20', clean: 50, watermarked: 2 },
                    { range: '20-40', clean: 30, watermarked: 5 },
                    { range: '40-60', clean: 10, watermarked: 10 },
                    { range: '60-80', clean: 5, watermarked: 40 },
                    { range: '80-100', clean: 2, watermarked: 80 },
                ]
            });
        }
    }, [initialData]);

    // --- [Chart 1] Real ROC Curve (Size Up) ---
    const RealRocChart = ({ points }) => {
        if (!points || points.length === 0) return <div className="h-64 flex items-center justify-center text-gray-300">No Data Available</div>;

        const pathData = points.map((p, i) => {
            const x = p.fpr * 100;
            const y = 100 - (p.tpr * 100);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        return (
            <div className="relative w-full h-80 bg-gray-50/50 rounded-3xl border border-gray-200 p-8 overflow-hidden">
                {/* 배경 그리드 (세밀하게) */}
                <div className="absolute inset-8 border-l border-b border-gray-300 z-0">
                    {[20, 40, 60, 80].map(pos => (
                        <div key={pos} className="absolute w-full border-t border-gray-200 border-dashed" style={{ top: `${pos}%` }}></div>
                    ))}
                    {[20, 40, 60, 80].map(pos => (
                        <div key={pos} className="absolute h-full border-l border-gray-200 border-dashed" style={{ left: `${pos}%` }}></div>
                    ))}
                </div>

                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none">
                    {/* 기준선 */}
                    <line x1="0" y1="100" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="4" />
                    {/* 메인 곡선 */}
                    <path d={pathData} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="drop-shadow-md"/>
                    {/* 영역 채우기 */}
                    <path d={`${pathData} L 100 100 L 0 100 Z`} fill="url(#gradient)" opacity="0.15" />
                    <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#ffffff" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* 축 레이블 */}
                <span className="absolute bottom-2 right-0 text-[10px] text-gray-400 font-bold bg-white px-1">FPR (1 - Specificity)</span>
                <span className="absolute top-0 left-2 text-[10px] text-gray-400 font-bold -rotate-90 origin-top-left bg-white px-1">TPR (Sensitivity)</span>

                {/* AUC 뱃지 (우측 하단 강조) */}
                <div className="absolute bottom-10 right-12 bg-white/95 backdrop-blur border border-indigo-100 px-5 py-3 rounded-2xl shadow-lg flex flex-col items-end animate-in fade-in slide-in-from-bottom-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1"><Zap size={12} className="text-yellow-500 fill-yellow-500"/> Total AUC</span>
                    <span className="text-3xl font-black text-indigo-600 tracking-tight">{stats.avg_auc}</span>
                </div>
            </div>
        );
    };

    // --- [Chart 2] Distribution Chart (Better Visuals) ---
    const DistributionChart = ({ data }) => {
        if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-300">No Data Available</div>;
        const maxVal = Math.max(...data.map(d => Math.max(d.clean, d.watermarked)));

        return (
            <div className="h-64 flex items-end justify-between gap-6 px-4 pb-2">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-2 h-full group cursor-pointer relative">
                        {/* 툴팁 */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-medium px-3 py-1.5 rounded-lg shadow-xl z-20 whitespace-nowrap mb-2">
                            Clean: <span className="text-red-300 font-bold">{d.clean}</span> | WM: <span className="text-green-300 font-bold">{d.watermarked}</span>
                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                        </div>

                        <div className="flex gap-1 h-full items-end justify-center w-full">
                            {/* Clean Text (Red) */}
                            <div className="w-1/2 bg-red-50 rounded-t-lg relative transition-all duration-500 hover:brightness-95 overflow-hidden" style={{ height: `${(d.clean / maxVal) * 90}%` }}>
                                <div className="absolute bottom-0 w-full bg-gradient-to-t from-red-500 to-red-400 h-full opacity-90"></div>
                            </div>

                            {/* Watermarked Text (Green) */}
                            <div className="w-1/2 bg-green-50 rounded-t-lg relative transition-all duration-500 hover:brightness-95 overflow-hidden" style={{ height: `${(d.watermarked / maxVal) * 90}%` }}>
                                <div className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 h-full opacity-90"></div>
                            </div>
                        </div>

                        <span className="text-[11px] text-gray-400 font-bold text-center border-t border-gray-100 pt-2 w-full block tracking-tight">
                            {d.range}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-white font-sans">

            {/* Header */}
            <div className="flex-none px-10 py-8 border-b border-gray-100 flex justify-between items-start bg-white z-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <Activity className="text-indigo-600" size={32} />
                        Performance Dashboard
                    </h2>
                    <p className="text-slate-500 mt-2 ml-1 text-sm font-medium">
                        시스템 누적 데이터를 기반으로 모델의 탐지 성능과 분포를 분석합니다.
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-slate-700 transition-all border border-transparent hover:border-gray-200"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide bg-slate-50/50">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-10 pb-20">

                    {/* 1. 핵심 지표 (카드 디자인 강화) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-indigo-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-40 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-indigo-100"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Database size={20}/></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Verifications</span>
                            </div>
                            <div className="text-4xl font-black text-slate-800 relative z-10">{stats.total_verifications.toLocaleString()}</div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-emerald-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-40 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-emerald-100"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle2 size={20}/></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detection Rate</span>
                            </div>
                            <div className="text-4xl font-black text-slate-800 relative z-10">{stats.detection_rate}%</div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-orange-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-40 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-orange-100"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><TrendingUp size={20}/></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average AUC</span>
                            </div>
                            <div className="text-4xl font-black text-slate-800 relative z-10">{stats.avg_auc}</div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-red-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-40 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-red-100"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-3 bg-red-100 text-red-600 rounded-xl"><AlertTriangle size={20}/></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attacks Detected</span>
                            </div>
                            <div className="text-4xl font-black text-slate-800 relative z-10">{stats.attack_attempts}</div>
                        </div>
                    </div>

                    {/* 2. 대형 차트 (ROC 곡선) */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <Activity size={24} className="text-indigo-600"/>
                                    Real ROC Curve
                                </h3>
                                <p className="text-sm text-slate-400 mt-1 font-medium pl-9">
                                    누적 데이터(Ground Truth vs Prediction) 기반의 실제 성능 곡선입니다.
                                </p>
                            </div>
                        </div>
                        <RealRocChart points={stats.roc_points} />
                    </div>
                </div>
            </div>
        </div>
    );
}