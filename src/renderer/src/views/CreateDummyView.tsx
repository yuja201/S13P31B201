import React, { useState } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import DBTableList from '@renderer/components/DBTableList'
import DBTableDetail from '@renderer/components/DBTableDetail'

// 컬럼 상세 정보 타입
export type ColumnDetail = {
  name: string
  type: string
  constraints: string[] // This should be an array of strings
  generation: string
  setting: string
}

// 테이블 전체 정보 타입
export type TableInfo = {
  id: string
  name: string
  columns: number
  rows: number
  columnDetails: ColumnDetail[]
}

// Mock 데이터
const mockTables: TableInfo[] = [
  {
    id: 'users',
    name: 'users',
    columns: 6,
    rows: 15324,
    columnDetails: [
      {
        name: 'id',
        type: 'VARCHAR(50)',
        constraints: ['PK', 'NOT NULL', 'UNIQUE'],
        generation: '',
        setting: '아이디'
      },
      {
        name: 'age',
        type: 'INTEGER',
        constraints: [
          'FK',
          'PK',
          'CHECK',
          'NOT NULL',
          'UNIQUE',
          'DEFAULT',
          'AUTO INCREMENT',
          'DOMAIN',
          'ENUM'
        ],
        generation: '참조',
        setting: 'user.id(2)'
      },
      {
        name: 'status',
        type: 'VARCHAR(10)',
        constraints: ['DEFAULT', 'NOT NULL', 'CHECK'],
        generation: '고정값',
        setting: "'active'"
      },
      {
        name: 'user_level',
        type: 'INTEGER',
        constraints: ['DEFAULT', 'CHECK'],
        generation: 'Sequence',
        setting: '1~5'
      },
      {
        name: 'serial_number',
        type: 'BIGINT',
        constraints: ['AUTO INCREMENT', 'UNIQUE'],
        generation: 'Auto Increment',
        setting: '자동 증가'
      },
      {
        name: 'email',
        type: 'email_domain',
        constraints: ['DOMAIN', 'UNIQUE'],
        generation: 'Faker.js',
        setting: '이메일'
      },
      {
        name: 'created_at',
        type: 'DATETIME',
        constraints: ['NOT NULL', 'DEFAULT'],
        generation: 'Timestamp',
        setting: '현재 시간'
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
        constraints: ['PK', 'AUTO INCREMENT'],
        generation: 'Auto Increment',
        setting: '1부터 시작'
      },
      {
        name: 'title',
        type: 'VARCHAR(255)',
        constraints: ['NOT NULL'],
        generation: 'Faker.js',
        setting: '제목'
      },
      {
        name: 'content',
        type: 'TEXT',
        constraints: [],
        generation: 'Faker.js',
        setting: '내용'
      },
      {
        name: 'author_id',
        type: 'VARCHAR(50)',
        constraints: ['FK', 'NOT NULL'],
        generation: '참조',
        setting: 'users.id'
      },
      {
        name: 'views',
        type: 'INTEGER',
        constraints: ['DEFAULT', 'CHECK'],
        generation: '고정값',
        setting: '0'
      }
    ]
  },
  {
    id: 'products',
    name: 'products',
    columns: 5,
    rows: 15324,
    columnDetails: [
      {
        name: 'product_id',
        type: 'SERIAL',
        constraints: ['PK'],
        generation: 'Auto',
        setting: '자동'
      },
      {
        name: 'name',
        type: 'VARCHAR(100)',
        constraints: ['NOT NULL', 'UNIQUE'],
        generation: 'Faker',
        setting: '상품명'
      },
      {
        name: 'price',
        type: 'DECIMAL(10,2)',
        constraints: ['NOT NULL', 'CHECK'],
        generation: 'Random',
        setting: '> 0'
      },
      {
        name: 'category_id',
        type: 'INTEGER',
        constraints: ['FK'],
        generation: 'Ref',
        setting: 'categories.id'
      },
      {
        name: 'stock',
        type: 'INTEGER',
        constraints: ['DEFAULT'],
        generation: 'Fixed',
        setting: '100'
      }
    ]
  },
  {
    id: 'categories',
    name: 'categories',
    columns: 2,
    rows: 15324,
    columnDetails: [
      {
        name: 'category_id',
        type: 'INTEGER',
        constraints: ['PK', 'AUTO INCREMENT'],
        generation: 'Auto',
        setting: '자동'
      },
      {
        name: 'category_name',
        type: 'VARCHAR(50)',
        constraints: ['UNIQUE', 'NOT NULL'],
        generation: 'Faker',
        setting: '카테고리명'
      }
    ]
  }
]

const CreateDummyView: React.FC = () => {
  const title = '더미데이터 생성'
  const description =
    '테이블을 선택하고 컬럼별 데이터 생성 방식을 설정하세요.\nAI, Faker.js, 파일 업로드, 직접 입력 중 원하는 방식으로 데이터를 생성하세요.'

  // 첫 번째 테이블을 기본값으로 설정
  const [focusedTable, setFocusedTable] = useState<TableInfo>(mockTables[0])

  return (
    <>
      <div className="dummy-view-container">
        <PageTitle title={title} description={description} />
        <div className="dummy-content-wrapper">
          <DBTableList
            tables={mockTables}
            focusedTableId={focusedTable.id}
            onTableSelect={setFocusedTable}
          />
          {focusedTable && <DBTableDetail table={focusedTable} />}
        </div>
      </div>

      <style>{`
        .dummy-view-container{
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content:center;
        }
        .dummy-content-wrapper {
          display: flex;
          flex-direction: row;
          width: 100%;
          margin-top: 32px;
          flex-grow: 1;
          min-height: 0;
         }
      `}</style>
    </>
  )
}

export default CreateDummyView
