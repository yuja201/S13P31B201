// src/renderer/src/App.tsx
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from '@renderer/pages/LandingPage'
import MainPage from '@renderer/pages/MainPage'
import MainLayout from '@renderer/layouts/MainLayout'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 첫 진입 화면: 사이드바 없는 랜딩 페이지 */}
        <Route path="/" element={<LandingPage />} />

        {/* 사이드바 포함된 페이지들 */}
        <Route path="/main" element={<MainLayout />}>
          <Route index element={<MainPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
