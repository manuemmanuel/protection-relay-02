import localFont from 'next/font/local'

export const aeonik = localFont({
  src: [
    {
      path: '../fonts/AeonikTRIAL-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/AeonikTRIAL-Regular.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/AeonikTRIAL-Bold.otf',
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-aeonik'
}) 