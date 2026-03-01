import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  TIERS,
  FEATURE_ROWS,
  getDisplayLimit,
} from "@/lib/subscription/pricing-data";

export function PricingComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[120px]">
              기능
            </TableHead>
            {TIERS.map((tier) => (
              <TableHead key={tier.name} className="text-center min-w-[100px]">
                {tier.displayName}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURE_ROWS.map((feat) => (
            <TableRow key={feat.key}>
              <TableCell className="sticky left-0 bg-background z-10 font-medium">
                {feat.label}
              </TableCell>
              {TIERS.map((tier) => {
                const display = getDisplayLimit(feat.key, tier.name, feat.unit);
                return (
                  <TableCell
                    key={tier.name}
                    className={`text-center ${
                      display === "—" ? "text-muted-foreground" : ""
                    }`}
                  >
                    {display}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
