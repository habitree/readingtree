import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FEATURE_INFO_ROWS } from "@/lib/subscription/pricing-data";
import { IS_BETA_MODE } from "@/lib/subscription/beta";

export function PricingComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[120px]">
              기능
            </TableHead>
            <TableHead className="text-center min-w-[80px]">
              {IS_BETA_MODE ? "베타 기간" : "무료"}
            </TableHead>
            <TableHead className="text-center min-w-[80px]">
              독서가
            </TableHead>
            <TableHead className="text-center min-w-[80px] text-primary font-bold">
              독서마스터
            </TableHead>
            <TableHead className="text-center min-w-[80px]">
              초과 시 포인트
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURE_INFO_ROWS.map((feat) => (
            <TableRow key={feat.key}>
              <TableCell className="sticky left-0 bg-background z-10 font-medium">
                {feat.label}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {feat.freeLimit}
              </TableCell>
              <TableCell className="text-center">
                {feat.readerLimit}
              </TableCell>
              <TableCell className="text-center font-semibold">
                {feat.masterLimit}
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
