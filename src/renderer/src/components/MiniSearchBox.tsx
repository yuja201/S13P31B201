import { useState } from 'react'
import type { ReactElement, CSSProperties } from 'react'

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
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </>
  )
}

export default MiniSearchBox
