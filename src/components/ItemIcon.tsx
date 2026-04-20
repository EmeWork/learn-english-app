interface ItemIconProps {
  icon: string;
}

export function ItemIcon({ icon }: ItemIconProps) {
  switch (icon) {
    case "blade":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M16.8 2.6 9.4 10l4.6 4.6 7.4-7.4-.8-3.8zM8.1 11.2l-4.3 4.3 1 1L2 19.3 4.7 22l2.8-2.8 1 1 4.3-4.3z" fill="currentColor" />
        </svg>
      );
    case "spear":
    case "flare":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M20 4 6.8 17.2l-1.6-.6-.6-1.6L18 1.8 20 4zM5.5 18.5 2 22l3.5-1.2L6.7 22 22 6.7 20.3 5 5 20.3z" fill="currentColor" />
        </svg>
      );
    case "shield":
    case "aegis":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 2 4 5v6c0 5.2 3.4 9.8 8 11 4.6-1.2 8-5.8 8-11V5z" fill="currentColor" />
        </svg>
      );
    case "orb":
    case "prism":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" fill="currentColor" r="8" />
          <circle cx="12" cy="12" fill="none" r="4" stroke="rgba(9,12,18,0.48)" strokeWidth="1.5" />
        </svg>
      );
    case "lantern":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M9 3h6v2H9zM8 7h8l1 3v8H7v-8zM10 12h4v4h-4z" fill="currentColor" />
        </svg>
      );
    case "helm":
    case "crown":
    case "visor":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 17 6 7l4 4 2-6 2 6 4-4 2 10z" fill="currentColor" />
        </svg>
      );
    case "armor":
    case "plate":
    case "mantle":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M8 3h8l2 3 2 1-2 5v8H6v-8L4 7l2-1z" fill="currentColor" />
        </svg>
      );
    case "ring":
    case "seal":
    case "band":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="15" fill="none" r="5" stroke="currentColor" strokeWidth="2.2" />
          <path d="M10 4h4l1 5h-6z" fill="currentColor" />
        </svg>
      );
    case "relic":
    case "idol":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 2 6 8l2 12h8l2-12z" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 3 3 8v8l9 5 9-5V8z" fill="currentColor" />
        </svg>
      );
  }
}
