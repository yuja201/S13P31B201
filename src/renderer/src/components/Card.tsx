import React from 'react'
import { BsDatabase } from 'react-icons/bs'
import { IoPersonOutline } from 'react-icons/io5'
import { IoTimeOutline } from 'react-icons/io5'

interface CardProps {
  name: string
  dbType: string
  description: string
  host: string
  port: number
  username: string
  lastUpdated: string
  width?: number | string
  height?: number | string
  onClick?: () => void
  option?: {
    icon: React.ReactNode
    onClick: (e: React.MouseEvent) => void
  }
}

const Card: React.FC<CardProps> = ({
  name,
  dbType,
  description,
  host,
  port,
  username,
  lastUpdated,
  width = 400,
  height = 'auto',
  onClick,
  option
}) => {
  return (
    <>
      <style>
        {`
          .card {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            background-color: var(--color-white);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            padding: 24px;
            box-shadow: var(--shadow);
            transition: box-shadow 0.2s ease, transform 0.2s ease;
            cursor: pointer;
            position: relative;
          }

          .card:hover {
            box-shadow: 2px 4px 6px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }

          .card-header {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 16px;
            width: 100%;
          }

          .card-option-button {
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-dark-gray);
            transition: background-color 0.2s ease, color 0.2s ease;
          }

          .card-option-button:hover {
            background-color: rgba(0, 0, 0, 0.05);
            color: var(--color-black);
          }

          .card-title {
            font: var(--preSemiBold24);
            color: var(--color-black);
          }

          .card-badge {
            background-color: var(--color-main-blue);
            color: var(--color-white);
            padding: 4px 10px;
            border-radius: 999px;
            font: var(--preSemiBold12);
            box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.15);
          }

          .card-description {
            color: var(--color-dark-gray);
            margin-bottom: 12px;
          }

          .card-info {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .info-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .card-row {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--color-dark-gray);
          }

          .card-icon, .clock-icon {
            width: 16px;
            height: 16px;
            opacity: 0.85;
          }
        `}
      </style>

      <div className="card" style={{ width, height }} onClick={onClick}>
        {option && (
          <button className="card-option-button" onClick={option.onClick} aria-label="Options">
            {option.icon}
          </button>
        )}
        <div className="card-header">
          <h2 className="card-title">{name}</h2>
          <span className="card-badge">{dbType}</span>
        </div>

        <p className="card-description preLight16">{description}</p>

        <div className="card-info">
          <div className="info-group">
            <div className="card-row">
              <BsDatabase />
              <span className="preLight14">{`${host}:${port}`}</span>
            </div>
            <div className="card-row">
              <IoPersonOutline />
              <span className="preLight14">{username}</span>
            </div>
          </div>

          <div className="card-row">
            <IoTimeOutline size={18} />
            <span className="preLight14">{lastUpdated}</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default Card
