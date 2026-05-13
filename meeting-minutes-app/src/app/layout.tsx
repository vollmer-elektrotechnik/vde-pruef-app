import "./globals.css";

export const metadata = {
  title: "Meeting Minutes App",
  description: "Protocol Management MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}