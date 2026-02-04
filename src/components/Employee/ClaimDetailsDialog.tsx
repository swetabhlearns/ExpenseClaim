import type { ExpenseClaim } from '@/types';
import { formatCurrency, formatDate, getStatusLabel, getStatusVariant } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ApprovalTimeline } from '@/components/Timeline/ApprovalTimeline';
import { Separator } from '@/components/ui/separator';

interface ClaimDetailsDialogProps {
    claim: ExpenseClaim | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClaimDetailsDialog({ claim, open, onOpenChange }: ClaimDetailsDialogProps) {
    if (!claim) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{claim.title}</DialogTitle>
                    <DialogDescription>Claim ID: {claim.id}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status */}
                    <div>
                        <Badge variant={getStatusVariant(claim.status)} className="text-sm px-3 py-1">
                            {getStatusLabel(claim.status)}
                        </Badge>
                    </div>

                    {/* Claim Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="text-2xl font-mono font-bold text-primary">
                                {formatCurrency(claim.amount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="text-lg font-medium">{formatDate(claim.date)}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{claim.description}</p>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Submitted By</p>
                        <p className="text-sm font-medium">{claim.userName}</p>
                    </div>

                    <Separator />

                    {/* Timeline */}
                    <ApprovalTimeline claim={claim} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
