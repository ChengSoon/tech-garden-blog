import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback: ReactNode; }
interface State { failed: boolean; }

export default class GardenMapBoundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Garden map render failed', error, info);
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
