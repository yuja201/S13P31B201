import React, { useState, useMemo } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import { BsCheckCircleFill, BsXCircleFill, BsExclamationTriangleFill } from 'react-icons/bs'

const mockHistoryData = [
  {
    status: 'success',
    testName: '주문 생성 시나리오',
    type: 'QUERY',
    timestamp: '2023-10-27 14:30:15',
    summary: '평균 응답 시간: 25.3ms'
  },
  {
    status: 'fail',
    testName: '사용자 테이블 인덱스 분석',
    type: 'INDEX',
    timestamp: '2023-10-27 14:28:10',
    summary: '인덱스 스캔 비율: 85%'
  },
  {
    status: 'warning',
    testName: '데이터 유효성 검사',
    type: 'QUERY',
    timestamp: '2023-10-27 14:25:00',
    summary: '일부 데이터 불일치 발견'
  },
  {
    status: 'success',
    testName: '주문 생성 시나리오',
    type: 'QUERY',
    timestamp: '2023-10-27 14:30:15',
    summary: '평균 응답 시간: 25.3ms'
  },
  {
    status: 'success',
    testName: '주문 생성 dgdfgdgdfgdgdf시나리오',
    type: 'QUERY',
    timestamp: '2023-10-27 14:30:15',
    summary: '평균 응답 시간: 25.3ms'
  },
  {
    status: 'success',
    testName: '주문 생성 시나리오',
    type: 'QUERY',
    timestamp: '2023-10-27 14:30:15',
    summary: '평균 응답 시간: 25.3ms'
  },
  {
    status: 'success',
    testName: '주문 생성 시나리오',
    type: 'QUERY',
    timestamp: '2023-10-27 14:30:15',
    summary: '평균 응답 시간: 25.3ms'
  },
  {
    status: 'fail',
    testName: '사용자 테이블 인덱스 분석',
    type: 'INDEX',
    timestamp: '2023-10-27 14:28:10',
    summary: '인덱스 스캔 비율: 85%'
  },
  {
    status: 'fail',
    testName: '사용자 테이블 인덱스 분석',
    type: 'INDEX',
    timestamp: '2023-10-27 14:28:10',
    summary: '인덱스 스캔 비율: 85%'
  },
  {
    status: 'fail',
    testName: '사용자 테이블 인덱스 분석',
    type: 'INDEX',
    timestamp: '2023-10-27 14:28:10',
    summary: '인덱스 스캔 비율: 85%'
  },
  {
    status: 'fail',
    testName: '사용자 테이블 인덱스 분석',
    type: 'INDEX',
    timestamp: '2023-10-27 14:28:10',
    summary: '인덱스 스캔 비율: 85%'
  }
]
const HistoryView: React.FC = () => {
  const title = '테스트 히스토리'
  const description = '이전에 진행된 테스트 이력을 확인하세요'

  const statusConfig = {
    success: { icon: BsCheckCircleFill, color: '#4ade80' },
    fail: { icon: BsXCircleFill, color: '#f87171' },
    warning: { icon: BsExclamationTriangleFill, color: '#fbbf24' }
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalItems = mockHistoryData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return mockHistoryData.slice(startIndex, endIndex)
  }, [currentPage, itemsPerPage])

  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <>
      <div className="history-container">
        <PageTitle title={title} description={description} />
        <div className="table-scroll-wrapper">
          <table className="column-table">
            <thead>
              <tr>
                <th>상태</th>
                <th>테스트명</th>
                <th>타입</th>
                <th>테스트시간</th>
                <th>결과 요약</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => {
                const IconComponent = statusConfig[item.status].icon
                const IconColor = statusConfig[item.status].color
                return (
                  <tr key={index}>
                    <td>
                      <IconComponent color={IconColor} size={20} />
                    </td>
                    <td>{item.testName}</td>
                    <td>
                      <span className={`badge badge-${item.type.toLowerCase()}`}>{item.type}</span>
                    </td>
                    <td>{item.timestamp}</td>
                    <td>{item.summary}</td>
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
              &lt; 이전
            </button>

            <div className="page-numbers">
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              다음 &gt;
            </button>
          </div>
        )}
      </div>
      <style>{`
        .history-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 20px;
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
          vertical-align: middle;
          border-bottom: 1px solid var(--color-gray-200);
          background-color: var(--color-white); 
          transition: background-color 0.2s ease;
          word-break: break-word;
        }

        .column-table th:nth-child(1),
        .column-table td:nth-child(1),
        .column-table td:nth-child(3),
        .column-table th:nth-child(3) {
          width: 100px; 
        }

        .column-table td:nth-child(4) {
          width: 250px; 
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
          background-color: #F5F3FF; 
          color: #5B21B6; 
        }
        
        .pagination-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px 0;
            margin-top: auto;
        }
        .pagination-button, .pagination-number {
            background-color: transparent;
            border: 1px solid var(--color-gray-300, #ccc);
            color: var(--color-dark-gray, #333);
            padding: 8px 12px;
            margin: 0 4px;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        .pagination-button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }
        .pagination-number:hover:not(.active) {
            background-color: var(--color-gray-100, #f0f0f0);
        }
        .pagination-number.active {
            background-color: var(--color-blue-600, #1d4ed8); 
            color: white;
            border-color: var(--color-blue-600, #1d4ed8);
        }
      `}</style>
    </>
  )
}

export default HistoryView
