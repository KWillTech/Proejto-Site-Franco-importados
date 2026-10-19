'use client';

import f from './ProductForm.module.css';

export type VariantRow = { key: string; id?: string; optionValues: string[]; available: boolean };

export const newRow = (options: number): VariantRow =>
  ({ key: crypto.randomUUID(), optionValues: Array(options).fill(''), available: true });

type Props = {
  optionNames: string[];
  rows: VariantRow[];
  errors: Record<string, string>;
  onChange: (optionNames: string[], rows: VariantRow[]) => void;
};

// Primeira mensagem cujo caminho começa com o prefixo (ex.: "variants.2" pega os valores das opções).
export const firstError = (errors: Record<string, string>, prefix: string) =>
  Object.entries(errors).find(([k]) => k === prefix || k.startsWith(`${prefix}.`))?.[1];

export function VariantsEditor({ optionNames, rows, errors, onChange }: Props) {
  const setRow = (i: number, patch: Partial<VariantRow>) =>
    onChange(optionNames, rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const optionError = firstError(errors, 'optionNames');

  return (
    <div className={f.variants}>
      {optionNames.length > 0 && (
        <div className={f.options}>
          {optionNames.map((name, k) => (
            <div className={f.option} key={k}>
              <label className={f.field}>
                <span className={f.label}>Nome da opção {k + 1}</span>
                <input
                  className={f.input}
                  value={name}
                  placeholder="Ex.: Cor"
                  onChange={(e) => onChange(optionNames.map((n, j) => (j === k ? e.target.value : n)), rows)}
                />
              </label>
              <button
                type="button"
                className={f.iconBtn}
                aria-label={`Remover opção ${k + 1}`}
                title="Remover opção"
                onClick={() => onChange(
                  optionNames.filter((_, j) => j !== k),
                  rows.map((r) => ({ ...r, optionValues: r.optionValues.filter((_, j) => j !== k) })),
                )}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {optionError && <span className={f.error} role="alert">{optionError}</span>}
      {optionNames.length < 3 && (
        <button
          type="button"
          className={f.dashed}
          onClick={() => onChange([...optionNames, ''], rows.map((r) => ({ ...r, optionValues: [...r.optionValues, ''] })))}
        >
          + Adicionar opção
        </button>
      )}

      <div className={f.varTable}>
        {optionNames.length === 0 && <p className={f.single}>Variação única</p>}
        {rows.map((row, i) => {
          const rowError = firstError(errors, `variants.${i}`);
          return (
            <div className={f.varRow} key={row.key}>
              {optionNames.length > 0 && <span className={f.varNum}>{i + 1}</span>}
              {optionNames.map((name, k) => (
                <label className={f.field} key={k}>
                  <span className={f.label}>{name || `Opção ${k + 1}`}</span>
                  <input
                    className={f.input}
                    value={row.optionValues[k] ?? ''}
                    onChange={(e) => setRow(i, { optionValues: row.optionValues.map((v, j) => (j === k ? e.target.value : v)) })}
                  />
                </label>
              ))}
              <label className={f.inlineSwitch}>
                <input type="checkbox" className={f.switch} checked={row.available} onChange={(e) => setRow(i, { available: e.target.checked })} />
                Disponível
              </label>
              {rows.length > 1 && (
                <button type="button" className={f.iconBtn} aria-label="Remover variação" title="Remover variação"
                  onClick={() => onChange(optionNames, rows.filter((_, j) => j !== i))}>
                  ×
                </button>
              )}
              {rowError && <span className={`${f.error} ${f.rowError}`} role="alert">{rowError}</span>}
            </div>
          );
        })}
      </div>
      {errors.variants && <span className={f.error} role="alert">{errors.variants}</span>}
      {optionNames.length > 0 && (
        <button type="button" className={f.dashed} onClick={() => onChange(optionNames, [...rows, newRow(optionNames.length)])}>
          + Adicionar variação
        </button>
      )}
    </div>
  );
}
