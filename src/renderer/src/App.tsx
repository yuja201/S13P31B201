import React from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useToastStore } from '@renderer/stores/toastStore'
import { useConfirmStore } from '@renderer/stores/confirmStore'
import Toast from '@renderer/components/Toast'
import ConfirmDialog from '@renderer/components/ConfirmDialog'

import LandingView from '@renderer/views/LandingView'
import MainView from '@renderer/views/MainView'
import MainLayout from '@renderer/layouts/MainLayout'
import DashboardView from '@renderer/views/DashboardView'
import InfoView from '@renderer/views/InfoView'
import SchemaView from '@renderer/views/SchemaView'
import CreateDummyView from '@renderer/views/CreateDummyView'
import TestView from '@renderer/views/TestView'
import IndexTestView from '@renderer/views/IndexTestView'
import HistoryView from '@renderer/views/TestHistory'
import SelectMethodView from '@renderer/views/SelectMethodView'
import DummyInsertView from '@renderer/views/DummyInsertView'
import ErrorView from '@renderer/views/ErrorView'
import GenerationFlowWrapper from '@renderer/views/generation/GenerationFlowWrapper'
import UserQueryTestView from '@renderer/views/UserQueryTestView'

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
      {
        index: true,
        element: <MainView />,
        errorElement: <ErrorView />
      },
      { path: 'error', element: <ErrorView /> },
      {
        path: 'main/dashboard/:projectId',
        element: <DashboardView />,
        errorElement: <ErrorView />
      },
      { path: 'main/info/:projectId', element: <InfoView />, errorElement: <ErrorView /> },
      { path: 'main/schema/:projectId', element: <SchemaView />, errorElement: <ErrorView /> },
      { path: 'main/test/:projectId', element: <TestView />, errorElement: <ErrorView /> },
      {
        path: 'main/test/:projectId/index',
        element: <IndexTestView />,
        errorElement: <ErrorView />
      },
      { path: 'main/history/:projectId', element: <HistoryView />, errorElement: <ErrorView /> },
      {
        path: 'main/dummy/:projectId',
        element: <GenerationFlowWrapper />,
        errorElement: <ErrorView />,
        children: [
          { index: true, element: <CreateDummyView /> },
          { path: 'select-method', element: <SelectMethodView /> },
          { path: 'insert/sql', element: <DummyInsertView /> }
        ]
      },
      {
        path: 'main/test/:projectId/user-query/:testId',
        element: <UserQueryTestView />,
        errorElement: <ErrorView />
      }
    ]
  }
])

const App: React.FC = () => {
  const { show, msg, type, title, hideToast } = useToastStore()
  const {
    show: showConfirm,
    type: confirmType,
    title: confirmTitle,
    message: confirmMessage,
    confirmText,
    cancelText,
    handleConfirm,
    hideConfirm
  } = useConfirmStore()

  return (
    <>
      <RouterProvider router={router} />

      {show &&
        createPortal(
          <Toast type={type} title={title} onClose={hideToast}>
            {msg}
          </Toast>,
          document.body
        )}

      {showConfirm &&
        createPortal(
          <ConfirmDialog
            type={confirmType}
            title={confirmTitle}
            message={confirmMessage}
            confirmText={confirmText}
            cancelText={cancelText}
            onConfirm={handleConfirm}
            onCancel={hideConfirm}
          />,
          document.body
        )}
    </>
  )
}

export default App
