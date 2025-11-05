import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageTitle from '@renderer/components/PageTitle'
import SimpleCard from '@renderer/components/SimpleCard'
import Button from '@renderer/components/Button'

const DashboardView: React.FC = () => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()

  const navigateTo = (path: string): void => {
    if (projectId) {
      navigate(`/main/${path}/${projectId}`)
    }
  }

  return (
    <div className="dashboard-container">
      {/* 헤더 섹션 */}
      <section className="dashboard-header">
        <PageTitle
          title="프로젝트 대시보드"
          description="Here's Dummy에 오신 것을 환영합니다. 데이터베이스 테스트를 위한 더미데이터를 손쉽게 생성하고 관리하세요."
        />
      </section>

      {/* 시작하기 가이드 */}
      <section className="guide-section">
        <h2 className="preSemiBold24 section-title">시작하기</h2>
        <div className="guide-steps">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="preSemiBold18">스키마 확인</h3>
            <p className="preRegular14">
              연결된 데이터베이스의 테이블 구조와 컬럼 정보를 확인하세요.
            </p>
            <Button variant="blue" size="sm" onClick={() => navigateTo('schema')}>
              스키마 보기
            </Button>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="preSemiBold18">더미데이터 생성</h3>
            <p className="preRegular14">
              Faker.js 또는 AI를 활용하여 현실적인 테스트 데이터를 생성하세요.
            </p>
            <Button variant="blue" size="sm" onClick={() => navigateTo('dummy')}>
              데이터 생성하기
            </Button>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="preSemiBold18">성능 테스트</h3>
            <p className="preRegular14">
              생성된 데이터로 데이터베이스 성능을 테스트하고 분석하세요.
            </p>
            <Button variant="blue" size="sm" onClick={() => navigateTo('test')}>
              테스트 시작
            </Button>
          </div>
        </div>
      </section>

      {/* 주요 기능 카드 */}
      <section className="features-section">
        <h2 className="preSemiBold24 section-title">주요 기능</h2>
        <div className="feature-cards">
          <SimpleCard
            title="프로젝트 정보"
            description="데이터베이스 연결 정보 관리"
            onSelect={() => navigateTo('info')}
          />
          <SimpleCard
            title="더미데이터 생성"
            description="Faker/AI 기반 데이터 생성"
            onSelect={() => navigateTo('dummy')}
          />
          <SimpleCard
            title="DB 성능 테스트"
            description="쿼리 성능 측정 및 분석"
            onSelect={() => navigateTo('test')}
          />
          <SimpleCard
            title="테스트 히스토리"
            description="과거 테스트 결과 조회"
            onSelect={() => navigateTo('history')}
          />
        </div>
      </section>

      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 48px;
          width: 100%;
          height: 100%;
          overflow-y: auto;
        }

        .section-title {
          margin-bottom: 24px;
          color: var(--color-black);
        }

        /* 가이드 스텝 */
        .guide-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .step-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 24px;
          background: var(--color-white);
          border-radius: 12px;
          box-shadow: var(--shadow);
          transition: all 0.2s;
        }

        .step-card:hover {
          box-shadow: 2px 4px 6px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .step-number {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-main-blue);
          color: white;
          border-radius: 50%;
          font-weight: 700;
          font-size: 18px;
        }

        .step-card h3 {
          color: var(--color-black);
          margin-top: 8px;
        }

        .step-card p {
          color: var(--color-dark-gray);
          line-height: 1.5;
          flex: 1;
        }

        /* 기능 카드 */
        .feature-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }
      `}</style>
    </div>
  )
}

export default DashboardView
