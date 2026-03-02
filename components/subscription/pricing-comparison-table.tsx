import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FEATURE_INFO_ROWS } from "@/lib/subscription/pricing-data";

export function PricingComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[120px]">
              기능
            </TableHead>
            <TableHead className="text-center min-w-[100px]">
              무료 한도
            </TableHead>
            <TableHead className="text-center min-w-[100px]">
              포인트 비용
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURE_INFO_ROWS.map((feat) => (
            <TableRow key={feat.key}>
              <TableCell className="sticky left-0 bg-background z-10 font-medium">
                {feat.label}
              </TableCell>
              <TableCell className="text-center">
                {feat.freeLimit}
              </TableCell>
              <TableCell
                className={`text-center ${
                  feat.pointCost === "-" ? "text-muted-foreground" : ""
                }`}
              >
                {feat.pointCost}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
