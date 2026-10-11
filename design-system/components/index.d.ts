import * as React from "react";

export type IconName = "sacola" | "busca" | "conta" | "menu" | "fechar" | "mais" | "menos" | "favorito" | "caminhao" | "seta-direita" | "conversa" | "check";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = preto cheio (uma ação principal por área); secondary = contorno; ghost = link sublinhado. */
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  /** Ocupa toda a largura (celular, carrinho, checkout). */
  full?: boolean;
  /** Renderiza como <a>. */
  href?: string;
  icon?: IconName;
  iconRight?: IconName;
  children?: React.ReactNode;
}
export interface IconProps { name: IconName; size?: number; /** Texto acessível; sem ele o ícone é decorativo. */ label?: string; className?: string; }
export interface BadgeProps { tone?: "neutral" | "ink" | "sale" | "success" | "warning"; children: React.ReactNode; className?: string; }
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; hint?: string; /** Mensagem de erro: substitui o hint e marca o campo. */ error?: string; }
export interface PriceProps {
  /** Preço atual em reais. */
  value: number;
  /** Preço "de", maior que value: mostra riscado e pinta o preço com `sale`. */
  compareAt?: number;
  /** Nº de parcelas sem juros. */
  installments?: number;
  /** % de desconto no Pix. */
  pix?: number;
  size?: "sm" | "md";
}
export interface QuantityStepperProps { value?: number; defaultValue?: number; min?: number; max?: number; onChange?: (v: number) => void; label?: string; }
export interface ProductCardProps {
  name: string; brand?: string; price: number; compareAt?: number; installments?: number;
  image?: string; imageAlt?: string; href?: string;
  /** Texto do selo; sem ele, um desconto vira "-N%". */
  badge?: string; badgeTone?: BadgeProps["tone"];
  favorite?: boolean; onFavorite?: () => void;
  /** Mostra o botão "Adicionar à sacola". */
  onAdd?: () => void;
}
export interface NavLink { label: string; href?: string; current?: boolean; }
export interface NavbarProps {
  links?: NavLink[]; announcement?: string; cartCount?: number; homeHref?: string;
  logoSrc?: string; logoSrcInverse?: string;
  onSearch?: () => void; onAccount?: () => void; onCart?: () => void; onMenu?: () => void;
}
export interface HeroProps { eyebrow?: string; title: React.ReactNode; text?: string; primary?: { label: string; href?: string }; secondary?: { label: string; href?: string }; image?: string; imageAlt?: string; }
export interface SectionHeadingProps { eyebrow?: string; title: string; action?: { label: string; href?: string }; }
export interface AlertProps { tone?: "success" | "warning" | "danger" | "info"; title?: string; icon?: IconName; children?: React.ReactNode; }
export interface FooterProps { columns?: { title: string; links: NavLink[] }[]; tagline?: string; legal?: string; note?: string; logoSrc?: string; logoSrcInverse?: string; }

export declare const Button: React.FC<ButtonProps>;
export declare const Icon: React.FC<IconProps>;
export declare const Badge: React.FC<BadgeProps>;
export declare const Input: React.FC<InputProps>;
export declare const Price: React.FC<PriceProps>;
export declare const QuantityStepper: React.FC<QuantityStepperProps>;
export declare const ProductCard: React.FC<ProductCardProps>;
export declare const Navbar: React.FC<NavbarProps>;
export declare const Hero: React.FC<HeroProps>;
export declare const SectionHeading: React.FC<SectionHeadingProps>;
export declare const Alert: React.FC<AlertProps>;
export declare const Footer: React.FC<FooterProps>;
/** Formata número como "R$ 1.299,90". */
export declare function formatBRL(v: number): string;
