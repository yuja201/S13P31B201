import React, { useState } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import DBTableList from '@renderer/components/DBTableList'
import DBTableDetail from '@renderer/components/DBTableDetail'

// 컬럼 상세 정보 타입
export type ColumnDetail = {
  name: string
  type: string
  constraints: string[]
  generation: string
  setting: string
}

// 테이블 전체 정보 타입
export type TableInfo = {
  id: string
  name: string
  columns: number
  rows: number
  columnDetails: ColumnDetail[] // columnDetails를 포함시킵니다.
}

// Mock 데이터
const mockTables = [
  {
    id: 'users',
    name: 'users',
    columns: 6,
    rows: 15324,

    // 컬럼 데이터
    columnDetails: [
      {
        name: 'id',
        type: 'VARCHAR(50)',
        constraints: ['PK', 'NOT NULL', 'UNIQUE'],
        generation: 'Faker.js',
        setting: '아이디'
      },
      {
        name: 'age',
        type: 'INTEGER',
        constraints: ['FK', 'ENUM'],
        generation: '참조',
        setting: 'user.id(2)'
      },
      {
        name: 'created_at',
        type: 'DATETIME',
        constraints: ['NOT NULL'],
        generation: '-',
        setting: '-'
      }
    ]
  },
  {
    id: 'posts',
    name: 'posts',
    columns: 8,
    rows: 15324,
    columnDetails: [
      {
        name: 'post_id',
        type: 'INTEGER',
        constraints: ['PK'],
        generation: 'Auto Increment',
        setting: '1부터 시작'
      }
      // ... (posts 테이블의 컬럼들)
    ]
  },
  {
    id: 'name',
    name: 'name',
    columns: 6,
    rows: 15324,

    // 컬럼 데이터
    columnDetails: [
      {
        name: 'id',
        type: 'VARCHAR(50)',
        constraints: ['PK', 'NOT NULL', 'UNIQUE'],
        generation: 'Faker.js',
        setting: '아이디'
      },
      {
        name: 'age',
        type: 'INTEGER',
        constraints: ['FK', 'ENUM'],
        generation: '참조',
        setting: 'user.id(2)'
      },
      {
        name: 'created_at',
        type: 'DATETIME',
        constraints: ['NOT NULL'],
        generation: '-',
        setting: '-'
      }
    ]
  },
  {
    id: 'age',
    name: 'age',
    columns: 6,
    rows: 15324,

    // 컬럼 데이터
    columnDetails: [
      {
        name: 'id',
        type: 'VARCHAR(50)',
        constraints: ['PK', 'NOT NULL', 'UNIQUE'],
        generation: 'Faker.js',
        setting: '아이디'
      },
      {
        name: 'age',
        type: 'INTEGER',
        constraints: ['FK', 'ENUM'],
        generation: '참조',
        setting: 'user.id(2)'
      },
      {
        name: 'created_at',
        type: 'DATETIME',
        constraints: ['NOT NULL'],
        generation: '-',
        setting: '-'
      }
    ]
  },
  {
    id: 'age',
    name: 'age',
    columns: 6,
    rows: 15324,

    // 컬럼 데이터
    columnDetails: [
      {
        name: 'id',
        type: 'VARCHAR(50)',
        constraints: ['PK', 'NOT NULL', 'UNIQUE'],
        generation: 'Faker.js',
        setting: '아이디'
      },
      {
        name: 'age',
        type: 'INTEGER',
        constraints: ['FK', 'ENUM'],
        generation: '참조',
        setting: 'user.id(2)'
      },
      {
        name: 'created_at',
        type: 'DATETIME',
        constraints: ['NOT NULL'],
        generation: '-',
        setting: '-'
      }
    ]
  },
  {
    id: 'age',
    name: 'age',
    columns: 6,
    rows: 15324,

    // 컬럼 데이터
    columnDetails: [
      {
        name: 'id',
        type: 'VARCHAR(50)',
        constraints: ['PK', 'NOT NULL', 'UNIQUE'],
        generation: 'Faker.js',
        setting: '아이디'
      },
      {
        name: 'age',
        type: 'INTEGER',
        constraints: ['FK', 'ENUM'],
        generation: '참조',
        setting: 'user.id(2)'
      },
      {
        name: 'created_at',
        type: 'DATETIME',
        constraints: ['NOT NULL'],
        generation: '-',
        setting: '-'
      }
    ]
  },
  {
    id: 'age',
    name: 'age',
    columns: 6,
    rows: 15324,

    // 컬럼 데이터
    columnDetails: [
      {
        name: 'id',
        type: 'VARCHAR(50)',
        constraints: ['PK', 'NOT NULL', 'UNIQUE'],
        generation: 'Faker.js',
        setting: '아이디'
      },
      {
        name: 'age',
        type: 'INTEGER',
        constraints: ['FK', 'ENUM'],
        generation: '참조',
        setting: 'user.id(2)'
      },
      {
        name: 'created_at',
        type: 'DATETIME',
        constraints: ['NOT NULL'],
        generation: '-',
        setting: '-'
      }
    ]
  }

  // ... (product, reviews 등 나머지 테이블)
]

const CreateDummyView: React.FC = () => {
  const title = '더미데이터 생성'
  const description =
    '테이블을 선택하고 컬럼별 데이터 생성 방식을 설정하세요.\nAI, Faker.js, 파일 업로드, 직접 입력 중 원하는 방식으로 데이터를 생성하세요.'

  // 첫 번째 테이블을 기본값으로 설정
  const [focusedTable, setFocusedTable] = useState(mockTables[0])

  return (
    <>
      <div className="dummy-view-container">
        <PageTitle title={title} description={description} />

        {/* --- 메인 컨텐츠 (2단 레이아웃) --- */}
        <div className="dummy-content-wrapper">
          {/* ---  왼쪽 테이블 목록 --- */}
          <DBTableList
            tables={mockTables}
            focusedTableId={focusedTable.id}
            onTableSelect={setFocusedTable}
          />

          {/* --- 오른쪽 상세 설정 --- */}
          <div className="table-detail-container shadow">
            {/* focusedTable이 있을 때만 상세 정보를 렌더링 */}
            {focusedTable && <DBTableDetail table={focusedTable} />}
          </div>
        </div>
      </div>

      {/* --- 페이지 전체 스타일 --- */}
      <style>{`
        .dummy-view-container{
          display: flex;  
          flex-direction: column;
          height: 100%
        }
        .dummy-content-wrapper {
          display: flex;
          flex-direction: row;
          width: 100%;
          margin-top: 32px;
          flex-grow: 1;
          min-height: 0;
         }
        .table-detail-container {
          flex-grow: 1;
          background-color: var(--color-white);
          border-radius: 10px;
          padding: 32px;
        }
      `}</style>
    </>
  )
}

export default CreateDummyView
