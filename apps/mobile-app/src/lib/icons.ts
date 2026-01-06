import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

/**
 * Safely get a Lucide icon component by name
 * @param iconName Name of the icon from lucide-react
 * @returns Icon component or fallback Package icon
 */
export function getLucideIcon(iconName: string): LucideIcon {
  // Type-safe access to lucide icons
  const iconsMap = LucideIcons as Record<string, LucideIcon>;
  const Icon = iconsMap[iconName];
  
  // Fallback to a generic icon if not found
  if (!Icon || typeof Icon !== "function") {
    console.warn(`Icon "${iconName}" not found in lucide-react, using fallback`);
    return LucideIcons.Package;
  }
  
  return Icon;
}
