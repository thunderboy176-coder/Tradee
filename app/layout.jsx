import "./globals.css";

export const metadata = {
  title: "Tradee",
  description: "Tradee - MNQ Trading Journal & Position Calculator",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%230891b2'/><circle cx='50' cy='42' r='24' fill='%2386efac'/><circle cx='39' cy='40' r='6' fill='%230f172a'/><circle cx='61' cy='40' r='6' fill='%230f172a'/><circle cx='41' cy='38' r='2' fill='%23ffffff'/><circle cx='63' cy='38' r='2' fill='%23ffffff'/><path d='M42 52 Q50 58 58 52' stroke='%2315803d' stroke-width='3' fill='none' stroke-linecap='round'/></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%230891b2'/><circle cx='50' cy='42' r='24' fill='%2386efac'/><circle cx='39' cy='40' r='6' fill='%230f172a'/><circle cx='61' cy='40' r='6' fill='%230f172a'/><circle cx='41' cy='38' r='2' fill='%23ffffff'/><circle cx='63' cy='38' r='2' fill='%23ffffff'/><path d='M42 52 Q50 58 58 52' stroke='%2315803d' stroke-width='3' fill='none' stroke-linecap='round'/></svg>"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
