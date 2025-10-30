# 🎶 MoodTunes Vibes

Uma aplicação web interativa para descobrir músicas perfeitas baseadas no seu humor! Utilizando a API do Spotify e um design moderno com efeitos visuais impressionantes.

## ✨ Funcionalidades

- **Busca por Emoção**: Digite como você está se sentindo (ex: Feliz, Triste, Animado, Relaxado) e encontre músicas que combinam com seu estado de espírito
- **Integração com Spotify**: Resultados diretos da API do Spotify com embeds de músicas
- **Interface Moderna**: Design com efeitos de vidro, gradientes e animações suaves
- **Fundo 3D Animado**: Background interativo com globo Vanta.js
- **Ícones Flutuantes**: Notas musicais animadas flutuando na tela
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Player Integrado**: Ouça previews das músicas diretamente na aplicação

## 🚀 Como Usar

1. **Digite sua emoção**: No campo de busca, escreva como você está se sentindo hoje
2. **Clique em Buscar**: A aplicação encontrará músicas que combinam com seu humor
3. **Explore os resultados**: Veja capas, artistas e títulos das músicas encontradas
4. **Ouça as músicas**: Clique nos cards para abrir no Spotify ou use os players integrados

### Exemplos de Emoções

- Romântico
- Motivado
- Nostálgico
- Calmo
- Feliz
- Triste
- Animado
- Relaxado

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS com efeitos de vidro e gradientes
- **Background 3D**: Vanta.js com Three.js
- **Backend**: Node.js + Express (API proxy para Spotify)
- **API**: Spotify Web API
- **Ícones**: Feather Icons + SVGs customizados

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Conta no Spotify (para obter Client ID e Secret)

## 🔧 Instalação e Execução

### 1. Clone o repositório

```bash
git clone https://github.com/BrunoTg7/MoodTunes-Vibes.git
cd MoodTunes-Vibes
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as credenciais do Spotify

Crie um arquivo `.env` na raiz do projeto com:

```
CLIENT_ID=seu_spotify_client_id
CLIENT_SECRET=seu_spotify_client_secret
```

### 4. Execute o backend

```bash
node ApiMusica.js
```

### 5. Execute o frontend (em outro terminal)

```bash
npm run dev
```

### 6. Acesse a aplicação

Abra [http://localhost:5173](http://localhost:5173) no seu navegador

## 🎨 Design e UX

- **Tema**: Gradientes roxo-rosa com elementos musicais
- **Animações**: Transições suaves, hover effects e ícones flutuantes
- **Layout**: Grid responsivo que se adapta ao tamanho da tela
- **Interatividade**: Efeitos de hover, botões animados e players integrados

## 📱 Responsividade

- **Mobile**: 1 coluna de resultados
- **Tablet**: 2 colunas de resultados
- **Desktop**: 3 colunas de resultados

## 🔒 Privacidade

A aplicação não armazena dados pessoais. As buscas são processadas em tempo real através da API do Spotify.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ para amantes da música**
