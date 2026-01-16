import "./globals.css";

export const metadata = {
  title: "VoiceForge",
  description: "Generate and download high-quality TTS audio with preview controls."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
