type IconName =
  | "upload"
  | "audio"
  | "x"
  | "check"
  | "play"
  | "pause"
  | "edit"
  | "download"
  | "info"
  | "sparkle"
  | "arrow"
  | "back"
  | "doc"
  | "split"
  | "copy"
  | "moon"
  | "sun"
  | "history"
  | "plus"
  | "trash"
  | "save"
  | "folder";

type Props = {
  name: IconName;
  size?: number;
};

export default function Icon({ name, size = 16 }: Props) {
  const baseProps = {
    width: size,
    height: size,
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "upload":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M12 16V4M12 4l-5 5M12 4l5 5" />
          <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
        </svg>
      );
    case "audio":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M9 18V8l10-2v10" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="16" cy="16" r="3" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M5 12l4 4L19 6" />
        </svg>
      );
    case "play":
      return (
        <svg viewBox="0 0 24 24" {...baseProps} fill="currentColor" stroke="none">
          <path d="M7 4l12 8-12 8V4z" />
        </svg>
      );
    case "pause":
      return (
        <svg viewBox="0 0 24 24" {...baseProps} fill="currentColor" stroke="none">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      );
    case "edit":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case "download":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M12 4v12M12 16l-5-5M12 16l5-5" />
          <path d="M4 20h16" />
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      );
    case "sparkle":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8L12 3z" />
        </svg>
      );
    case "arrow":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "back":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
          <path d="M14 3v6h6" />
        </svg>
      );
    case "split":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M12 4v16" />
        </svg>
      );
    case "copy":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 012-2h10" />
        </svg>
      );
    case "moon":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "history":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M3 12a9 9 0 109-9 9 9 0 00-7.5 4" />
          <path d="M3 4v4h4" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "trash":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      );
    case "save":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          <path d="M17 21v-8H7v8M7 3v5h8" />
        </svg>
      );
    case "folder":
      return (
        <svg viewBox="0 0 24 24" {...baseProps}>
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      );
  }
}

export type { IconName };
