import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <section style={{ maxWidth: 600, margin: '80px auto', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Что-то пошло не так</h1>
          <p style={{ color: 'var(--gray)', marginBottom: 16 }}>Попробуйте обновить страницу.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', border: '2px solid var(--black)', borderRadius: 100, background: 'var(--black)', color: 'var(--white)', fontWeight: 800, cursor: 'pointer' }}>Обновить</button>
        </section>
      );
    }
    return this.props.children;
  }
}
