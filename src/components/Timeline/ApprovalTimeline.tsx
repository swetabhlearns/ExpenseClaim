import type { ExpenseClaim } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { CheckCircle, XCircle, Upload } from 'lucide-react';

interface ApprovalTimelineProps {
    claim: ExpenseClaim;
}

export function ApprovalTimeline({ claim }: ApprovalTimelineProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Approval History
            </h3>
            <div className="relative space-y-6 pl-6">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-2 bottom-0 w-0.5 bg-border" />

                {claim.logs.map((log, index) => {
                    const isApproved = log.action === 'APPROVE';
                    const isRejected = log.action === 'REJECT';
                    const isSubmitted = log.action === 'SUBMIT';

                    return (
                        <div key={index} className="relative animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                            {/* Icon */}
                            <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-background flex items-center justify-center">
                                {isApproved && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                                {isRejected && <XCircle className="w-4 h-4 text-rose-600" />}
                                {isSubmitted && <Upload className="w-4 h-4 text-blue-600" />}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold">{log.stage}</p>
                                    <p className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{log.actor}</p>
                                {log.remarks && (
                                    <p className="text-sm mt-1 p-2 rounded bg-muted/50 italic">
                                        "{log.remarks}"
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
