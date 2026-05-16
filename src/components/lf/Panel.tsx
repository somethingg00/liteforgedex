import { ReactNode } from "react";

const cls = (...xs: Array<string | false | undefined | null>) =>
  xs.filter(Boolean).join(" ");

export function Panel({
  children,
  className = "",
  title,
  action,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
  glow?: boolean;
}) {
  return (
    <section
      className={cls(
        "lf-panel overflow-hidden",
        glow && "lf-panel-glow",
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-5 h-11 border-b border-line">
          <h3 className="font-mono text-[11px] tracking-[0.2em] text-dim2">
            {title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
