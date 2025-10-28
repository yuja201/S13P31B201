import React, { useState } from 'react'
import SimpleCard from '@renderer/components/SimpleCard'

interface DomainOption {
  id: string
  title: string
  description: string
}

interface DomainCategory {
  category: string
  items: DomainOption[]
}

const SelectDomain: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (id: string): void => {
    setSelected(id)
  }

  const categories: DomainCategory[] = [
    {
      category: '이름/사람',
      items: [
        { id: '1', title: '이름', description: '이름(First Name)' },
        { id: '2', title: '성', description: '성(Last Name)' },
        { id: '3', title: '전체 이름', description: '이름과 성을 합친 전체 이름' },
        { id: '4', title: '직업명', description: '직업 또는 직책' }
      ]
    },
    {
      category: '주소/지역',
      items: [
        { id: '5', title: '도로명 주소', description: '상세 도로명 주소' },
        { id: '6', title: '도시', description: '도시 이름' },
        { id: '7', title: '국가', description: '국가 이름' },
        { id: '8', title: '우편번호', description: '우편번호' }
      ]
    },
    {
      category: '연락처/계정',
      items: [
        { id: '9', title: '이메일', description: '이메일 주소' },
        { id: '10', title: '전화번호', description: '전화번호' },
        { id: '11', title: '사용자명', description: '계정 아이디 또는 닉네임' },
        { id: '12', title: '도메인', description: '도메인 이름' }
      ]
    },
    {
      category: '회사/조직',
      items: [
        { id: '13', title: '회사명', description: '회사 이름' },
        { id: '14', title: '슬로건', description: '회사 슬로건 또는 문구' },
        { id: '15', title: '부서', description: '부서 이름' },
        { id: '16', title: '직종', description: '직무 분야' }
      ]
    },
    {
      category: '금융/결제',
      items: [
        { id: '17', title: '계좌번호', description: '은행 계좌번호' },
        { id: '18', title: '금액', description: '거래 금액' },
        { id: '19', title: '카드번호', description: '신용/체크카드 번호' },
        { id: '20', title: '거래유형', description: '입금, 출금 등 거래 종류' }
      ]
    },
    {
      category: '상품/상거래',
      items: [
        { id: '21', title: '상품명', description: '제품 이름' },
        { id: '22', title: '카테고리', description: '제품 분류' },
        { id: '23', title: '가격', description: '제품 가격' },
        { id: '24', title: '설명', description: '제품 설명 또는 소개문' }
      ]
    },
    {
      category: '차량/이동수단',
      items: [
        { id: '25', title: '제조사', description: '차량 브랜드명' },
        { id: '26', title: '모델명', description: '모델 이름' },
        { id: '27', title: '차량번호', description: '차량 번호판' },
        { id: '28', title: '차량 타입', description: '차량 종류 (SUV, 트럭 등)' }
      ]
    },
    {
      category: '날짜/시간',
      items: [
        { id: '29', title: '과거 날짜', description: '무작위 과거 일시' },
        { id: '30', title: '미래 날짜', description: '무작위 미래 일시' },
        { id: '31', title: '최근 날짜', description: '최근 시점의 일시' },
        { id: '32', title: '타임스탬프', description: 'UNIX timestamp' }
      ]
    },
    {
      category: '시스템/기술',
      items: [
        { id: '33', title: 'UUID', description: '고유 식별자(UUID)' },
        { id: '34', title: '파일명', description: '파일 이름' },
        { id: '35', title: '버전', description: '소프트웨어 버전 문자열' },
        { id: '36', title: '커밋 메시지', description: 'Git 커밋 메시지' }
      ]
    },
    {
      category: '데이터/숫자',
      items: [
        { id: '37', title: '정수', description: '랜덤 정수 값' },
        { id: '38', title: '실수', description: '랜덤 실수 값' },
        { id: '39', title: '불리언', description: 'true 또는 false 값' },
        { id: '40', title: '랜덤 문자열', description: '무작위 문자열 데이터' }
      ]
    },
    {
      category: '텍스트/콘텐츠',
      items: [
        { id: '41', title: '문장', description: '짧은 문장' },
        { id: '42', title: '문단', description: '랜덤 긴 문단' },
        { id: '43', title: '단어', description: '단어 하나' },
        { id: '44', title: '키워드', description: '주제나 태그용 단어' }
      ]
    },
    {
      category: '과학/교육',
      items: [
        { id: '45', title: '화학 원소', description: '화학 원소 이름' },
        { id: '46', title: '단위', description: '물리 단위' },
        { id: '47', title: '과목명', description: '학교 과목 이름' },
        { id: '48', title: '학교명', description: '학교 또는 기관 이름' }
      ]
    },
    {
      category: '색상/디자인',
      items: [
        { id: '49', title: '색상명', description: '사람이 읽을 수 있는 색상 이름' },
        { id: '50', title: 'RGB 값', description: 'RGB 형태의 색상값' },
        { id: '51', title: 'HEX 코드', description: '16진수 색상 코드' },
        { id: '52', title: '이미지 URL', description: '랜덤 이미지 주소' }
      ]
    },
    {
      category: '엔터테인먼트/기타',
      items: [
        { id: '53', title: '음악 장르', description: '랜덤 음악 장르' },
        { id: '54', title: '노래 이름', description: '랜덤 노래 제목' },
        { id: '55', title: '동물 이름', description: '동물 이름' }
      ]
    }
  ]

  return (
    <>
      <div className="select-domain-wrapper">
        <div className="select-domain__header">
          <span className="select-domain__title">도메인 선택</span>
          <span className="select-domain__required">*</span>
        </div>

        <div className="select-domain">
          <div className="select-domain__scroll">
            {categories.map((category) => (
              <div key={category.category} className="select-domain__group">
                <h3 className="select-domain__category">{category.category}</h3>
                <div className="select-domain__grid">
                  {category.items.map((item) => (
                    <SimpleCard
                      key={item.id}
                      title={item.title}
                      description={item.description}
                      size="sm"
                      selected={selected === item.id}
                      onSelect={() => handleSelect(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .select-domain-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .select-domain__header {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 4px;
        }

        .select-domain__title {
          font: var(--preMedium16);
          color: var(--color-black);
        }

        .select-domain__required {
          color: #e53935;
          font-weight: bold;
        }

        .select-domain {
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          background-color: var(--color-white);
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
        }

        .select-domain__group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .select-domain__category {
          font: var(--preMedium16);
          color: var(--color-black);
        }

        .select-domain__grid {
          display: grid;
          grid-template-columns: repeat(2, auto);
          justify-content: center;
          gap: 16px;
        }

        .select-domain__scroll::-webkit-scrollbar {
          width: 6px;
        }

        .select-domain__scroll::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .select-domain__scroll::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </>
  )
}

export default SelectDomain
