import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, HoverScale } from "@/components/ui/motion";

export function EmptyState(props: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const Icon = props.icon;

  return (
    <FadeIn delay={0.2}>
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Icon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{props.title}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {props.description}
          </p>
          {props.actionLabel && props.onAction && (
            <HoverScale>
              <Button onClick={props.onAction}>{props.actionLabel}</Button>
            </HoverScale>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
