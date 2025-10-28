import { useState } from 'react'
import type { ReactElement, CSSProperties } from 'react'
import { FiSearch } from 'react-icons/fi'

interface MiniSearchBoxProps {
  placeholder?: string
  onSearch?: (value: string) => void
  onSearchClick?: () => void
}

const MiniSearchBox = ({
  placeholder = '프로젝트 검색',
  onSearch,
  onSearchClick
}: MiniSearchBoxProps): ReactElement => {
  const [searchValue, setSearchValue] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setSearchValue(value)
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleSearchClick = (): void => {
    if (onSearchClick) {
      onSearchClick()
    }
  }

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '228px',
    height: '36px',
    display: 'flex',
    alignItems: 'center'
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    border: '1px solid #e8e8e8',
    borderRadius: '20px',
    padding: '8px 40px 8px 16px',
    fontSize: '12px',
    fontFamily: 'var(--font-family)',
    fontWeight: 'var(--fw-regular)' as React.CSSProperties['fontWeight'],
    color: 'var(--color-dark-gray)',
    backgroundColor: 'var(--color-white)',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--shadow)'
  }

  const iconStyle: CSSProperties = {
    position: 'absolute',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#c0c0c0',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    fontSize: '20px'
  }

  return (
    <>
      <style>
        {`
          .mini-search-box-input::placeholder {
            color: var(--color-placeholder);
            font-weight: var(--fw-regular);
          }
        `}
      </style>
      <div style={containerStyle}>
        <input
          type="text"
          className="mini-search-box-input"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleChange}
          style={inputStyle}
        />
        <button onClick={handleSearchClick} type="button" style={iconStyle}>
          <FiSearch size={20} color="#c0c0c0" />
        </button>
      </div>
    </>
  )
}

export default MiniSearchBox
