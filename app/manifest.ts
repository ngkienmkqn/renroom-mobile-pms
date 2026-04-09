import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Renroom - Quản Lý Thuê Trọ',
    short_name: 'Renroom',
    description: 'Ứng dụng quản lý cho thuê phòng và khách sạn tối ưu di động',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#4f46e5', // Indigo-600 to match our layout header
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
