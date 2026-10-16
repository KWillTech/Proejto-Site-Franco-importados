import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
});
