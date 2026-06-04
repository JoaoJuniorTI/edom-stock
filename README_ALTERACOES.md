# Alterações aplicadas

## 1. Google Sheets como fonte principal do cadastro de produtos

Arquivo alterado: `app/api/sync/route.ts`

A sincronização agora trata o Google Sheets/CSV como fonte de verdade:

- Produto novo na planilha: cria no banco.
- Produto alterado na planilha: atualiza nome, aplicação, marca, inspiração e preços.
- Produto removido da planilha: desativa no sistema (`active = false`) para não quebrar histórico de estoque/orçamentos.
- Volume/preço removido da planilha: desativa aquela volumetria em `product_volumes`.
- Se o CSV vier vazio ou quebrado, a sincronização é abortada para não apagar/desativar o catálogo por acidente.

## 2. Salvar orçamento para editar depois

Arquivos alterados: `app/orcamento/page.tsx`, `app/api/quotes/route.ts`, `app/orcamentos/page.tsx`, `app/layout.tsx`

Agora o fluxo permite:

- Salvar orçamento pelo botão **Salvar orçamento**.
- Abrir a tela **Orçamentos** pelo menu lateral.
- Editar orçamento salvo pelo ícone de lápis.
- Atualizar orçamento já existente pelo botão **Atualizar orçamento**.
- Excluir orçamento salvo.
- Gerar PDF de um orçamento salvo diretamente na lista.

A API `/api/quotes` cria a tabela `quotes` automaticamente caso ela ainda não exista no banco.

## 3. PDF abrindo em nova aba no iPhone/Chrome

Arquivo alterado: `lib/pdf.ts`

O gerador de PDF foi centralizado em `lib/pdf.ts` e agora abre uma nova aba imediatamente no clique, antes dos `await`, para reduzir bloqueio de pop-up em iPhone. Quando o PDF termina de ser montado, a aba muda para o `blobUrl` do PDF, permitindo abrir/visualizar e compartilhar sem forçar o fluxo de salvar antes. Se o navegador bloquear a nova aba, o sistema ainda usa download como fallback.

## Observação de segurança

O arquivo `.env.local` não foi incluído no zip final. Use o `.env.example` como referência e mantenha suas variáveis reais no ambiente de deploy/local.
