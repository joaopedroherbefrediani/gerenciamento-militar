import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
          background: 'linear-gradient(135deg, #22c55e 0%, #059669 100%)',
        }}
      >
        <svg width="110" height="110" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17.8 6.1 20.2l1.2-6.6L2.4 9l6.7-.9L12 2z"
            fill="#ffffff"
          />
        </svg>
      </div>
    ),
    size
  )
}

