import { Badge } from "@/components/ui/badge";

type BetStatus = "PENDING" | "WIN" | "LOSS" | "PUSH";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status as BetStatus) {
    case "WIN":
      return <Badge variant="success">Win</Badge>;
    case "LOSS":
      return <Badge variant="destructive">Loss</Badge>;
    case "PUSH":
      return <Badge variant="secondary">Push</Badge>;
    case "PENDING":
    default:
      return <Badge variant="warning">Pending</Badge>;
  }
}
