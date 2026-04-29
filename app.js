/**
 * ORANGE - Landing Page App
 * Integração com Supabase e Lógica de Interface
 */

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================
// ATENÇÃO: Substitua 'SUA_SUPABASE_ANON_KEY' pela sua chave pública (anon key) do Supabase.
const SUPABASE_URL = 'https://lwayxjikuqdseezynifr.supabase.co';
const SUPABASE_ANON_KEY = 'sbp_3f3fa1c40942101306c73ae085b6050ea11aa242';

let supabase = null;
let currentUser = null;

// Inicializa o cliente do Supabase apenas se a chave foi preenchida
if (SUPABASE_ANON_KEY !== 'SUA_SUPABASE_ANON_KEY') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    checkSession();
} else {
    console.warn("⚠️ Supabase não inicializado: Defina sua SUPABASE_ANON_KEY no arquivo app.js");
}

// ============================================================================
// INTERFACE DE USUÁRIO (UI / UX) & TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconClass = type === 'success' ? 'ph-check-circle' : 'ph-warning-circle';
    
    toast.innerHTML = `
        <i class="ph-fill ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Header Scroll Effect ---
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// --- Menu Mobile Toggle ---
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const icon = menuToggle.querySelector('i');
    if (navMenu.classList.contains('active')) {
        icon.classList.remove('ph-list');
        icon.classList.add('ph-x');
    } else {
        icon.classList.remove('ph-x');
        icon.classList.add('ph-list');
    }
});

// Fecha menu mobile ao clicar num link
document.querySelectorAll('#navMenu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.remove('ph-x');
        icon.classList.add('ph-list');
    });
});

// Aguardar o carregamento completo do DOM para cálculos corretos de altura e observadores
document.addEventListener('DOMContentLoaded', () => {
    // --- Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Opcional: parar de observar após animar
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up, .section-header, .card, .form-container').forEach(el => {
        el.classList.add('fade-up'); // Adiciona classe base caso não tenha
        observer.observe(el);
    });

    // --- FAQ Accordion ---
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Fecha todos
        faqItems.forEach(i => {
            i.classList.remove('active');
            i.querySelector('.faq-answer').style.maxHeight = null;
        });

        // Abre o clicado se não estava ativo
        if (!isActive) {
            item.classList.add('active');
            const answer = item.querySelector('.faq-answer');
            answer.style.maxHeight = answer.scrollHeight + "px";
        }
    });
});

// --- Modal de Login ---
const loginModal = document.getElementById('loginModal');
const btnLoginModal = document.getElementById('btnLoginModal');
const closeLoginModal = document.getElementById('closeLoginModal');

function openModal() {
    loginModal.classList.add('active');
}

function closeModal() {
    loginModal.classList.remove('active');
}

if (btnLoginModal) btnLoginModal.addEventListener('click', openModal);
if (closeLoginModal) closeLoginModal.addEventListener('click', closeModal);

// Fecha modal ao clicar fora
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal();
    });
});

// Função para exibir/ocultar formulários (chamada inline no HTML)
window.toggleForm = function(id, btn) {
    const el = document.getElementById(id);
    if(el.style.display === 'none') {
        el.style.display = 'block';
        btn.innerText = btn.innerText.replace('Mostrar formulário:', 'Ocultar formulário:');
    } else {
        el.style.display = 'none';
        btn.innerText = btn.innerText.replace('Ocultar formulário:', 'Mostrar formulário:');
    }
}

// ============================================================================
// AUTENTICAÇÃO (SUPABASE AUTH)
// ============================================================================

// Função de Login Social
async function login(provider) {
    if (!supabase) {
        showToast("Configuração do Supabase ausente. Contate o administrador.", "error");
        return;
    }

    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                // A URL de callback definida no escopo do projeto
                redirectTo: 'https://lwayxjikuqdseezynifr.supabase.co/auth/v1/callback'
            }
        });

        if (error) throw error;
    } catch (error) {
        console.error("Erro no login:", error.message);
        showToast("Ocorreu um erro ao tentar fazer login.", "error");
    }
}

// Verifica a sessão atual e atualiza a UI
async function checkSession() {
    if (!supabase) return;

    const { data: { session }, error } = await supabase.auth.getSession();

    if (session) {
        currentUser = session.user;
        updateUIForLoggedInUser();
    }

    // Listener para mudanças de estado (login/logout)
    supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            currentUser = session.user;
            updateUIForLoggedInUser();
            closeModal();
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    });
}

function updateUIForLoggedInUser() {
    const authSection = document.getElementById('authSection');
    if (!authSection) return;

    // Pega o nome do usuário ou email
    const name = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
    const initial = name.charAt(0).toUpperCase();

    authSection.innerHTML = `
        <div class="user-profile">
            <div class="fidelity-badge" title="A cada 5 garrafas compradas você ganha 1 grátis! Escaneie o QR Code na barraca.">
                <i class="ph-fill ph-star text-orange"></i> Fidelidade: 0/5
            </div>
            <div class="user-avatar">${initial}</div>
            <span class="d-none d-md-block">Olá, ${name.split(' ')[0]}</span>
            <button class="btn btn-outline-light text-small" style="padding: 6px 12px;" onclick="logout()">Sair</button>
        </div>
    `;
}

function updateUIForLoggedOutUser() {
    const authSection = document.getElementById('authSection');
    if (!authSection) return;

    authSection.innerHTML = `
        <button class="btn btn-outline" id="btnLoginModal" onclick="openModal()">Entrar</button>
    `;
}

async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
}

// ============================================================================
// BANCO DE DADOS (FORMS)
// ============================================================================

// Intercepta envios de formulários para exigir login e salvar no Supabase
function requireAuthAndSubmit(e, table, dataObj) {
    e.preventDefault();

    if (!currentUser) {
        // Se não estiver logado, avisa e abre o modal de login
        showToast("Por favor, faça login para enviar esta solicitação.", "error");
        openModal();
        return;
    }

    submitDataToSupabase(table, dataObj, e.target);
}

async function submitDataToSupabase(table, data, formElement) {
    if (!supabase) {
        showToast("Configuração do Supabase ausente.", "error");
        return;
    }

    const btn = formElement.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Enviando...";
    btn.disabled = true;

    try {
        const { error } = await supabase
            .from(table)
            .insert([data]);

        if (error) throw error;

        showToast("Enviado com sucesso! Entraremos em contato em breve.", "success");
        formElement.reset();
    } catch (error) {
        console.error("Erro ao enviar:", error.message);
        showToast("Ocorreu um erro ao enviar. Tente novamente.", "error");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Setup dos listeners dos formulários
document.getElementById('formParcerias')?.addEventListener('submit', (e) => {
    const data = {
        nome: document.getElementById('parcNome').value,
        empresa: document.getElementById('parcEmpresa').value,
        contato: document.getElementById('parcContato').value,
        mensagem: document.getElementById('parcMensagem').value,
        created_at: new Date().toISOString()
    };
    requireAuthAndSubmit(e, 'parcerias', data);
});

document.getElementById('formEventos')?.addEventListener('submit', (e) => {
    const data = {
        nome: document.getElementById('evtNome').value,
        evento: document.getElementById('evtEvento').value,
        data: document.getElementById('evtData').value,
        local: document.getElementById('evtLocal').value,
        contato: document.getElementById('evtContato').value,
        created_at: new Date().toISOString()
    };
    requireAuthAndSubmit(e, 'eventos', data);
});

document.getElementById('formContato')?.addEventListener('submit', (e) => {
    const data = {
        nome: document.getElementById('cttNome').value,
        email: document.getElementById('cttEmail').value,
        mensagem: document.getElementById('cttMensagem').value,
        created_at: new Date().toISOString()
    };
    requireAuthAndSubmit(e, 'contatos', data);
});
