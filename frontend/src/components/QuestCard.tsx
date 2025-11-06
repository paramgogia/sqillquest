import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface QuestCardProps {
  title: string;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
}

export const QuestCard = ({ title, icon: Icon, onClick, className, iconClassName }: QuestCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-8 cursor-pointer transition-all bg-card border-4 border-border hover:border-primary group relative overflow-hidden shadow-[0_8px_0_hsl(var(--border))] hover:shadow-[0_8px_0_hsl(var(--primary)),0_0_30px_hsl(var(--primary)/0.4)] active:translate-y-2 active:shadow-[0_4px_0_hsl(var(--primary))]",
        className
      )}
    >
      {/* Pixel corner decorations */}
      <div className="absolute top-2 right-2 w-3 h-3 bg-primary animate-flicker" />
      <div className="absolute top-2 left-2 w-3 h-3 bg-secondary animate-flicker" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-2 right-2 w-3 h-3 bg-accent animate-flicker" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-2 left-2 w-3 h-3 bg-pixel-orange animate-flicker" style={{ animationDelay: '1.5s' }} />
      
      <div className="flex flex-col items-center gap-6 text-center relative z-10">
        <div className={cn("p-6 bg-gradient-magic border-4 border-primary group-hover:animate-glow", iconClassName)}>
          <Icon className="w-10 h-10 text-primary-foreground" />
        </div>
        <h3 className="text-sm font-pixel uppercase text-card-foreground group-hover:text-primary transition-colors leading-relaxed">
          {title}
        </h3>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="px-3 py-2 bg-accent border-2 border-accent animate-pixel-bounce">
            <span className="text-[0.6rem] font-pixel text-card">▶ START</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
