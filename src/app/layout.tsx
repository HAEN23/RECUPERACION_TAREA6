import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dashboard de Reportes SQL',
  description: 'Next.js + PostgreSQL con VIEWS avanzadas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Navigation */}
        <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <span className="text-blue-600 font-bold text-xl">📊</span>
                  </div>
                  <span className="font-bold text-white text-lg">Reportes SQL</span>
                </Link>
                
                <div className="hidden md:flex space-x-1">
                  {[
                    { num: 1, name: 'Ventas' },
                    { num: 2, name: 'Clientes' },
                    { num: 3, name: 'Ranking' },
                    { num: 4, name: 'Tendencia' },
                    { num: 5, name: 'Satisfacción' },
                  ].map(({ num, name }) => (
                    <Link
                      key={num}
                      href={`/reports/${num}`}
                      className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              </div>
              
              <Link 
                href="/" 
                className="px-5 py-2 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 shadow-md transition-colors"
              >
                🏠 Dashboard
              </Link>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        
      </body>
    </html>
  );
}
