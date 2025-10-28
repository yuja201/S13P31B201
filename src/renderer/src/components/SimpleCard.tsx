import React from 'react'

interface SimpleCardProps {
  title: string
  description: string
  size?: 'sm' | 'md'
  selected?: boolean
  onSelect?: () => void
}

const SimpleCard: React.FC<SimpleCardProps> = ({
  title,
  description,
  size = 'md',
  selected = false,
  onSelect
}) => {
  const classNames = ['simple-card', `simple-card--${size}`, selected ? 'selected' : ''].join(' ')

  return (
    <>
      <div className={classNames} onClick={onSelect}>
        <div className="simple-card__title">{title}</div>
        <div className="simple-card__desc">{description}</div>
      </div>

      <style>{`
        .simple-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 260px;
          height: 100px;
          background-color: var(--color-white);
          border: 1.5px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          box-shadow: var(--shadow);
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
        }

        .simple-card:hover {
          background-color: rgba(19, 70, 134, 0.05);
        }

        .simple-card.selected {
          background-color: var(--color-light-blue);
          border-color: var(--color-main-blue);
        }

        .simple-card__title {
          font: var(--preSemiBold16);
          color: var(--color-black);
        }

        .simple-card__desc {
          font: var(--preRegular14);
        }

        .simple-card--sm {
          width: 220px;
          height: 80px;
        }

        .simple-card--sm .simple-card__title {
          font: var(--preSemiBold14);
        }

        .simple-card--sm .simple-card__desc {
          color: var(--color-dark-gray);
        }

        .simple-card--md .simple-card__title {
          font: var(--preSemiBold16);
        }

        .simple-card--md .simple-card__desc {
          color: var(--color-black);
        }
      `}</style>
    </>
  )
}

export default SimpleCard
