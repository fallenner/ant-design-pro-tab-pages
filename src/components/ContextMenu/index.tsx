import React, { Component } from 'react';

export interface ContextMenuProps {
  onChange: (visible: boolean) => void;
  visible: boolean;
  event: any;
  content: React.ReactNode;
}

export default class ContextMenu extends Component<ContextMenuProps> {
  container: any;

  static defaultProps = {
    content: null,
    event: null,
    visible: false,
  };

  state = {
    left: 0,
    top: 0,
  };

  componentDidMount() {
    document.addEventListener('click', this.hideRightContent);
    document.addEventListener('scroll', this.hideRightContent);
  }

  componentDidUpdate() {
    this.setContentPosition();
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.hideRightContent, false);
    document.removeEventListener('scroll', this.hideRightContent, false);
  }

  getSnapshotBeforeUpdate() {
    this.setContentPosition();
    return null;
  }

  hideRightContent = () => {
    const { onChange } = this.props;
    if (onChange) onChange(false);
  };

  setContentPosition = () => {
    if (!this.container) return;

    const { event } = this.props;

    if (!event) return;

    const winWidth = document.documentElement.clientWidth || document.body.clientWidth;
    const winHeight = document.documentElement.clientHeight || document.body.clientHeight;
    const contentWidth = this.container.offsetWidth;
    const contentHeight = this.container.offsetHeight;

    let left = event.clientX;
    let top = event.clientY;

    if (left >= winWidth - contentWidth) {
      left = winWidth - contentWidth;
    }

    if (top > winHeight - contentHeight) {
      top = winHeight - contentHeight;
    }

    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;
  };

  render() {
    const { content, visible } = this.props;
    const { left, top } = this.state;

    return (
      <div
        style={{
          display: visible ? 'block' : 'none',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 99999,
          width: 0,
          height: 0,
        }}
      >
        <div
          ref={(node) => {
            this.container = node;
          }}
          style={{
            left,
            top,
            position: 'absolute',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)',
          }}
        >
          {content}
        </div>
      </div>
    );
  }
}
