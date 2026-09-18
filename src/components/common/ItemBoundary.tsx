"use client";

import { Component, type ReactNode } from "react";

/** 목록의 항목 하나를 감싼다. 그리다가 예외가 나면 그 항목만 빼고 나머지 목록은 그대로 둔다 */
export class ItemBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ItemBoundary]", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
