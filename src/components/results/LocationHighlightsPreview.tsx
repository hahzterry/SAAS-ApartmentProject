import { Badge } from "@/components/ui/Badge";
import type { LocationHighlights } from "@/types/property";
import { Building2, GraduationCap, MapPinned, Sparkles, TreePine } from "lucide-react";

const PILLARS: Array<{ key: keyof Omit<LocationHighlights, "sources">; label: string; icon: typeof GraduationCap }> = [
  { key: "schools", label: "Schools", icon: GraduationCap },
  { key: "shoppingCenters", label: "Shopping", icon: Building2 },
  { key: "playgroundsAndParks", label: "Parks & Playgrounds", icon: TreePine },
  { key: "mainRoadsAndTransit", label: "Roads & Transit", icon: MapPinned },
  { key: "attractionsAndVibe", label: "Attractions & Vibe", icon: Sparkles },
];

export function LocationHighlightsPreview({ highlights }: { highlights: LocationHighlights }) {
  return (
    <div className="space-y-3">
      {PILLARS.map(({ key, label, icon: Icon }) => (
        <div key={key} className="flex items-start gap-3">
          <Badge className="shrink-0">
            <Icon className="h-3 w-3" />
            {label}
          </Badge>
          <p className="text-sm text-slate-600">{highlights[key]}</p>
        </div>
      ))}
    </div>
  );
}
