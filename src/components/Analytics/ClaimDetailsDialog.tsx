import { formatCurrency, formatDate } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ApprovalTimeline } from '@/components/Timeline/ApprovalTimeline';

interface ClaimDetailsDialogProps {
    claim: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClaimDetailsDialog({ claim, open, onOpenChange }: ClaimDetailsDialogProps) {
    if (!claim) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Expense Claim Details</DialogTitle>
                    <DialogDescription>
                        Complete information and approval timeline for this claim
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 py-4">
                    {/* Left: Claim Details */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Claim Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wide">ID</label>
                                    <p className="font-mono text-sm">{claim.id || claim._id}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Employee</label>
                                    <p className="font-medium">{claim.userName}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Title</label>
                                    <p className="font-medium">{claim.title}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Amount</label>
                                    <p className="text-2xl font-mono font-bold text-primary">
                                        {formatCurrency(claim.amount)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Date</label>
                                    <p>{formatDate(claim.date)}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Description</label>
                                    <p className="text-sm">{claim.description}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Status</label>
                                    <p className="font-medium">{claim.status.replace(/_/g, ' ')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Timeline */}
                    <div className="space-y-4">
                        <ApprovalTimeline claim={claim} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
