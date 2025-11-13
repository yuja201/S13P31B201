import React from 'react'
import PageTitle from '@renderer/components/PageTitle'

const HistoryView: React.FC = () => {
  const title = '테스트 히스토리'
  const description = '이전에 진행된 테스트 이력을 확인하세요'
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
              {/* 임시 데이터입니다. */}
              <tr>
                <td>성공</td>
                <td>주문 생성 시나리오</td>
                <td>
                  <span className="badge badge-query">QUERY</span>
                </td>
                <td>2023-10-27 14:30:15</td>
                <td>평균 응답 시간: 25.3ms</td>
              </tr>
              <tr>
                <td>실패</td>
                <td>사용자 테이블 인덱스 분석</td>
                <td>
                  <span className="badge badge-index">INDEX</span>
                </td>
                <td>2023-10-27 14:28:10</td>
                <td>인덱스 스캔 비율: 85%</td>
              </tr>
            </tbody>
          </table>
        </div>
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
          font: var(--preMedium14);
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
        .badge {
          padding: 4px 8px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-query { background-color: #EFF6FF; color: #1D4ED8; }
        .badge-index { background-color: #F5F3FF; color: #5B21B6; }
      `}</style>
    </>
  )
}

export default HistoryView
