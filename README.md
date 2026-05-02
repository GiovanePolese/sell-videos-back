<h1 align="center">
  📹 Sell Videos - Marketplace para Videomakers (Backend)
</h1>

<p align="center">
  Uma API robusta, escalável e segura construída para dar suporte ao marketplace de criadores de conteúdo e videomakers.
</p>

<p align="center">
  <a href="https://nestjs.com/" target="_blank"><img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://graphql.org/" target="_blank"><img src="https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white" alt="GraphQL"></a>
  <a href="https://www.mysql.com/" target="_blank"><img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"></a>
  <a href="https://aws.amazon.com/s3/" target="_blank"><img src="https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white" alt="AWS S3"></a>
</p>

---

## 📖 Sobre o Projeto

O backend do **Sell Videos** é responsável por toda a regra de negócio que sustenta o marketplace. Ele gerencia a autenticação de usuários e criadores, o processamento de arquivos de mídia, a integração com gateways de pagamento e a entrega segura de dados para o frontend.

O sistema foi arquitetado utilizando **NestJS** e conta com uma abordagem híbrida de comunicação, fornecendo tanto endpoints **GraphQL** (para consultas complexas na interface) quanto **RESTful** (para webhooks e integrações externas).

### 🚀 Principais Funcionalidades

* **Processamento de Vídeo:** Integração com `FFmpeg` nativo para manipulação, compressão ou extração de thumbnails de vídeos.
* **Armazenamento em Nuvem:** Upload e gerenciamento seguro de mídias no **AWS S3**.
* **Gestão de Pagamentos:** Integração com a API da **Efí Pay** (`sdk-node-apis-efi`) para processamento de vendas e split de pagamentos.
* **Segurança e Autenticação:** Sistema robusto utilizando **JWT**, **Passport**, **Bcrypt** para senhas e **Throttler** para prevenção de ataques de força bruta.
* **API Híbrida:** Integração com **Apollo GraphQL** para o painel principal e documentação **Swagger** para endpoints REST.


## 🛠️ Tecnologias e Ferramentas

* **Core:** [NestJS](https://nestjs.com/) (Node.js framework) + [TypeScript](https://www.typescriptlang.org/)
* **Banco de Dados:** [MySQL](https://www.mysql.com/) com [TypeORM](https://typeorm.io/)
* **APIs:** [GraphQL](https://graphql.org/) (Apollo) e REST (com [Swagger](https://swagger.io/))
* **Mídia & Cloud:** [AWS SDK (S3)](https://aws.amazon.com/sdk-for-javascript/) e [FFmpeg](https://ffmpeg.org/) (`fluent-ffmpeg`)
* **Segurança:** `@nestjs/jwt`, `passport`, `bcrypt`, `@nestjs/throttler`
* **Testes:** [Jest](https://jestjs.io/) e Supertest


## ⚙️ Como executar o projeto localmente

### Pré-requisitos

* [Node.js](https://nodejs.org/) (versão 18+)
* Banco de dados **MySQL** rodando localmente ou via Docker
* Credenciais da **AWS (S3)** e da **Efí Pay** (para testar fluxos completos)
* Instalação do **FFmpeg** no sistema operacional (embora o projeto utilize pacotes de instalação estática/automática do FFmpeg, recomenda-se ter o core instalado na máquina).

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/GiovanePolese/sell-event-videos-backend.git
   cd sell-event-videos-backend
2. Instale as dependências:
    ```bash
    npm install
3. Configure as variáveis de ambiente:
Crie um arquivo .env na raiz do projeto baseado em um possível .env.example ou contendo as seguintes chaves essenciais:
    ```bash
    # Banco de Dados
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASS=sua_senha
    DB_NAME=sell_videos

    # Autenticação
    JWT_SECRET=seu_segredo_super_seguro

    # AWS S3
    AWS_REGION=sua-regiao
    AWS_ACCESS_KEY_ID=sua-access-key
    AWS_SECRET_ACCESS_KEY=sua-secret-key
    AWS_BUCKET_NAME=nome-do-bucket

    # Gateway de Pagamento (Efí)
    EFI_CLIENT_ID=seu_client_id
    EFI_CLIENT_SECRET=seu_client_secret
4. Inicie o servidor em modo de desenvolvimento:
    ```bash
    npm run start:dev
💡 O servidor estará rodando por padrão em http://localhost:3000.
📚 A documentação interativa do Swagger (REST) geralmente estará acessível em `/api` ou `/docs` e o Playground do GraphQL em `/graphql` (dependendo da configuração do seu `main.ts`).

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
|npm run start:dev | Inicia a aplicação em modo de desenvolvimento com hot-reload.|
|npm run build | Compila o código TypeScript para a pasta dist gerando o build de produção.|
|npm run start:prod | Executa a versão compilada em produção.|
|npm run lint | Executa o ESLint para encontrar e corrigir problemas no código.|
|npm run format | Formata o código utilizando o Prettier.|
|npm run test | Executa a suíte de testes unitários com Jest.|
|npm run test:e2e | Executa os testes end-to-end (E2E).|
|npm run test:cov |Gera o relatório de cobertura de testes.|

## 🛡️ Licença
Este projeto é classificado como [UNLICENSED](https://choosealicense.com/no-permission/) e é de uso privado e exclusivo.