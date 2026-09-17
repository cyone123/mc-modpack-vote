import './globals.css';

export const metadata = {
  title: '⛏️ Minecraft 群服周目整合包投票系统',
  description: 'Minecraft 交流群服务器周目整合包大选系统，群友投票实时存盘',
  icons: {
    icon: '/favicon.svg'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Noto+Sans+SC:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#121316] text-[#e2e8f0] min-h-screen antialiased selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
