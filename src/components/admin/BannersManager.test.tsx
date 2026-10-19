import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { reorderBanners, saveBanner } from '@/app/admin/(painel)/banners/actions';
import { BannersManager, type BannerItem } from './BannersManager';

vi.mock('@/app/admin/(painel)/banners/actions', () => ({
  saveBanner: vi.fn(async () => ({ ok: true })),
  deleteBanner: vi.fn(async () => ({ ok: true })),
  reorderBanners: vi.fn(async () => ({ ok: true })),
}));
vi.mock('./ImageUploader', () => ({ ImageUploader: () => null }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const ban = (id: string, alt: string, active = true): BannerItem =>
  ({ id, imageDesktop: '/d.webp', imageMobile: '/m.webp', alt, link: '/categoria/apple', active });

describe('BannersManager', () => {
  it('mostra quantos estão ativos e avisa quando nenhum está', () => {
    const { rerender } = render(<BannersManager banners={[ban(A, 'iPhone 18'), ban(B, 'Android', false)]} />);
    expect(screen.getByText(/1 de 2 ativos/)).toBeTruthy();
    rerender(<BannersManager banners={[ban(A, 'iPhone 18', false)]} />);
    expect(screen.getByText(/Nenhum banner ativo/)).toBeTruthy();
  });

  it('interruptor desativa na hora mantendo o resto do banner', async () => {
    render(<BannersManager banners={[ban(A, 'iPhone 18')]} />);
    fireEvent.click(screen.getByLabelText('Desativar iPhone 18'));
    await waitFor(() => expect(saveBanner).toHaveBeenCalledWith(A, {
      imageDesktop: '/d.webp', imageMobile: '/m.webp', alt: 'iPhone 18', link: '/categoria/apple', active: false,
    }));
  });

  it('setas trocam a ordem', async () => {
    render(<BannersManager banners={[ban(A, 'iPhone 18'), ban(B, 'Android')]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Descer banner 1' }));
    await waitFor(() => expect(reorderBanners).toHaveBeenCalledWith([B, A]));
  });

  it('Editar abre a janela e salvar fecha', async () => {
    render(<BannersManager banners={[ban(A, 'iPhone 18')]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar iPhone 18' }));
    expect(screen.getByRole('dialog').textContent).toContain('Editar banner');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar banner' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
