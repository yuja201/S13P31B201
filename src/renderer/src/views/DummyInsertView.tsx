import React, { useState, useEffect, useRef } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import successIcon from '@renderer/assets/imgs/success.svg'
import warningIcon from '@renderer/assets/imgs/warning.svg'
import failureIcon from '@renderer/assets/imgs/failure.svg'
import Button from '@renderer/components/Button'

type InsertMode = 'sql' | 'db'

const DummyInsertView: React.FC = () => {
  // 방식
  const [mode, setMode] = useState<InsertMode>('sql')

  // 진행 상태
  const [progress, setProgress] = useState<number>(0)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  // 결과 데이터 개수
  const [totalCount] = useState<number>(20000)
  const [insertedCount, setInsertedCount] = useState<number>(0)

  // 로그 데이터
  const [logs, setLogs] = useState<string[]>([
    '데이터 생성 완료: users 테이블 — 100%',
    '데이터 생성 완료: categories 테이블 — 100%'
  ])
  const [errors, setErrors] = useState<string[]>([])

  const logEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // 더미 progress 시뮬레이션 (테스트용)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 25
        if (next >= 100) {
          clearInterval(timer)
          setIsCompleted(true)
          setInsertedCount(19998)
        }
        return Math.min(next, 100)
      })
    }, 800)
    return () => clearInterval(timer)
  }, [])

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
      {/* 상단 제목 */}
      <div style={{ marginBottom: 30, flexShrink: 0 }}>
        <PageTitle
          title={
            isCompleted
              ? mode === 'sql'
                ? '더미데이터 SQL 삽입문 생성 완료'
                : '더미데이터 삽입 완료'
              : mode === 'sql'
                ? '더미데이터 SQL 삽입문 생성 중'
                : '더미데이터 삽입 중'
          }
          description={
            isCompleted
              ? `생성이 완료되었습니다.`
              : mode === 'sql'
                ? 'SQL 삽입문을 생성중입니다. 잠시만 기다려주세요.'
                : '데이터를 DB에 직접 삽입중입니다. 잠시만 기다려주세요.'
          }
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
        {/* 왼쪽 테이블 리스트 */}
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

        {/* 오른쪽 카드 영역 */}
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
            {/* 진행 중 / 완료 상태 분기 */}
            {!isCompleted ? (
              <>
                <p
                  style={{
                    font: 'var(--preBold20)',
                    color: 'var(--color-black)',
                    marginBottom: 16
                  }}
                >
                  더미데이터 생성 중
                </p>

                <p
                  style={{
                    font: 'var(--preSemiBold16)',
                    color: 'var(--color-dark-gray)',
                    marginBottom: 8
                  }}
                >
                  진행률: {progress}%
                </p>

                {/* 진행바 */}
                <div
                  style={{
                    width: '100%',
                    height: 25,
                    backgroundColor: 'var(--color-gray-200)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 20
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: 'var(--color-main-blue)',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>

                {/* 로그 */}
                <div
                  style={{
                    flex: 1,
                    border: '1px solid var(--color-gray-blue)',
                    borderRadius: 12,
                    padding: '20px 30px',
                    overflowY: 'auto',
                    color: 'var(--color-dark-gray)',
                    font: 'var(--preRegular16)'
                  }}
                >
                  {logs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </>
            ) : (
              <>
                {/* 완료 화면 */}
                <p
                  style={{
                    font: 'var(--preBold20)',
                    color: 'var(--color-black)',
                    marginBottom: 16
                  }}
                >
                  더미데이터 삽입 완료
                </p>

                <p
                  style={{
                    font: 'var(--preSemiBold16)',
                    color: 'var(--color-dark-gray)',
                    marginBottom: 20
                  }}
                >
                  전체 {totalCount.toLocaleString()}개의 데이터 중 총{' '}
                  {insertedCount.toLocaleString()}개 삽입 완료
                </p>

                <div
                  style={{
                    flex: 1,
                    border: '1px solid var(--color-gray-blue)',
                    borderRadius: 12,
                    padding: '20px 30px',
                    overflowY: 'auto',
                    font: 'var(--preRegular16)',
                    marginBottom: 20
                  }}
                >
                  {errors.length > 0 ? (
                    errors.map((e, i) => <div key={i}>{e}</div>)
                  ) : (
                    <div>
                      {mode === 'sql'
                        ? '모든 SQL 삽입문이 정상적으로 생성되었습니다.'
                        : '모든 데이터가 정상적으로 삽입되었습니다.'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  {mode === 'sql' && (
                    <Button variant="blue" onClick={() => console.log('SQL문 다운로드')}>
                      SQL문 다운로드
                    </Button>
                  )}
                  <Button variant="gray" onClick={() => console.log('완료 클릭')}>
                    완료
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DummyInsertView
