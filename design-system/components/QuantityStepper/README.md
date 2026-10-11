# QuantityStepper

Seletor de quantidade − / + com borda reta.

**O consumidor fornece:** `value` + `onChange` (controlado) ou `defaultValue`; `min`, `max` e `label`.

- No varejo `min` = 1. No atacado, defina `min` como a quantidade mínima do lote e diga isso no rótulo.
- `max` = estoque disponível; o botão + desabilita ao chegar no limite.
