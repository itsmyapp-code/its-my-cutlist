import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parametric Furniture Modeler | Its My Cutlist",
  description:
    "Design wardrobes and chests of drawers with real-time 3D visualization. Generate precise cutlists with parametric dimensions, exploded views, and one-click export — all in your browser.",
};

export default function FurnitureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 flex flex-col min-h-screen">{children}</main>
  );
}
