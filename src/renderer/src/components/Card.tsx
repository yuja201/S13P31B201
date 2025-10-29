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
}

const Card: React.FC<CardProps> = ({
  name,
  dbType,
  description,
  host,
  port,
  username,
  lastUpdated,
  width = 443,
  height = 'auto'
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
            padding: 32px;
            box-shadow: var(--shadow);
            transition: box-shadow 0.2s ease;
            overflow: hidden;
          }

          .card:hover {
            box-shadow: 2px 4px 6px rgba(0, 0, 0, 0.15);
          }

          .card-header {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 23px;
            margin-bottom: 23px;
          }

          .card-title {
            font: var(--preSemiBold24);
            color: var(--color-black);
          }

          .card-badge {
            background-color: var(--color-main-blue);
            color: var(--color-white);
            padding: 4px 12px;
            border-radius: 999px;
            font: var(--preSemiBold12);
            box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.15);
          }

          .card-description {
            color: var(--color-dark-gray);
            margin-bottom: 16px;
          }

          .card-info {
            display: flex;
            flex-direction: column;
            gap: 23px;
          }

          .info-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .card-row {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--color-dark-gray);
          }

          .card-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            object-fit: contain;
            opacity: 0.85;
          }

          .clock-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
            object-fit: contain;
            opacity: 0.85;
          }
        `}
      </style>

      <div className="card" style={{ width, height }}>
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
            <IoTimeOutline size={20} />
            <span className="preLight16">{lastUpdated}</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default Card
