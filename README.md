ICM — Impressão Compartilhada de Máquinas
Marketplace de Horas Ociosas de Impressão 3D

<p align="center">
**Conectando capacidade produtiva disponível a quem precisa fabricar.**
</p>

📌 Sobre o projeto

O ICM (Impressão Compartilhada de Máquinas) é uma aplicação web desenvolvida com o objetivo de conectar proprietários de impressoras 3D a pessoas e empresas que necessitam de serviços de fabricação aditiva.

A plataforma funciona como um marketplace de capacidade produtiva, permitindo que parceiros disponibilizem suas horas ociosas de impressão 3D e que clientes encontrem equipamentos, solicitem orçamentos e acompanhem a fabricação de seus projetos.

A proposta é promover o compartilhamento de recursos produtivos, otimizar a utilização de equipamentos e ampliar o acesso à tecnologia de impressão 3D, sem que os clientes precisem investir na aquisição de impressoras próprias.

O projeto contempla dois ambientes principais — Cliente e Parceiro — integrados por meio de um fluxo de solicitações, negociação, aprovação de propostas e acompanhamento da produção.

🎯 Objetivos
Conectar clientes a fornecedores de serviços de impressão 3D.
Aproveitar a capacidade produtiva ociosa de equipamentos.
Facilitar a divulgação de impressoras e materiais disponíveis.
Centralizar solicitações de fabricação e propostas comerciais.
Simplificar a negociação entre clientes e parceiros.
Permitir o acompanhamento compartilhado dos pedidos.
Simular a gestão financeira por meio de um fluxo de pagamento em escrow.
Criar uma estrutura tecnológica preparada para futuras integrações com serviços externos.
👥 Público-alvo

Clientes

Pessoas físicas que necessitam de peças impressas em 3D.
Engenheiros, designers e profissionais técnicos.
Startups e empresas que desenvolvem protótipos.
Organizações que precisam de componentes personalizados.

Parceiros

Proprietários de impressoras 3D.
Empresas de fabricação aditiva.
Profissionais autônomos de impressão 3D.
Prestadores de serviços que desejam monetizar sua capacidade produtiva ociosa.
⚙️ Tecnologias utilizadas
Tecnologia	Aplicação
Angular	Desenvolvimento da aplicação web
TypeScript	Tipagem e organização do código
Angular Router	Gerenciamento de rotas
Angular Reactive Forms	Formulários e validações
HTML5	Estruturação das interfaces
SCSS/CSS	Estilização e responsividade
LocalStorage	Persistência de informações simples
IndexedDB	Armazenamento local de dados e arquivos

A arquitetura foi planejada para separar as regras de negócio da camada de apresentação e facilitar uma futura integração com backend e banco de dados.

🧩 Funcionalidades da plataforma
1. Autenticação e gerenciamento de usuários
Cadastro de clientes e parceiros.
Login e logout.
Identificação automática do perfil.
Validação de formulários.
Verificação de e-mail cadastrado.
Simulação de confirmação de e-mail.
Edição de dados cadastrais.
Alteração de senha.
Proteção de rotas conforme o perfil de acesso.
2. Marketplace de impressão 3D

Ambiente compartilhado para divulgação e consulta de equipamentos disponíveis.

Listagem de impressoras 3D.
Pesquisa por nome e modelo.
Filtros por tecnologia de impressão.
Filtros por materiais.
Filtros por localização.
Consulta de horas ociosas disponíveis.
Visualização de características técnicas.
Consulta de valores de referência.
Identificação do parceiro responsável.
Solicitação de orçamento.
3. Ambiente do cliente

Dashboard destinado ao gerenciamento de projetos e solicitações de impressão.

Indicadores de solicitações e pedidos.
Cadastro de novos projetos.
Descrição técnica das peças.
Definição de materiais e dimensões.
Seleção de tecnologia de impressão.
Anexação de arquivos técnicos.
Consulta de orçamentos recebidos.
Aprovação ou rejeição de propostas.
Acompanhamento da produção.
Histórico de solicitações.
4. Ambiente do parceiro

Painel de gerenciamento da capacidade produtiva e das oportunidades de negócio.

Dashboard com indicadores operacionais.
Cadastro de equipamentos.
Edição e exclusão de impressoras.
Gerenciamento de horas ociosas.
Controle de disponibilidade.
Consulta de solicitações recebidas.
Análise técnica de projetos.
Download de arquivos enviados pelos clientes.
Elaboração de propostas comerciais.
Envio, edição e cancelamento de orçamentos.
Gerenciamento de pedidos em produção.
5. Central de acompanhamento dos pedidos

Módulo responsável pela comunicação e pelo acompanhamento compartilhado das operações.

Timeline de produção

Aguardando aprovação.
Pagamento em escrow.
Em produção.
Controle de qualidade.
Embalagem.
Concluído/Enviado.

Comunicação

Chat entre cliente e parceiro.
Histórico de mensagens.
Identificação dos participantes.
Registro de data e horário.
Associação das conversas aos respectivos pedidos.

Histórico operacional

Registro das alterações de status.
Identificação do responsável por cada atualização.
Consulta de documentos.
Histórico de movimentações.
Acompanhamento das etapas anteriores e futuras.
6. Simulação financeira — Escrow

A plataforma contempla um fluxo demonstrativo de pagamento em escrow, no qual o valor da operação é representado como reservado após a aprovação do orçamento.

Fluxo operacional:

O parceiro envia uma proposta comercial.
O cliente analisa o orçamento.
O cliente aprova a proposta.
O sistema registra a reserva financeira simulada.
O parceiro inicia a produção.
O pedido passa pelas etapas operacionais.
O sistema registra a conclusão da operação.

Importante: o mecanismo de escrow é exclusivamente demonstrativo. Não existe movimentação financeira real ou integração com gateways de pagamento nesta versão.

7. Sistema de notificações

Notificações internas relacionadas às principais movimentações:

Recebimento de novas solicitações.
Envio de orçamentos.
Aprovação ou rejeição de propostas.
Confirmação do pagamento simulado.
Atualização das etapas de produção.
Recebimento de mensagens.
Conclusão dos pedidos.
🏗️ Arquitetura do projeto

A aplicação utiliza uma arquitetura modular, organizada para promover separação de responsabilidades, reutilização de componentes e facilidade de manutenção.

Estrutura conceitual sugerida:

text
icm/
├── src/
│   └── app/
│       ├── core/
│       │   ├── auth/
│       │   ├── guards/
│       │   ├── interceptors/
│       │   └── services/
│       │
│       ├── shared/
│       │   ├── components/
│       │   ├── directives/
│       │   └── pipes/
│       │
│       ├── models/
│       │   ├── user.model.ts
│       │   ├── equipment.model.ts
│       │   ├── project.model.ts
│       │   ├── quote.model.ts
│       │   ├── order.model.ts
│       │   ├── message.model.ts
│       │   └── notification.model.ts
│       │
│       ├── services/
│       │   ├── storage/
│       │   ├── user/
│       │   ├── equipment/
│       │   ├── project/
│       │   ├── quote/
│       │   ├── order/
│       │   ├── message/
│       │   └── notification/
│       │
│       ├── features/
│       │   ├── auth/
│       │   ├── marketplace/
│       │   ├── client/
│       │   └── partner/
│       │
│       ├── layouts/
│       │   ├── auth-layout/
│       │   ├── client-layout/
│       │   └── partner-layout/
│       │
│       └── app-routing.module.ts
│
├── assets/
├── environments/
├── README.md
└── package.json


Observação: a estrutura representa a organização arquitetural proposta. A estrutura definitiva deve refletir os diretórios e arquivos efetivamente existentes no repositório.

🔄 Fluxo principal da aplicação
mermaid
flowchart TD
    A[Cadastro e Login] --> B{Tipo de usuário}
    B -->|Cliente| C[Marketplace]
    B -->|Parceiro| D[Gerenciamento de Equipamentos]
    C --> E[Solicitação de Impressão]
    E --> F[Análise Técnica]
    F --> G[Elaboração de Orçamento]
    G --> H[Envio da Proposta]
    H --> I{Aprovação do Cliente}
    I -->|Rejeitada| J[Encerramento da Proposta]
    I -->|Aprovada| K[Pagamento Simulado em Escrow]
    K --> L[Início da Produção]
    L --> M[Controle de Qualidade]
    M --> N[Embalagem]
    N --> O[Pedido Concluído]

💾 Persistência e armazenamento

Nesta primeira versão, a aplicação utiliza persistência local, sem necessidade de backend ou banco de dados externo.

A estratégia de armazenamento prevê:

IndexedDB: armazenamento de arquivos e dados estruturados.
LocalStorage: informações simples, preferências e sessão demonstrativa.
Serviços de armazenamento: centralização das operações de leitura e escrita.

Essa abordagem permite simular os principais fluxos da plataforma e preparar a aplicação para uma futura substituição da persistência local por uma API REST.

🚀 Instalação e execução
Pré-requisitos
Node.js instalado.
npm instalado.
Angular CLI compatível com a versão do projeto.
1. Clonar o repositório
bash
git clone URL_DO_REPOSITORIO

2. Acessar a pasta do projeto
bash
cd icm

3. Instalar as dependências
bash
npm install

4. Executar a aplicação
bash
ng serve

5. Acessar no navegador
text
http://localhost:4200


Os comandos e requisitos de versão devem ser conferidos com a configuração efetiva do projeto.

🧪 Dados demonstrativos

A aplicação prevê dados iniciais para facilitar a exploração dos fluxos de cliente e parceiro.

Entre os dados demonstrativos estão:

Usuários de ambos os perfis.
Equipamentos de impressão 3D.
Tecnologias e materiais disponíveis.
Projetos e solicitações.
Orçamentos em diferentes etapas.
Pedidos em produção.
Mensagens e notificações.

As credenciais de demonstração devem ser documentadas após a validação dos usuários efetivamente cadastrados na aplicação.

🔐 Limitações da versão atual

Por utilizar armazenamento local e não possuir backend, esta versão apresenta algumas limitações importantes:

Autenticação exclusivamente demonstrativa.
Ausência de segurança de autenticação em nível de produção.
Confirmação de e-mail simulada.
Pagamentos e escrow sem transações financeiras reais.
Ausência de sincronização entre dispositivos e navegadores.
Dados armazenados localmente no ambiente do usuário.
Ausência de integração com serviços externos.
Visualização tridimensional condicionada à implementação de suporte aos formatos de arquivo.

A versão não deve ser utilizada para operações comerciais reais sem a implementação de uma infraestrutura backend segura.

🔮 Evoluções futuras

A arquitetura do ICM permite planejar futuras evoluções tecnológicas, incluindo:

Desenvolvimento de backend com API REST.
Integração com banco de dados.
Autenticação segura e gerenciamento de permissões.
Armazenamento de arquivos em nuvem.
Integração com gateways de pagamento.
Implementação de escrow real por meio de infraestrutura financeira adequada.
Confirmação de e-mail por serviço externo.
Chat com comunicação em tempo real.
Notificações em tempo real.
Integração com serviços de logística e rastreamento.
Visualização 3D avançada de arquivos técnicos.
✅ Checklist de conformidade

A validação do projeto deve considerar o comportamento real de cada funcionalidade, e não apenas sua existência visual.

Requisito	Status
Estrutura modular Angular	A validar
Modelos e interfaces TypeScript	A validar
Cadastro de clientes e parceiros	A validar
Autenticação e controle de sessão	A validar
Proteção de rotas por perfil	A validar
Marketplace de equipamentos	A validar
Filtros e pesquisa	A validar
Gerenciamento de equipamentos (CRUD)	A validar
Cadastro de solicitações	A validar
Upload e download de arquivos	A validar
Elaboração de orçamentos	A validar
Aprovação e rejeição de propostas	A validar
Simulação de pagamento escrow	A validar
Timeline de produção	A validar
Chat entre cliente e parceiro	A validar
Sistema de notificações	A validar
Persistência local	A validar
Responsividade	A validar
Testes de navegação e funcionalidades	A validar

Legenda de validação:

IMPLEMENTADO — funcionalidade desenvolvida e validada.
PARCIALMENTE IMPLEMENTADO — funcionalidade desenvolvida parcialmente ou com limitações.
NÃO IMPLEMENTADO — funcionalidade ainda não desenvolvida.

Os status definitivos deverão ser preenchidos após a execução dos testes no repositório.

📄 Licença

Projeto desenvolvido para fins de estudo, desenvolvimento tecnológico e demonstração de uma solução de marketplace para compartilhamento de capacidade produtiva de impressão 3D.

A licença definitiva deverá ser definida conforme a estratégia de distribuição do projeto.

💡 Considerações finais

O ICM propõe uma solução baseada no conceito de economia compartilhada aplicado à manufatura aditiva, conectando capacidade produtiva disponível a demandas de fabricação sob encomenda.

Mais do que um marketplace de equipamentos, a plataforma busca centralizar todo o ciclo de contratação de serviços de impressão 3D, desde a solicitação inicial até a conclusão do pedido.

A iniciativa pretende contribuir para o melhor aproveitamento dos recursos produtivos, democratizar o acesso à impressão 3D e criar novas oportunidades de negócio para proprietários de equipamentos.

ICM — Impressão Compartilhada de Máquinas

Compartilhando capacidade produtiva. Conectando ideias à fabricação.
