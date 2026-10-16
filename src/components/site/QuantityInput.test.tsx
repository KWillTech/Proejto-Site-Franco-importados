import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuantityInput } from './QuantityInput';

afterEach(cleanup);

describe('QuantityInput', () => {
  it('com valor 1, "menos" não baixa de 1', () => {
    const onChange = vi.fn();
    render(<QuantityInput value={1} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Diminuir quantidade'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('"mais" aumenta em 1', () => {
    const onChange = vi.fn();
    render(<QuantityInput value={1} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Aumentar quantidade'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('apagar o campo e digitar "5" resulta em onChange(5)', () => {
    const onChange = vi.fn();
    function Parent() {
      const [qty, setQty] = useState(1);
      return <QuantityInput value={qty} onChange={(q) => { onChange(q); setQty(q); }} />;
    }
    render(<Parent />);
    const input = screen.getByLabelText('Quantidade');
    fireEvent.change(input, { target: { value: '' } });
    expect((input as HTMLInputElement).value).toBe('');
    fireEvent.change(input, { target: { value: '5' } });
    expect(onChange).toHaveBeenLastCalledWith(5);
    expect((input as HTMLInputElement).value).toBe('5');
  });
});
