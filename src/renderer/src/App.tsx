import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingView from '@renderer/views/LandingView'
import MainView from '@renderer/views/MainView'
import MainLayout from '@renderer/layouts/MainLayout'
import DashboardView from '@renderer/views/DashboardView'
import InfoView from '@renderer/views/InfoView'
import SchemaView from '@renderer/views/SchemaView'
import CreateDummyView from '@renderer/views/CreateDummyView'
import TestView from '@renderer/views/TestView'
import HistoryView from '@renderer/views/HistoryView'

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/landing" element={<LandingView />} />
        <Route path="/" element={<MainLayout />}>
          {/*  MainView (사이드바 잠김) */}
          <Route index element={<MainView />} />

          {/*  프로젝트 뷰들 (사이드바 활성)*/}
          <Route path="main">
            <Route path="dashboard" element={<DashboardView />} />
            <Route path="info" element={<InfoView />} />
            <Route path="schema" element={<SchemaView />} />
            <Route path="dummy" element={<CreateDummyView />} />
            <Route path="test" element={<TestView />} />
            <Route path="history" element={<HistoryView />} />

            {/* /main 접속 시 대시보드로 자동 이동 */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
