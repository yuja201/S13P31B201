import React, { useState, useEffect, useRef } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import successIcon from '@renderer/assets/imgs/success.svg'
import warningIcon from '@renderer/assets/imgs/warning.svg'
import failureIcon from '@renderer/assets/imgs/failure.svg'

const DummyInsertView: React.FC = () => {
  const [progress] = useState<number>(73)
  const [logs] = useState<string[]>(
    Array.from({ length: 40 }, (_, i) => `데이터 생성 완료: posts 테이블 — ${i + 1}%`)
  )

  const logEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // ✅ 상태에 따른 아이콘 반환 함수
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'success':
        return successIcon
      case 'warning':
        return warningIcon
      case 'failure':
        return failureIcon
      default:
        return warningIcon
    }
  }

  // ✅ 테이블 리스트에 상태(status) 추가
  const tables = [
    { name: 'users', status: 'success' },
    { name: 'categories', status: 'success' },
    { name: 'posts', status: 'warning' },
    { name: 'phones', status: 'failure' }
  ]

  return (
    <div
      style={{
        position: 'relative',
        height: 'calc(100vh - 160px)',
        overflow: 'hidden',
        backgroundColor: 'var(--color-background)',
        padding: '40px 60px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 상단 타이틀 */}
      <div style={{ marginBottom: 30, flexShrink: 0 }}>
        <PageTitle
          title="더미데이터 생성"
          description="더미데이터를 생성중입니다. 잠시만 기다려주세요."
        />
      </div>

      {/* 좌우 영역 */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flex: 1,
          minHeight: 0,
          overflow: 'visible'
        }}
      >
        {/* 왼쪽 카드 */}
        <div
          style={{
            width: 260,
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-gray-200)',
            borderRadius: 16,
            boxShadow: 'var(--shadow)',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ marginBottom: 12, flexShrink: 0 }}>
            <p style={{ font: 'var(--preBold18)', color: 'var(--color-black)' }}>Table List</p>
            <p style={{ font: 'var(--preRegular14)', color: 'var(--color-gray-500)' }}>
              {tables.length} table
            </p>
          </div>

          {/* ✅ 상태별 아이콘 표시 */}
          <ul
            style={{
              flex: 1,
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              overflowY: 'auto'
            }}
          >
            {tables.map((t, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  font: 'var(--preRegular16)',
                  color: 'var(--color-black)'
                }}
              >
                <img
                  src={getStatusIcon(t.status)}
                  alt={t.status}
                  style={{ width: 18, height: 18 }}
                />
                {t.name}
              </li>
            ))}
          </ul>
        </div>

        {/* 오른쪽 카드 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
            overflow: 'visible'
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 16,
              boxShadow: 'var(--shadow)',
              padding: '30px 40px',
              boxSizing: 'border-box',
              minHeight: 0,
              overflow: 'hidden'
            }}
          >
            <p style={{ font: 'var(--preBold20)', color: 'var(--color-black)', marginBottom: 16 }}>
              더미데이터 삽입 중
            </p>

            {/* 진행 상태 */}
            <p
              style={{
                font: 'var(--preSemiBold16)',
                color: 'var(--color-dark-gray)',
                marginBottom: 8,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              생성 중: lsfihdsfhilsejfisdjf… — {progress}%
            </p>

            {/* 진행바 */}
            <div
              style={{
                width: '100%',
                height: 25,
                backgroundColor: 'var(--color-gray-200)',
                borderRadius: 12,
                overflow: 'hidden',
                marginBottom: 20,
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#2b4580',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>

            {/* 로그 박스 */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-gray-blue)',
                borderRadius: 12,
                padding: '20px 30px',
                overflowY: 'auto', // ✅ 로그만 스크롤
                color: 'var(--color-dark-gray)',
                font: 'var(--preRegular18)',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DummyInsertView
