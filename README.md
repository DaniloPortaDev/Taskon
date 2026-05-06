# taskon-app

![HTML5](https://img.shields.io/badge/HTML5-semantic-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-responsive-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111)
![LocalStorage](https://img.shields.io/badge/Persistencia-localStorage-1D1D1F?style=for-the-badge)
![Responsive](https://img.shields.io/badge/Layout-mobile--first-34C759?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-em%20desenvolvimento-0071E3?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge)

Taskon é um gerenciador de tarefas em estilo Kanban, inspirado na organização do Trello e na simplicidade visual da Apple. O projeto foi desenvolvido com HTML, CSS e JavaScript puro, sem frameworks ou dependências externas.

## Preview

Abra o arquivo `index.html` no navegador para usar o app localmente.

## Funcionalidades

- Criar, editar, excluir e concluir tarefas.
- Colunas Kanban: `To Do`, `Doing` e `Done`.
- Drag and drop entre colunas.
- Filtro por busca, status e prioridade.
- Persistência de dados com `localStorage`.
- Dark mode com preferência salva.
- Sistema de prioridade com indicação discreta por cor.
- Microinterações suaves em cards, botões, busca, contadores, drag and drop, criação e exclusão.
- Layout responsivo com abordagem mobile-first.

## Tecnologias

- HTML semântico
- CSS com custom properties, Flexbox, Grid, transitions e keyframes
- JavaScript puro
- `localStorage` do navegador

## Estrutura

```text
taskon-app/
+-- index.html
+-- style.css
+-- script.js
+-- README.md
```

## Como Executar

Não é necessário instalar nada.

1. Abra a pasta do projeto.
2. Abra o arquivo `index.html` em um navegador moderno.
3. Comece a organizar suas tarefas.

## Experiência

O Taskon usa animações sutis para tornar as mudanças mais claras sem distrair:

- Cards têm leve elevação no hover para indicar interatividade.
- Novas tarefas entram com fade, slide e destaque temporário.
- Tarefas excluídas animam antes de sair da tela.
- Colunas são destacadas durante o drag and drop.
- Contadores pulsam rapidamente quando o número muda.
- O campo de busca usa borda e glow suave no foco.

## Design

A interface prioriza clareza, espaçamento e minimalismo. Cores neutras, bordas suaves, cantos arredondados e sombras leves ajudam a manter o quadro organizado e confortável de usar.

## Licença

Este projeto está sob a licença MIT. Você pode usar, modificar e evoluir livremente.
