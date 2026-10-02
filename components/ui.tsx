"use client";

/**
 * Shared interface kit. Every page is built from these pieces so spacing, type,
 * colour, focus and loading/error behaviour stay consistent across the site.
 */
import React, { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ChevronRight, ExternalLink as ExternalIcon, Inbox, RotateCw, Search } from "lucide-react";
import { activeItem } from "@/lib/navigation";

// ── Data loading ──────────────────────────────────────────────────────────

/** GET a JSON endpoint; `url = null` skips the request. */
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      setData(await res.json());
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

// ── Page structure ────────────────────────────────────────────────────────

export interface Crumb {
  label: string;
  href?: string;
}

export function Page({
  title,
  description,
  actions,
  breadcrumbs,
  children,
}: {
  /** Defaults to the page's name in the navigation. */
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Crumb[];
  children: React.ReactNode;
}) {
  const nav = activeItem(usePathname());
  const heading = title ?? nav?.label ?? "";
  const intro = description ?? nav?.description;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 pt-6 pb-12 lg:pt-8 lg:pb-16 space-y-8">
      <header className="space-y-3">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-subtle">
              {breadcrumbs.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />}
                  {c.href ? (
                    <Link href={c.href} className="hover:text-fg underline-offset-2 hover:underline">{c.label}</Link>
                  ) : (
                    <span aria-current="page" className="text-muted">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-[2rem] sm:text-[2.5rem] lg:text-5xl leading-[1.08] font-bold tracking-[-0.02em] text-fg">{heading}</h1>
            {intro && <p className="text-lg text-muted max-w-[65ch] font-serif">{intro}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </header>
      {children}
    </div>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className = "",
  padded = true,
  as: Tag = "section",
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag className={`rule-double pt-4 ${padded ? "pb-2" : ""} ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
          <div className="min-w-0">
            {title && <h2 className="text-xl font-bold tracking-[-0.01em] text-fg">{title}</h2>}
            {description && <p className="text-sm text-muted mt-1 max-w-[65ch]">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
}

// ── Actions ───────────────────────────────────────────────────────────────

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover border border-primary hover:border-primary-hover",
  secondary: "bg-canvas text-fg border border-line-strong hover:bg-fg hover:text-canvas",
  ghost: "text-link border border-transparent underline decoration-transparent hover:decoration-current",
};
const SIZES: Record<Size, string> = {
  md: "min-h-11 px-4 text-sm",
  sm: "min-h-9 px-3 text-sm",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md") {
  return `inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]}`;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button type="button" {...props} disabled={props.disabled || loading} aria-busy={loading || undefined} className={`${buttonClass(variant, size)} ${className}`}>
      {loading && <RotateCw className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  external = false,
  download,
  children,
  className = "",
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  external?: boolean;
  download?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const cls = `${buttonClass(variant, size)} ${className}`;
  if (external || download) {
    return (
      <a href={href} className={cls} download={download} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
        {external && <ExternalIcon className="w-4 h-4" aria-hidden="true" />}
        {external && <span className="sr-only">(opens in a new tab)</span>}
      </a>
    );
  }
  return <Link href={href} className={cls}>{children}</Link>;
}

/** An inline link to another website, marked as such. */
export function ExternalLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`text-link underline-offset-2 hover:underline [overflow-wrap:anywhere] ${className}`}>
      {children}
      <ExternalIcon className="inline w-3.5 h-3.5 ml-1 -mt-0.5" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export const linkClass = "text-link underline-offset-2 hover:underline";

// ── Status ────────────────────────────────────────────────────────────────

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";
const TONES: Record<Tone, string> = {
  neutral: "text-muted border-line",
  info: "text-link border-current",
  success: "text-success border-current",
  warning: "text-warning border-current",
  danger: "text-danger border-current",
};

/** A short status label. Meaning is always in the text, never in the colour alone. */
export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center gap-1 px-1.5 py-px text-xs font-semibold border whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
}

export function Notice({ tone = "info", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={`border px-4 py-3 text-sm ${TONES[tone]}`}>
      {children}
    </div>
  );
}

// ── Choices ───────────────────────────────────────────────────────────────

/** Mutually exclusive filter buttons (a single choice). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap border border-line-strong divide-x divide-line-strong">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`min-h-11 px-3.5 text-sm font-semibold transition-colors duration-150 ${
            value === o.value ? "bg-fg text-canvas" : "text-fg hover:bg-sunken"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Forms ─────────────────────────────────────────────────────────────────

export const inputClass =
  "w-full min-h-11 border border-line-strong bg-canvas px-3 text-base sm:text-sm text-fg placeholder:text-subtle focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

/** A labelled control with optional help text, wired for screen readers. */
export function Field({
  label,
  hint,
  hideLabel = false,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  hideLabel?: boolean;
  children: (props: { id: string; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={hideLabel ? "sr-only" : "block text-sm font-semibold text-fg"}>{label}</label>
      {children({ id, "aria-describedby": hintId })}
      {hint && <p id={hintId} className="text-sm text-subtle">{hint}</p>}
    </div>
  );
}

/** Search box with a visible label (or a screen-reader label) and an optional submit button. */
export function SearchBox({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  hint,
  submitLabel = "Search",
  hideLabel = false,
  busy = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  hint?: React.ReactNode;
  submitLabel?: string;
  hideLabel?: boolean;
  busy?: boolean;
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Field label={label} hint={hint} hideLabel={hideLabel}>
        {(p) => (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" aria-hidden="true" />
              <input {...p} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} pl-9`} />
            </div>
            {onSubmit && (
              <Button type="submit" variant="primary" loading={busy}>
                {submitLabel}
              </Button>
            )}
          </div>
        )}
      </Field>
    </form>
  );
}

// ── Loading, empty and error states ───────────────────────────────────────

/** Skeleton rows with a message; after a few seconds it explains why the wait is long. */
export function Loading({ message, slow = "Some sources take up to 30 seconds the first time they are opened.", rows = 3 }: { message: string; slow?: string; rows?: number }) {
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaiting(true), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <p className="text-sm text-muted">{message}</p>
      {waiting && slow && <p className="text-sm text-subtle">{slow}</p>}
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-12 border-t border-line" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({
  title = "This information could not be loaded",
  message = "The source did not respond. It may be busy or temporarily down.",
  onRetry,
}: {
  title?: string;
  message?: React.ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="border border-danger p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <p className="font-semibold text-fg">{title}</p>
        <p className="text-sm text-muted">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} size="sm">
          <RotateCw className="w-4 h-4" aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border-y border-line py-10 text-center space-y-2">
      <Inbox className="w-6 h-6 mx-auto text-subtle" aria-hidden="true" />
      <p className="font-medium text-fg">{title}</p>
      {message && <p className="text-sm text-muted max-w-prose mx-auto">{message}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

/** Loading, error and ready states for one request. */
export function Loadable({
  loading,
  error,
  onRetry,
  message,
  children,
}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  message: string;
  children: React.ReactNode;
}) {
  if (loading) return <Loading message={message} />;
  if (error) return <ErrorState onRetry={onRetry} />;
  return <>{children}</>;
}

// ── Data display ──────────────────────────────────────────────────────────

/** One line of a contents table: label, dotted leader, figure. The whole line is the link. */
export function ContentsLine({ label, value, hint, href }: { label: string; value: React.ReactNode; hint?: string; href: string }) {
  return (
    <Link href={href} className="leader-row group relative block overflow-hidden py-3 pr-14 border-b border-line text-fg">
      <span className="font-serif text-lg sm:text-xl">
        {label}
        {hint && <span className="hidden sm:inline font-sans text-sm text-subtle"> — {hint}</span>}
      </span>
      {/* Zero-width anchor at the end of the label's last line; its leader runs on to the figure. */}
      <span className="leader" aria-hidden="true" />
      <span className="absolute right-0 bottom-3 pl-2 bg-canvas font-serif text-2xl sm:text-3xl leading-none font-bold tabular-nums group-hover:underline group-focus-visible:underline">{value}</span>
    </Link>
  );
}
/** Label/value pairs. */
export function Facts({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-x-4 gap-y-1.5 text-sm">
      {items.map((i) => (
        <React.Fragment key={i.label}>
          <dt className="text-subtle">{i.label}</dt>
          <dd className="text-fg [overflow-wrap:anywhere]">{i.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export const tableClass = "w-full text-left text-sm";
export const thClass = "py-2 px-3 text-xs font-semibold uppercase tracking-[0.06em] text-subtle border-y border-line-strong";
export const tdClass = "py-3 px-3 align-top border-b border-line";

/** Small print: where the data comes from and what it leaves out. */
export function SourceNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-subtle max-w-4xl">{children}</p>;
}

/** Marks text produced by a language model. */
export function AiLabel() {
  return <Badge tone="warning">AI-generated — check against the sources</Badge>;
}

// ── Formatting ────────────────────────────────────────────────────────────

/** "2026-10-15" -> "15 Oct 2026". Leaves anything unparseable as it is. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: iso.length === 10 ? "UTC" : undefined });
}

export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "not loaded yet";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;
