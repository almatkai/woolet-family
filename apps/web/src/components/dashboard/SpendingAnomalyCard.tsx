import { trpc } from '@/lib/trpc';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { GlassCard, GlassEdge, MetricAura } from '@/components/ui/glass';

export function SpendingAnomalyCard() {
    const { data: anomalies, isLoading } = trpc.ai.getSpendingAnomalies.useQuery(undefined, {
        staleTime: 1000 * 60 * 60 * 24, // Check once a day roughly
        refetchOnWindowFocus: false,
    });

    if (isLoading) return null; 
    if (!anomalies) return null;

    return (
        <GlassCard className="dashboard-widget widget-tint-amber border-amber-500/20 bg-amber-500/[0.05] group rounded-[28px] overflow-hidden">
            <MetricAura color="#F59E0B" cx={85} cy={15} opacity={0.15} />
            <GlassEdge />

            <div className="block flex-1 flex flex-col min-h-0 relative z-10">
                <div className="p-3 pb-1 flex flex-row items-start justify-between hover:bg-white/[0.04] transition-colors rounded-t-xl">
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mb-0.5">AI Insights</div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-base font-bold tracking-tight text-amber-200 whitespace-nowrap">
                                Spending Alert
                            </span>
                        </div>
                    </div>
                    <div className="p-1.5 bg-amber-500/15 rounded-xl border border-amber-500/25 group-hover:bg-amber-500/25 transition-colors">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                </div>

                <div className="px-3 py-1 flex-1 flex flex-col min-h-0">
                    <div className="prose prose-xs dark:prose-invert max-w-none text-muted-foreground line-clamp-3 text-xs">
                        {typeof anomalies === 'string' && anomalies.trim().length > 0 && (
                            <ReactMarkdown children={anomalies} />
                        )}
                    </div>
                </div>
            </div>

            <div className="px-3 py-1.5 border-t border-amber-500/20 bg-amber-500/[0.04] flex items-center justify-between relative z-10">
                <span className="text-[9px] font-medium text-amber-400/80 uppercase tracking-wider">
                    AI Powered Analysis
                </span>
                <Link to="/spending" className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5 hover:underline uppercase tracking-wider">
                    Details <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </div>
        </GlassCard>
    );
}
