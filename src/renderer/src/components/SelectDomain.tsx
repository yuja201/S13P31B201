import React, { useEffect, useState } from 'react'
import SimpleCard from '@renderer/components/SimpleCard'
import { mapColumnToLogicalType } from '@renderer/utils/logicalTypeMap'
import { useProjectStore } from '@renderer/stores/projectStore'
import type { DomainCategory, Domain } from '@main/database/types'

interface SelectDomainProps {
  source: 'FAKER' | 'AI'
  columnType: string
  onChange: (domain: { id: number; name: string }) => void
}

const SelectDomain: React.FC<SelectDomainProps> = ({ source, columnType, onChange }) => {
  const [selected, setSelected] = useState<number | null>(null)
  const [categories, setCategories] = useState<DomainCategory[]>([])
  const { selectedProject } = useProjectStore()
  const dbms = selectedProject?.dbms?.name ?? 'mysql'

  // faker가 지원하지 않는 도메인 ID 목록
  const excludedForFaker = new Set<number>([16, 27, 32, 44, 47, 48])

  /** DB에서 logical_type 기준으로 도메인 불러오기 */
  useEffect(() => {
    const fetchDomains = async (): Promise<void> => {
      try {
        const logicalType = mapColumnToLogicalType(dbms, columnType)
        const data: DomainCategory[] = await window.api.domain.getByLogicalType(logicalType)
        setCategories(data)
        setSelected(null)
        onChange({ id: 0, name: '' })
      } catch (err) {
        console.error('도메인 불러오기 실패:', err)
      }
    }

    if (columnType) fetchDomains()
  }, [columnType, dbms])

  /** 도메인 선택 핸들러 */
  const handleSelect = (id: number, name: string): void => {
    setSelected(id)
    onChange({ id, name })
  }

  /** Faker 제외 처리 */
  const filteredCategories: DomainCategory[] =
    source === 'FAKER'
      ? categories
          .map((category) => ({
            ...category,
            items: category.items.filter((item: Domain) => !excludedForFaker.has(item.id))
          }))
          .filter((category) => category.items.length > 0)
      : categories

  return (
    <>
      <div className="select-domain-wrapper">
        <div className="select-domain__header">
          <span className="select-domain__title">도메인 선택</span>
          <span className="select-domain__required">*</span>
        </div>

        <div className="select-domain">
          <div className="select-domain__scroll">
            {filteredCategories.map((category) => (
              <div key={category.category} className="select-domain__group">
                <h3 className="select-domain__category">{category.category}</h3>
                <div className="select-domain__grid">
                  {category.items.map((item) => (
                    <SimpleCard
                      key={item.id}
                      title={item.name}
                      description={item.description}
                      size="sm"
                      selected={selected === item.id}
                      onSelect={() => handleSelect(item.id, item.name)}
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
          font: var(--preSemiBold16);
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
          padding: 16px 12px 16px 16px;
          max-height: 400px;
          overflow-y: auto;
          box-sizing: border-box;
          scrollbar-gutter: stable both-edges;
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

        .select-domain::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .select-domain::-webkit-scrollbar-thumb {
          background-color: rgba(100, 100, 100, 0.35);
          border-radius: 10px;
          border: 3px solid transparent;
          background-clip: content-box;
        }

        .select-domain::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 100, 100, 0.5);
        }

        .select-domain::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </>
  )
}

export default SelectDomain
