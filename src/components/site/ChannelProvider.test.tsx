import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChannelProvider } from './ChannelProvider';
import { ChannelToggle } from './ChannelToggle';

afterEach(cleanup);

describe('ChannelProvider', () => {
  it('troca para atacado mesmo sem sessionStorage', () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    render(<ChannelProvider><ChannelToggle /></ChannelProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Atacado' }));

    expect(screen.getByRole('button', { name: 'Atacado' }).getAttribute('aria-pressed')).toBe('true');

    getSpy.mockRestore();
    setSpy.mockRestore();
  });
});
