import "./globals.css";

export const metadata = {
  title: "Admin Sign In | Streamline",
  description: "Secure administration portal for the Streamline platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
