import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { UserRole } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ApprovalTimeline } from '@/components/Timeline/ApprovalTimeline';
import { CheckCircle, XCircle } from 'lucide-react';

interface ApprovalDialogProps {
    claim: any | null;
    currentUser: {
        _id: Id<"users">;
        name: string;
        email: string;
        role: UserRole;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApprovalDialog({ claim, currentUser, open, onOpenChange }: ApprovalDialogProps) {
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const approveMutation = useMutation(api.claims.approveClaim);
    const rejectMutation = useMutation(api.claims.rejectClaim);

    if (!claim) return null;

    const handleApprove = async () => {
        if (!remarks.trim()) {
            alert('Please provide remarks');
            return;
        }

        setIsSubmitting(true);
        try {
            await approveMutation({
                claimId: claim._id,
                remarks,
                actorName: currentUser.name,
                actorRole: currentUser.role,
            });
            setRemarks('');
            onOpenChange(false);
        } catch (error) {
            console.error('Error approving claim:', error);
            alert('Failed to approve claim. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!remarks.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setIsSubmitting(true);
        try {
            await rejectMutation({
                claimId: claim._id,
                remarks,
                actorName: currentUser.name,
                actorRole: currentUser.role,
            });
            setRemarks('');
            onOpenChange(false);
        } catch (error) {
            console.error('Error rejecting claim:', error);
            alert('Failed to reject claim. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Review Expense Claim</DialogTitle>
                    <DialogDescription>
                        Thoroughly review the claim details before making a decision
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
                                    <p className="font-mono text-sm">{claim._id}</p>
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
                            </div>
                        </div>
                    </div>

                    {/* Right: Timeline & Actions */}
                    <div className="space-y-4">
                        <ApprovalTimeline claim={claim} />

                        <Separator />

                        <div className="space-y-3">
                            <label className="text-sm font-semibold">Your Remarks</label>
                            <Textarea
                                placeholder="Add your comments or feedback..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="destructive"
                                className="flex-1 gap-2"
                                onClick={handleReject}
                                disabled={isSubmitting}
                            >
                                <XCircle className="w-4 h-4" />
                                {isSubmitting ? 'Processing...' : 'Reject'}
                            </Button>
                            <Button
                                className="flex-1 gap-2"
                                onClick={handleApprove}
                                disabled={isSubmitting}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {isSubmitting ? 'Processing...' : 'Approve & Forward'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
