import React from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import LandingView from '@renderer/views/LandingView'
import MainView from '@renderer/views/MainView'
import MainLayout from '@renderer/layouts/MainLayout'
import DashboardView from '@renderer/views/DashboardView'
import InfoView from '@renderer/views/InfoView'
import SchemaView from '@renderer/views/SchemaView'
import CreateDummyView from '@renderer/views/CreateDummyView'
import TestView from '@renderer/views/TestView'
import HistoryView from '@renderer/views/HistoryView'
import SelectMethodView from './views/SelectMethodView'
import DummyInsertView from './views/DummyInsertView'
import ErrorView from './views/ErrorView'

const router = createHashRouter([
  {
    path: '/landing',
    element: <LandingView />,
    errorElement: <ErrorView />
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // MainView (사이드바 잠김)
      {
        index: true,
        element: <MainView />,
        errorElement: <ErrorView />
      },
      {
        path: 'error',
        element: <ErrorView />
      },
      // 프로젝트 뷰들 (사이드바 활성)
      {
        path: 'main/dashboard/:projectId',
        element: <DashboardView />,
        errorElement: <ErrorView />
      },
      {
        path: 'main/info/:projectId',
        element: <InfoView />,
        errorElement: <ErrorView />
      },
      {
        path: 'main/schema/:projectId',
        element: <SchemaView />,
        errorElement: <ErrorView />
      },
      {
        path: 'main/dummy/:projectId',
        element: <CreateDummyView />,
        errorElement: <ErrorView />
      },
      {
        path: 'main/test/:projectId',
        element: <TestView />,
        errorElement: <ErrorView />
      },
      {
        path: 'main/history/:projectId',
        element: <HistoryView />,
        errorElement: <ErrorView />
      },
      {
        path: 'main/select-method/:projectId',
        element: <SelectMethodView />,
        errorElement: <ErrorView />
      },
      {
        path: 'main/insert/sql/:projectId',
        element: <DummyInsertView />,
        errorElement: <ErrorView />
      }
    ]
  }
])

const App: React.FC = () => {
  return <RouterProvider router={router} />
}

export default App
