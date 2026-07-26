"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateEstimatedPayout } from "@/lib/bets";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface WinPayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wagerAmount: number;
  odds: number;
  onConfirm: (payout: number) => void;
  loading?: boolean;
}

export function WinPayoutDialog({
  open,
  onOpenChange,
  wagerAmount,
  odds,
  onConfirm,
  loading = false,
}: WinPayoutDialogProps) {
  const [payout, setPayout] = useState("");

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      const computedEstimate = calculateEstimatedPayout(wagerAmount, odds);
      setPayout(computedEstimate.toFixed(2));
    }
    onOpenChange(isOpen);
  }

  function handleConfirm() {
    const value = parseFloat(payout);
    if (isNaN(value) || value <= 0) return;
    onConfirm(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as Win</DialogTitle>
          <DialogDescription>
            Enter the actual payout received. The estimated amount is pre-filled.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="win-payout">Actual Payout ($)</Label>
          <Input
            id="win-payout"
            type="number"
            step="0.01"
            min="0.01"
            value={payout}
            onChange={(e) => setPayout(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleConfirm}
            disabled={loading || !payout || parseFloat(payout) <= 0}
          >
            {loading ? "Saving..." : "Confirm Win"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
