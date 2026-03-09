import './globals.css';

export const metadata = {
  title: 'WVNews - West Virginia News & Information',
  description: 'West Virginia\'s trusted source for breaking news, sports, politics, and community coverage.',
  openGraph: {
    title: 'WVNews',
    description: 'West Virginia\'s trusted source for news',
    type: 'website',
    locale: 'en_US',
    siteName: 'WVNews',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafafa]">
        {children}
      </body>
    </html>
  );
}
