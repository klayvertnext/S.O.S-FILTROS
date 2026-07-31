# S.O.S Filtros

Site público responsivo com catálogo, carrinho, contato, avaliações e conclusão de pedidos pelo WhatsApp.

## Abrir no computador

Abra `index.html` em um navegador moderno.

## Publicação

O projeto está publicado na Vercel. O processo de compilação envia somente os arquivos públicos definidos em `build.mjs`.

## Segurança e administração

- A antiga senha demonstrativa e o painel administrativo local foram removidos.
- O endereço administrativo não é publicado.
- Cabeçalhos de segurança são configurados em `vercel.json`.
- Um novo painel só deve ser ativado com autenticação feita no servidor, permissões de administrador e banco de dados compartilhado.
- Nunca coloque senhas, chaves de pagamento ou credenciais dentro de arquivos HTML ou JavaScript públicos.

## Situação atual

O checkout prepara o pedido e abre o WhatsApp; nenhuma cobrança é feita dentro do site. As avaliações ainda ficam somente no navegador do visitante. Pagamentos, avaliações compartilhadas e edição global do catálogo exigem um backend seguro.
