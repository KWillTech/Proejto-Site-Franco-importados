'use client';

import styles from '@/app/admin/admin.module.css';

export type VariantRow = { key: string; id?: string; optionValues: string[]; retail: string; wholesale: string; available: boolean };

export const newRow = (options: number): VariantRow =>
  ({ key: crypto.randomUUID(), optionValues: Array(options).fill(''), retail: '', wholesale: '', available: true });

type Props = {
  optionNames: string[];
  rows: VariantRow[];
  errors: Record<string, string>;
  onChange: (optionNames: string[], rows: VariantRow[]) => void;
};

// Primeira mensagem cujo caminho começa com o prefixo (ex.: "variants.2" pega varejo, atacado e valores).
const firstError = (errors: Record<string, string>, prefix: string) =>
  Object.entries(errors).find(([k]) => k === prefix || k.startsWith(`${prefix}.`))?.[1];

export function VariantsEditor({ optionNames, rows, errors, onChange }: Props) {
  const setRow = (i: number, patch: Partial<VariantRow>) =>
    onChange(optionNames, rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const optionError = firstError(errors, 'optionNames');

  return (
    <fieldset className={styles.box}>
      <legend>Variações e preços</legend>
      <p className={styles.hint}>
        Opções como Cor ou Armazenamento (até 3), uma linha por combinação. Sem opções, o produto tem um único preço.
      </p>
      {optionNames.map((name, k) => (
        <div className={styles.row} key={k}>
          <label>
            Nome da opção {k + 1}
            <input
              value={name}
              placeholder="Ex.: Cor"
              onChange={(e) => onChange(optionNames.map((n, j) => (j === k ? e.target.value : n)), rows)}
            />
          </label>
          <button
            type="button"
            className={styles.btn}
            onClick={() => onChange(
              optionNames.filter((_, j) => j !== k),
              rows.map((r) => ({ ...r, optionValues: r.optionValues.filter((_, j) => j !== k) })),
            )}
          >
            Remover opção
          </button>
        </div>
      ))}
      {optionError && <p className={styles.error} role="alert">{optionError}</p>}
      {optionNames.length < 3 && (
        <div>
          <button
            type="button"
            className={styles.btn}
            onClick={() => onChange([...optionNames, ''], rows.map((r) => ({ ...r, optionValues: [...r.optionValues, ''] })))}
          >
            Adicionar opção
          </button>
        </div>
      )}

      {rows.map((row, i) => {
        const rowError = firstError(errors, `variants.${i}`);
        return (
          <div className={styles.variant} key={row.key}>
            {optionNames.map((name, k) => (
              <label key={k}>
                {name || `Opção ${k + 1}`}
                <input
                  value={row.optionValues[k] ?? ''}
                  onChange={(e) => setRow(i, { optionValues: row.optionValues.map((v, j) => (j === k ? e.target.value : v)) })}
                />
              </label>
            ))}
            <label>
              Varejo (R$)
              <input inputMode="decimal" placeholder="0,00" value={row.retail} onChange={(e) => setRow(i, { retail: e.target.value })} />
            </label>
            <label>
              Atacado (R$)
              <input inputMode="decimal" placeholder="0,00" value={row.wholesale} onChange={(e) => setRow(i, { wholesale: e.target.value })} />
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={row.available} onChange={(e) => setRow(i, { available: e.target.checked })} />
              Disponível
            </label>
            {rows.length > 1 && (
              <button type="button" className={styles.btn} onClick={() => onChange(optionNames, rows.filter((_, j) => j !== i))}>
                Remover variação
              </button>
            )}
            {rowError && <p className={styles.error} role="alert">{rowError}</p>}
          </div>
        );
      })}
      {errors.variants && <p className={styles.error} role="alert">{errors.variants}</p>}
      {optionNames.length > 0 && (
        <div>
          <button type="button" className={styles.btn} onClick={() => onChange(optionNames, [...rows, newRow(optionNames.length)])}>
            Adicionar variação
          </button>
        </div>
      )}
    </fieldset>
  );
}
