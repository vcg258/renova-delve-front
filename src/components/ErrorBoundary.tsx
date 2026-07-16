import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

/**
 * 렌더링 오류가 나도 '검은 화면'으로 죽지 않게 하는 최후의 안전망.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-center">
          <h2 style={{ color: '#c9a227' }}>🕯 어둠 속에서 길을 잃었다</h2>
          <p className="dim">화면을 그리는 중 문제가 발생했습니다.</p>
          <button className="primary" onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}>
            입구로 돌아가기
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
