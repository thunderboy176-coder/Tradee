import "./globals.css";

export const metadata = {
  title: "Trading Journal & Position Calculator",
  description: "Futures Trading Journal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
