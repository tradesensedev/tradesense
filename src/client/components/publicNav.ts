// Links of the public site header. HOW TO ADD A PUBLIC PAGE: add the route in App.tsx and a link here.
export interface PublicNavItem {
  to: string;
  label: string;
  end?: boolean;
}

export const PUBLIC_NAV: PublicNavItem[] = [
  { to: "/", label: "Today", end: true },
  { to: "/matrix", label: "Matrix" },
  { to: "/weekly", label: "Weekly" },
  { to: "/feed", label: "Feed" },
  { to: "/heatmap", label: "Heatmap" },
  { to: "/events", label: "Events" },
  { to: "/rules", label: "Rules" },
];
