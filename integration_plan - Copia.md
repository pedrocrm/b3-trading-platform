# Plano de Integração Legal Tech e JurisLex

## 1. Introdução
Este documento detalha o plano para integrar as funcionalidades dos aplicativos Legal Tech e JurisLex, criando uma solução unificada para advogados. O objetivo é combinar as melhores características de ambos os sistemas, adotando a arquitetura mais robusta do JurisLex e adicionando a integração com o CNJ DataJus.

## 2. Análise dos Aplicativos Existentes

### Legal Tech
O aplicativo Legal Tech possui as seguintes funcionalidades relevantes para a integração:
- **Chance de Êxito** (`ChancesExito.jsx`): Análise de probabilidade de sucesso em casos.
- **Tendência** (`Tendencias.jsx`): Visualização de tendências jurídicas.

### JurisLex
O aplicativo JurisLex oferece as seguintes funcionalidades e arquitetura que serão incorporadas:
- **Pesquisar** (`Search.jsx`): Funcionalidade de busca robusta.
- **Minhas Pastas** (`Folders.jsx`): Organização de documentos e casos em pastas.
- **Categorias de IA** (`CaseCategories.jsx`): Categorização inteligente de casos.
- **Resumo Diário** (`DailyDigest.jsx`): Resumos diários personalizados.
- **Arquitetura** (`Architecture.jsx`): A arquitetura existente no JurisLex será a base para a solução integrada, devido à sua robustez, conforme solicitado pelo usuário. Componentes chave incluem:
    - Multi-Tenancy
    - Modelagem de Dados
    - Pipeline de Ingestão (ETL) com OCR e Embeddings
    - Índice de Busca (Elasticsearch com busca semântica)
    - Portal de Experiência (React + shadcn/ui)
    - Segurança e Permissões (RBAC, JWT Auth)
- **Pipeline** (`Pipeline.jsx`): A aba de documentação (`Documentation.jsx`) do pipeline será mantida.

## 3. Estratégia de Integração

A integração será realizada através da unificação dos componentes de interface (UI) e da adaptação das funcionalidades do Legal Tech para a arquitetura de backend do JurisLex. A estrutura de rotas e o layout principal do JurisLex serão mantidos como base.

### 3.1. Migração de Funcionalidades do Legal Tech
As páginas `ChancesExito.jsx` e `Tendencias.jsx` do Legal Tech serão migradas para o novo projeto unificado. Isso envolverá:
- Copiar os arquivos `.jsx` para o diretório `src/pages` do projeto unificado.
- Adaptar os imports e dependências para o novo ambiente, utilizando os componentes de UI (`@/components/ui`) e APIs (`@/api`) do JurisLex, se aplicável.
- Integrar as rotas correspondentes no `index.jsx` do projeto unificado.

### 3.2. Manutenção de Funcionalidades do JurisLex
As seguintes funcionalidades do JurisLex serão mantidas e integradas ao novo sistema:
- `Search.jsx`
- `Folders.jsx`
- `CaseCategories.jsx`
- `DailyDigest.jsx`
- `Architecture.jsx`
- `Pipeline.jsx` (com foco na documentação)

### 3.3. Unificação da Arquitetura
A arquitetura do JurisLex será a base. Isso implica em:
- Utilizar a estrutura de pastas e componentes do JurisLex.
- Garantir que as APIs e serviços de backend do JurisLex (e.g., Pipeline de Ingestão, Índice de Busca) possam suportar as funcionalidades migradas do Legal Tech.
- Refatorar, se necessário, as chamadas de API das funcionalidades do Legal Tech para se alinharem com os endpoints do JurisLex.

## 4. Integração com CNJ DataJus

A integração com o CNJ DataJus será um componente crucial da solução unificada. Isso envolverá:
- Identificar os endpoints relevantes da API do CNJ DataJus para acesso a dados jurídicos.
- Desenvolver módulos ou serviços no backend para consumir e processar os dados do CNJ DataJus.
- Integrar esses dados com as funcionalidades de busca (`Search.jsx`), resumo (`DailyDigest.jsx`) e análise (`ChancesExito.jsx`, `Tendencias.jsx`).
- Considerar a modelagem de dados para armazenar e indexar os dados do CNJ DataJus de forma eficiente no Elasticsearch.

## 5. Próximos Passos

1. **Implementação da Arquitetura Integrada**: Criar um novo projeto ou adaptar um dos existentes para ser a base da integração, copiando e ajustando os arquivos conforme o plano.
2. **Integração com CNJ DataJus**: Desenvolver a camada de integração com a API do CNJ DataJus.
3. **Testes e Refinamentos**: Realizar testes abrangentes para garantir a funcionalidade, performance e segurança da solução integrada.
4. **Entrega do Aplicativo Integrado**: Preparar a entrega final do aplicativo ao usuário.

