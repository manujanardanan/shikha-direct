import "./globals.css";

export const metadata = {
  title: "Shikha - Find Your Path",
  description: "A guided career discovery journey for your child.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/shikha-direct-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
