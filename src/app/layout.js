import "./globals.css";
import PortalAutoRefresh from "./components/portal-auto-refresh";

export const metadata = {
  title: "Admin Sign In | Streamline",
  description: "Secure administration portal for the Streamline platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}<PortalAutoRefresh /></body>
    </html>
  );
}
