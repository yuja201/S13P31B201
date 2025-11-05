import { useState } from 'react'
import type { ReactElement, CSSProperties } from 'react'
import { FiSearch } from 'react-icons/fi'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (value: string) => void
  onSearchClick?: () => void
  width?: string | number
  height?: string | number
}

const SearchBox = ({
  placeholder = '프로젝트 검색',
  onSearch,
  onSearchClick,
  width = 675,
  height = 60
}: SearchBarProps): ReactElement => {
  const [searchValue, setSearchValue] = useState('')

  const getPixelValue = (value: string | number): string => {
    return typeof value === 'number' ? `${value}px` : value
  }

  const getNumericHeight = (): number => {
    if (typeof height === 'number') return height
    const match = height.match(/(\d+)/)
    return match ? parseInt(match[1]) : 60
  }

  const numericHeight = getNumericHeight()

  const fontSize = Math.round(numericHeight * 0.4)
  const paddingVertical = 0
  const paddingHorizontal = Math.round(numericHeight * 0.53)
  const paddingRight = Math.round(numericHeight * 1.07)
  const borderRadius = Math.round(numericHeight * 0.33)
  const iconSize = Math.round(numericHeight * 0.5)
  const iconRight = paddingHorizontal

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
    width: getPixelValue(width),
    height: getPixelValue(height),
    display: 'flex',
    alignItems: 'center'
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    border: '1px solid #e8e8e8',
    borderRadius: `${borderRadius}px`,
    padding: `${paddingVertical}px ${paddingRight}px ${paddingVertical}px ${paddingHorizontal}px`,
    fontSize: `${fontSize}px`,
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
    right: `${iconRight}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#c0c0c0',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    fontSize: `${iconSize}px`
  }

  return (
    <>
      <style>
        {`
          .search-bar-input::placeholder {
            color: var(--color-placeholder);
            font-weight: var(--fw-regular);
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
          <FiSearch size={iconSize} color="#c0c0c0" />
        </button>
      </div>
    </>
  )
}

export default SearchBox
