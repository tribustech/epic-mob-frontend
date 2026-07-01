import {
  ShieldCheck,
  Sparkles,
  PiggyBank,
  Palette,
  Layers,
  Hand,
  Waves,
  Droplets,
  Gem,
  Leaf,
  DoorClosed,
  Package,
  ArrowLeftRight,
  PanelTopOpen,
  Zap,
  CookingPot,
  Flame,
  ShowerHead,
  Baby,
  Sofa,
  type LucideProps,
} from "lucide-react";

// Small registry so material data can reference icons by name (keeps the data
// file free of JSX / imports).
const registry = {
  ShieldCheck,
  Sparkles,
  PiggyBank,
  Palette,
  Layers,
  Hand,
  Waves,
  Droplets,
  Gem,
  Leaf,
  DoorClosed,
  Package,
  ArrowLeftRight,
  PanelTopOpen,
  Zap,
  CookingPot,
  Flame,
  ShowerHead,
  Baby,
  Sofa,
} as const;

export type MaterialIconName = keyof typeof registry;

export function MaterialIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Icon = registry[name as MaterialIconName] ?? Sparkles;
  return <Icon {...props} />;
}
