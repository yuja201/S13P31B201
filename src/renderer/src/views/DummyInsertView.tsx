import React, { useState, useEffect, useRef } from 'react'
import PageTitle from '@renderer/components/PageTitle'

const DummyInsertView: React.FC = () => {
  const [progress, setProgress] = useState<number>(73)
  const [logs, setLogs] = useState<string[]>([
    '데이터 생성 완료: users 테이블 — 100%',
    '데이터 생성 완료: categories 테이블 — 100%',
    '데이터 생성 완료: posts 테이블 — 100%',
    '데이터 생성 중: cars 테이블 — 73%'
  ])

  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const safeProgress = Math.min(progress, 100)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-background)'
      }}
    >
      <div style={{ marginBottom: '40px' }}>
        <PageTitle title="더미데이터 삽입 중" description="현재 더미데이터를 DB에 삽입 중입니다." />
      </div>

      {/* 카드 */}
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-gray-200)',
          borderRadius: '16px',
          padding: '30px 40px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          width: '100%',
          height: 'calc((100vh - 140px) * 0.7207)'
        }}
      >
        <p
          style={{
            font: 'var(--preBold20)',
            color: 'var(--color-black)',
            marginBottom: '24px'
          }}
        >
          더미데이터 삽입 중
        </p>

        {/* 진행 상태 텍스트 */}
        <p
          style={{
            font: 'var(--preSemiBold16)',
            color: 'var(--color-dark-gray)',
            marginBottom: '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
          }}
        >
          생성 중: lsfihdsfhilsejfisdjf... — {safeProgress}%
        </p>

        {/* 진행바 */}
        <div
          style={{
            width: '100%',
            height: '25px',
            backgroundColor: 'var(--color-gray-200)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              width: `${safeProgress}%`,
              height: '100%',
              backgroundColor: '#2b4580',
              transition: 'width 0.5s ease'
            }}
          />
        </div>

        {/* 로그 박스 */}
        <div
          style={{
            flex: '1',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-gray-blue)',
            borderRadius: '12px',
            padding: '20px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: 'var(--color-dark-gray)',
            font: 'var(--preRegular18)',
            overflowY: 'auto'
          }}
        >
          {logs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}

export default DummyInsertView
