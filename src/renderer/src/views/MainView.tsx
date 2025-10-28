import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@renderer/components/Button'
import CreateProjectModal from '@renderer/modals/CreateProjectModal'

const MainView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const navigate = useNavigate()

  const goToProject = (): void => {
    navigate('/main/dashboard')
  }
  return (
    <div>
      <button
        className="preMedium16"
        onClick={() => navigate(-1)}
        style={{
          backgroundColor: 'var(--color-light-blue)',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          cursor: 'pointer'
        }}
      >
        ← 뒤로가기
      </button>

      {/* [!] 프로젝트 뷰로 이동하는 버튼 */}
      <button
        className="preMedium16"
        onClick={goToProject}
        style={{
          backgroundColor: 'var(--color-main-blue)',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          cursor: 'pointer'
        }}
      >
        프로젝트 1 선택 (사이드바 활성화) →
      </button>

      <h2 className="preSemiBold24" style={{ marginTop: '24px' }}>
        메인 페이지
      </h2>
      <p className="preRegular16">여기는 사이드바가 포함된 메인 화면입니다.</p>

      <Button onClick={() => setIsModalOpen(true)}>프로젝트 생성</Button>
      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}

export default MainView
