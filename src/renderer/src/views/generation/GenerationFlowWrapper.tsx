import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useGenerationStore } from '@renderer/stores/generationStore'

/**
 * 더미 데이터 생성 전용 Flow Wrapper
 * - CreateDummyView, SelectMethodView, DummyInsertView를 포함함
 * - 이 Flow를 떠날 때만 generationStore를 reset
 */
const GenerationFlowWrapper: React.FC = () => {
  useEffect(() => {
    return () => {
      useGenerationStore.getState().reset()
    }
  }, [])

  return <Outlet />
}

export default GenerationFlowWrapper
