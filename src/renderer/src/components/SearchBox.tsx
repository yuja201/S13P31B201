import { useState } from 'react'
import type { ReactElement, CSSProperties } from 'react'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (value: string) => void
  onSearchClick?: () => void
}

const SearchBar = ({
  placeholder = '프로젝트 검색',
  onSearch,
  onSearchClick
}: SearchBarProps): ReactElement => {
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
    width: '675px',
    height: '60px',
    display: 'flex',
    alignItems: 'center'
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    border: '1px solid #e8e8e8',
    borderRadius: '20px',
    padding: '0 64px 0 32px',
    fontSize: '24px',
    fontFamily: 'Pretendard, "Noto Sans KR", sans-serif',
    fontWeight: 400,
    color: '#666666',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '2px 2px 4px 2px rgba(0, 0, 0, 0.1)'
  }

  const iconStyle: CSSProperties = {
    position: 'absolute',
    right: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#c0c0c0',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    fontSize: '30px'
  }

  return (
    <>
      <style>
        {`
          .search-bar-input::placeholder {
            color: #b8b6b6;
            font-weight: 400;
          }
        `}
      </style>
      <div style={containerStyle}>
        <input
          type="text"
          className="search-bar-input"
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

export default SearchBar
