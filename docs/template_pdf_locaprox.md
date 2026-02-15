# Template de Orçamento em PDF — LocaProX (Com Logo Condicional)

Este documento descreve o template oficial para geração de PDFs de orçamento no app **LocaProX**, incluindo suporte à renderização condicional de logo da empresa.

---

## 📌 1. Cabeçalho com Logo Condicional

```text
------------------------------------------------------------
{{#if empresa_logo}}
[LOGO DA EMPRESA]
(Imagem exibida aqui — largura recomendada: 120px)
{{/if}}

                        LOCAProX
                Sistema de Locação Inteligente
------------------------------------------------------------
Empresa: {{empresa_nome}}
CNPJ: {{empresa_cnpj}}
Telefone: {{empresa_telefone}}
E-mail: {{empresa_email}}
Endereço: {{empresa_endereco}}
------------------------------------------------------------
TIPO DE DOCUMENTO: ORÇAMENTO
ATENÇÃO: ESTE PDF NÃO É RESERVA DE EQUIPAMENTO
------------------------------------------------------------
```

### ✔ Como funciona

- Se **empresa_logo** existir → exibe a imagem.
- Se não existir → o PDF é renderizado sem a logo.

### ✔ Estrutura JSON esperada

```json
{
  "empresa_logo": "base64-ou-url",
  "empresa_nome": "",
  "empresa_cnpj": "",
  "empresa_telefone": "",
  "empresa_email": "",
  "empresa_endereco": ""
}
```

---

## 📌 2. Dados do Cliente

```text
Tipo de Documento: ORÇAMENTO (NÃO É RESERVA)
Cliente: {{cliente_nome}}
CPF/CNPJ: {{cliente_documento}}
Telefone: {{cliente_telefone}}
E-mail: {{cliente_email}}
Data do Orçamento: {{data_orcamento}}
Validade: {{validade_orcamento}}
------------------------------------------------------------
```

---

## 📌 3. Itens da Locação (Tabela)

```text
ITEM                         QTD     DIAS     VALOR/DIA     VALOR PATRIMÔNIO     TOTAL
------------------------------------------------------------------------------------------------
{{equipamento_1}}             {{qtd}}   {{dias}}   R$ {{dia}}     R$ {{valor_patrimonio}}     R$ {{total}}
{{equipamento_2}}             {{qtd}}   {{dias}}   R$ {{dia}}     R$ {{valor_patrimonio}}     R$ {{total}}
{{equipamento_3}}             {{qtd}}   {{dias}}   R$ {{dia}}     R$ {{valor_patrimonio}}     R$ {{total}}
------------------------------------------------------------------------------------------------
Subtotal                                                                    R$ {{subtotal}}
Descontos                                                                   R$ {{descontos}}
Frete                                                                       R$ {{frete}}
------------------------------------------------------------------------------------------------
TOTAL GERAL                                                                 R$ {{total_geral}}
```

---

## 📌 4. Observações

```text
• Valores válidos até: {{validade_orcamento}}
• Este documento é somente um orçamento e não garante reserva de equipamentos.
• A reserva dos equipamentos é confirmada somente após pagamento combinado.
```

---

## 📌 5. Condições de Pagamento

```text
• Forma de pagamento: {{forma_pagamento}}
• Entrada: {{entrada}}
• Parcelamento: {{parcelamento}}
```

---

## 📌 6. Assinaturas

```text
------------------------------------------------------------
Assinatura da Empresa: ________________________
Assinatura do Cliente: ________________________
```

---

## 📌 7. Rodapé

```text
Obrigado pela preferência!
Gerado automaticamente pelo LocaProX.
```

---

## 🎨 Paleta de Cores Recomendada

- **Primária (Azul Escuro):** `#0D2A3A`
- **Secundária (Turquesa):** `#32E0C4`
- **Cinza neutro:** `#CCCCCC`

---

## 💡 Renderização da Logo no Código

### Exemplo para HTML-to-PDF

```html
{{#if empresa_logo}}
<img src="{{empresa_logo}}" style="width:120px; margin-bottom:16px;" />
{{/if}}
```

### Exemplo com pdf-lib (React Native)

```js
if (empresa_logo) {
  const image = await pdfDoc.embedPng(empresa_logo);
  page.drawImage(image, { x: 40, y: height - 100, width: 120 });
}
```

---

Este template garante consistência visual, integração com os dados do app e suporte completo à identidade do **LocaProX**.
