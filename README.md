<div align="center">
  <img src="logo-sos-small.png" alt="S.O.S Filtros" width="360">

  # S.O.S Filtros

  Plataforma comercial que desenvolvi para apresentar serviços e produtos, receber pedidos e facilitar o atendimento da empresa.

  **[Ver site publicado](https://sos-filtros.vercel.app/)** · **[Ver case no meu portfólio](https://klayvert-paiva-portfolio.vercel.app/projetos/sos-filtros)**
</div>

## Sobre o projeto

Desenvolvi a plataforma da S.O.S Filtros para transformar a operação comercial da empresa em uma experiência digital organizada, responsiva e fácil de administrar. Trabalhei desde a estrutura da interface até a integração com banco de dados, autenticação, armazenamento de imagens e publicação em produção.

Mantive a identidade visual da marca com uma combinação de preto, laranja e azul. Também criei uma área de gestão protegida para permitir a atualização do conteúdo sem alterações diretas no código.

## O que implementei

- Criei a apresentação institucional e um catálogo filtrável de serviços e produtos.
- Desenvolvi o carrinho e a preparação de pedidos para atendimento pelo WhatsApp.
- Implementei o envio e a moderação de avaliações de clientes.
- Construí uma área administrativa protegida para gerenciar conteúdo, preços e imagens.
- Integrei autenticação, banco de dados e armazenamento de arquivos com Supabase.
- Adaptei toda a experiência para celular, tablet e computador.
- Configurei metadados para compartilhamento profissional em redes sociais.
- Publiquei e mantive o projeto em produção na Vercel.

## Tecnologias

- HTML5, CSS3 e JavaScript.
- Supabase Auth, PostgreSQL e Storage.
- Vercel para publicação e distribuição.
- Git e GitHub para versionamento.

## Segurança

Durante o desenvolvimento, apliquei controles para separar os dados públicos da área administrativa:

- Protegi o acesso de gestão com autenticação.
- Mantive o Row Level Security ativo nas tabelas acessíveis.
- Restrigi leitura e alteração de dados conforme o tipo de usuário.
- Validei formatos e tamanhos dos arquivos enviados.
- Mantive senhas e chaves privadas fora do repositório.
- Configurei cabeçalhos de segurança e bloqueio de indexação das áreas protegidas.

Nenhuma credencial administrativa ou chave de servidor está armazenada neste repositório.

## Estrutura principal

- `index.html`, `styles.css`, `sos-theme.css` e `app.js`: experiência pública.
- `site/`: componentes da área de gestão protegida.
- `supabase-api.js`: integração com autenticação, banco e armazenamento.
- `supabase/schema.sql`: estrutura do banco e regras de acesso.
- `build.mjs`: geração da versão publicada.

## Executar localmente

O projeto utiliza Node.js para preparar a pasta pública:

```bash
npm install
npm run build
```

Depois, basta servir a pasta `public` com um servidor estático.

## Estado atual

Mantive o site público e a área de gestão online. O catálogo pode ser atualizado pelo proprietário, enquanto o checkout organiza o pedido e direciona o atendimento para o WhatsApp. Nesta versão, não realizo cobranças diretamente pelo site.

---

Projeto comercial desenvolvido por **Klayvert Paiva** para **S.O.S Filtros**.
