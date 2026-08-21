<div align="center">
  <img src="logo-sos-small.png" alt="S.O.S Filtros" width="360">

  # S.O.S Filtros

  Site responsivo com catálogo, carrinho, avaliações e painel administrativo protegido.
</div>

## Recursos

- Catálogo de serviços e produtos com filtros e carrinho.
- Finalização do pedido e contato pelo WhatsApp.
- Avaliações de clientes armazenadas no Supabase.
- Painel separado em `/site/`, sem link na página pública.
- Edição de textos, WhatsApp, indicadores, serviços, produtos, preços e imagens.
- Moderação de avaliações recebidas.
- Layout escuro adaptado para celular, tablet e computador.

## Segurança

- Autenticação por e-mail e senha usando Supabase Auth.
- Cadastro público e recuperação de senha desativados; novas contas são criadas somente pelo proprietário no painel do Supabase.
- Sessão administrativa mantida somente durante a aba aberta.
- Row Level Security ativado em todas as tabelas acessíveis.
- Visitantes só podem ler configurações públicas e itens ativos.
- Avaliações não podem ser lidas por visitantes.
- Imagens aceitas apenas em JPG, PNG ou WEBP, com limite de 5 MB.
- Nenhuma chave de servidor ou senha é armazenada nos arquivos do site.
- Cabeçalhos CSP, `nosniff`, proteção contra frames e bloqueio de indexação do painel.

## Estrutura

- `index.html`, `styles.css`, `sos-theme.css`, `app.js`: site público.
- `site/index.html`, `painel.js`, `admin.css`: painel administrativo.
- `supabase-api.js`: conexão do navegador com Auth, banco e armazenamento.
- `supabase/schema.sql`: tabelas, regras de acesso, dados iniciais e bucket de imagens.
- `build.mjs`: gera a pasta `public` usada pela Vercel.

## Executar

O projeto requer Node.js para gerar a pasta pública:

```bash
npm run build
```

Depois, sirva a pasta `public` com um servidor estático. Na Vercel, configure o comando de build como `npm run build` e a pasta de saída como `public`.

## Cadastrar um novo cliente

1. No Supabase, abra **Authentication → Users**.
2. Selecione **Add user → Create new user**.
3. Informe o e-mail e a senha escolhidos pelo proprietário e mantenha **Auto confirm user** marcado.
4. Adicione o mesmo e-mail à tabela privada `private.admin_emails` para liberar o painel.

O site não oferece cadastro nem recuperação de senha. Excluir um usuário ou retirar seu e-mail da lista privada revoga o acesso administrativo.

## Estado atual

O domínio principal está em pausa temporária enquanto a identidade visual aguarda registro. O banco e o painel podem ser preparados sem reativar a página pública.

O checkout prepara o pedido pelo WhatsApp; nenhuma cobrança é feita diretamente pelo site nesta versão.
