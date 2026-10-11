# Input

Campo de texto com rótulo em caixa alta acima, borda reta `line-strong` e mensagem de ajuda/erro abaixo.

**O consumidor fornece:** `label`, `hint` ou `error`, e os atributos normais de `<input>` (`type`, `name`, `value`, `onChange`, `placeholder`, `autoComplete`, `inputMode`).

- Sempre com `label` visível; placeholder só como exemplo de formato ("00000-000").
- Erro: frase curta e acionável em `danger` ("Digite um e-mail válido"), nunca só a borda vermelha.
- Use `inputMode="numeric"` para CEP, CPF/CNPJ e cartão.
