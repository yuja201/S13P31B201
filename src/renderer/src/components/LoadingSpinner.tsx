import React from 'react'
import yujaIcon from '@renderer/assets/icons/yuja.png'

interface LoadingProps {
  text?: string
  size?: number
  width?: number
  background?: string
}

interface CSSVariableStyle extends React.CSSProperties {
  '--travel-distance'?: string
}

const Loading: React.FC<LoadingProps> = ({
  text = '유자가 생각 중...',
  size = 70,
  width = 500,
  background
}) => {
  const travelDistance = width - size

  const yujaStyle: CSSVariableStyle = {
    position: 'absolute',
    left: 0,
    bottom: '40px',
    width: `${size}px`,
    height: `${size}px`,
    animation: 'moveYuja 3s linear infinite',
    '--travel-distance': `${travelDistance}px`
  }

  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${size + 100}px`,
        backgroundColor: background ?? 'var(--color-background)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* 유자 */}
      <div style={yujaStyle}>
        <img
          src={yujaIcon}
          alt="유자"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            animation: 'spinYuja 0.8s linear infinite'
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          textAlign: 'center'
        }}
      >
        <span
          style={{
            color: 'var(--color-primary)',
            fontSize: '16px',
            fontWeight: 500,
            marginTop: '20px',
            display: 'inline-block'
          }}
        >
          {text}
        </span>
      </div>
    </div>
  )
}

export default Loading
