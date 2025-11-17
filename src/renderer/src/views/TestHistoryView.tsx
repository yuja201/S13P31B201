import React, { useState, useMemo, useEffect } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import { IoMdCheckmarkCircleOutline, IoMdCloseCircleOutline } from 'react-icons/io'
import { PiWarningBold } from 'react-icons/pi'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Button from '@renderer/components/Button'
import YujaWorkingImage from '../assets/imgs/yuja_working.png'
import type { Test } from '@shared/types'

const TestHistoryView: React.FC = () => {
  const title = '테스트 히스토리'
  const description = '이전에 진행된 테스트 이력을 확인하세요'

  const gradeConfig = {
    good: { icon: IoMdCheckmarkCircleOutline, color: '#4caf50', label: 'Good' },
    warning: { icon: PiWarningBold, color: '#fbc02d', label: 'Warning' },
    critical: { icon: IoMdCloseCircleOutline, color: '#e57373', label: 'Critical' }
  }

  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const location = useLocation()

  const [tests, setTests] = useState<Test[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setIsLoading(true)
        const testResults = await window.api.test.getAll()
        setTests(testResults)
      } catch (error) {
        console.error('Failed to fetch test history:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTests()
  }, [location])

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalItems = tests.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return tests.slice(startIndex, endIndex)
  }, [currentPage, itemsPerPage, tests])

  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleStartTest = (): void => {
    if (projectId) {
      navigate(`/main/test/${projectId}`)
    }
  }

  if (isLoading) {
    return <div>테스트 기록을 불러오는 중...</div>
  }

  if (totalItems === 0) {
    return (
      <>
        <div className="history-container">
          <PageTitle title={title} description={description} />
          <div className="empty-state-container">
            <img
              src={YujaWorkingImage}
              alt="Yuja working"
              style={{ width: '200px', height: '200px' }}
            />
            <h2 className="PreSemiBold16">테스트 이력 없음</h2>
            <p>
              아직 실행된 테스트가 없습니다. 지금 첫 번째 성능 분석을 시작하여
              <br />
              여기에 결과를 기록해 보세요!
            </p>
            <Button
              onClick={handleStartTest}
              size="md"
              variant="blue"
              className="start-test-button"
            >
              테스트 시작하기
            </Button>
          </div>
        </div>
        <style>{`
          .history-container {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .empty-state-container {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            gap:12px;
          }

          .start-test-button {
            background-color: var(--color-main-blue); 
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font: var(--PreMedium16);
            cursor: pointer;
            transition: background-color 0.2s ease, box-shadow 0.2s ease;
            border: none;
            margin-top:24px
          }
          .start-test-button:hover {
            cursor: pointer;
            background-color: #0f3a6e;
            box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
          }

        
        `}</style>
      </>
    )
  }
  return (
    <>
      <div className="history-container">
        <PageTitle title={title} description={description} />
        <div className="table-scroll-wrapper">
          <table className="column-table">
            <thead>
              <tr>
                <th>타입</th>
                <th>테스트명</th>
                <th>결과 요약</th>
                <th>테스트시간</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((test) => {
                const gradeInfo = test.grade ? gradeConfig[test.grade] : null
                const IconComponent = gradeInfo?.icon
                const IconColor = gradeInfo?.color

                let resultSummary = 'N/A'
                if (test.type === 'QUERY' && test.response_time !== null) {
                  resultSummary = `응답 시간: ${test.response_time.toFixed(2)}ms`
                } else if (test.type === 'INDEX' && test.index_ratio !== null) {
                  resultSummary = `인덱스 사용률: ${test.index_ratio.toFixed(1)}%`
                }

                return (
                  <tr key={test.id}>
                    <td>
                      <span className={`badge badge-${test.type.toLowerCase()}`}>{test.type
                      }</span>
                    </td>
                    <td>{test.summary || '요약 없음'}</td>
                    <td>{resultSummary}</td>
                    <td>{new Date(test.created_at * 1000).toLocaleString()}</td>
                    <td>
                      {IconComponent && IconColor && <IconComponent color={IconColor} size={24}
                      />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              &lt;
            </button>

            <div className="page-info">
              <span className="current-page-number">{currentPage}</span> /{' '}
              <span className="total-page-number">{totalPages}</span> 페이지
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
      <style>{`
        .history-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .table-scroll-wrapper {
          flex-grow: 1; 
          overflow-y: auto; 
          min-height: 0; 
          overflow-x: auto;
          margin-top: 32px;
          margin-bottom: 20px; 
        }
        .column-table {
          width: 100%;
          border-collapse: collapse;
          border-top: 1px solid var(--color-gray-200);
          table-layout: fixed;
          height:670px;
        }

        .column-table th {
          background-color: #FAFAFA;
          text-align: center;
          padding: 16px 8px;
          font: var(--preMedium16);
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .column-table td {
          padding: 16px;
          text-align: center;
          vertical-align: text-top;
          border-bottom: 1px solid var(--color-gray-200);
          background-color: var(--color-white); 
          transition: background-color 0.2s ease;
          word-break: break-word;
        }

        .column-table th:nth-child(1),
        .column-table td:nth-child(1),
        .column-table td:nth-child(5),
        .column-table th:nth-child(5) {
          width: 100px; 
        }

        .column-table th:nth-child(4),
        .column-table td:nth-child(4){
          width: 180px; 
        }
        
        .column-table td:nth-child(4){
          font: var(--preMedium14);
          color: var(--color-dark-gray);
        }

        .badge {
          padding: 4px 8px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;
          width: 60px;
        }
        .badge-query { 
          background-color: #EFF6FF; 
          color: #134686; 
        }
        .badge-index { 
          background-color: #FFF6E5; 
          color: #865713; 
        }
        
        .pagination-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px 0;
            margin-top: auto;
        }
        
        .page-info {
            font-size: 15px;
            font-weight: 500;
            color: var(--color-main-blue); 
            margin: 0 16px; 
        }
        .current-page-number {
            font-weight: 700;
            color: var(--color-main-blue); 
        }

        .pagination-button {
          border: none;
          color: #134686;
          padding: 8px 14px;
          margin: 0 4px;
          cursor: pointer;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s ease;
          background-color: var(--color-background);
        }

        .pagination-button:hover:not(:disabled) {
          background-color: #E6EEFF;
          border-color: #B6CCFF;
        }

        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
      `}</style>
    </>
  )
}

export default TestHistoryView
