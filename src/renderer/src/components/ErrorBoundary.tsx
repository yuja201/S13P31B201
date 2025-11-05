import React, { Component, ReactNode } from 'react'
import { NavigateFunction } from 'react-router-dom'

interface Props {
  children: ReactNode
  navigate: NavigateFunction
}

interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  componentDidUpdate(): void {
    if (this.state.hasError) {
      // 에러가 발생하면 ErrorView로 리다이렉트
      this.props.navigate('/error')
      // 상태 초기화
      this.setState({ hasError: false })
    }
  }

  render(): ReactNode {
    return this.props.children
  }
}

export default ErrorBoundary
