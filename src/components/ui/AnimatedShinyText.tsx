import { type ElementType, type ReactNode } from "react";

interface AnimatedShinyTextProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

export function AnimatedShinyText({
  as: Component = "span",
  children,
  className
}: AnimatedShinyTextProps) {
  const classes = ["animated-shiny-text", className].filter(Boolean).join(" ");

  return <Component className={classes}>{children}</Component>;
}
