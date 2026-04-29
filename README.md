# 🍊 Orange - Suco Natural de Verdade

Landing Page moderna, responsiva e performática desenvolvida para a marca **Orange**, com foco em sustentabilidade e experiência no Parque Ibirapuera.

## 🚀 Tecnologias Utilizadas

- **Frontend:** HTML5, Vanilla CSS e JavaScript (ES6+).
- **Backend:** [Supabase](https://supabase.com/) (Auth & Database).
- **Ícones:** [Phosphor Icons](https://phosphoricons.com/).
- **Tipografia:** Google Fonts (Outfit).
- **Deploy:** Netlify.

## ✨ Funcionalidades

- ✅ **Design Premium:** Estética clean e natural com animações de scroll (Fade-up).
- ✅ **Autenticação:** Login social integrado via Supabase.
- ✅ **Plano de Fidelidade:** Badge interativo de fidelidade para usuários logados.
- ✅ **Formulários Inteligentes:** Captação de leads para Parcerias e Eventos com validação de sessão.
- ✅ **FAQ Interativo:** Sistema de accordion para dúvidas frequentes.
- ✅ **Notificações:** Sistema de Toast customizado para feedback de ações.
- ✅ **SEO:** Otimizado com meta tags OpenGraph para compartilhamento em redes sociais.

## 🛠️ Configuração do Backend

Para que o site funcione corretamente com o seu próprio banco de dados:

1. Crie um projeto no **Supabase**.
2. Execute o script SQL fornecido na pasta do projeto no **SQL Editor** do Supabase para criar as tabelas `contatos`, `parcerias` e `eventos`.
3. Ative o **Row Level Security (RLS)** e configure as políticas de inserção.
4. Substitua a `SUPABASE_ANON_KEY` no arquivo `app.js`.

---
Desenvolvido com 🧡 para a Orange.
