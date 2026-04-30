/**
 * ORANGE - Landing Page App
 * Integração Robusta com Supabase e Lógica de Interface
 */

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================
const SUPABASE_URL = 'https://lwayxjikuqdseezynifr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YXl4amlrdXFkc2VlenluaWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODc2MDIsImV4cCI6MjA5MzA2MzYwMn0.aOW0TSqav4mjFfbv07BKkDB4Ns1pfWkQ2x_FYBq2IcA';

let supabaseClient = null;
let currentUser = null;

// Tenta inicializar o Supabase com segurança
function initSupabase() {
    try {
        if (window.supabase && SUPABASE_ANON_KEY !== 'SUA_SUPABASE_ANON_KEY') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            checkSession();
        }
    } catch (e) {
        console.error("Erro ao inicializar Supabase:", e);
    }
}

// ============================================================================
// SISTEMA DE NOTIFICAÇÕES (TOAST)
// ============================================================================
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        alert(message); // Fallback caso o container não exista
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconClass = type === 'success' ? 'ph-check-circle' : 'ph-warning-circle';
    
    toast.innerHTML = `<i class="ph-fill ${iconClass}"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ============================================================================
// LÓGICA DE INTERFACE (Aguardando DOM)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Header Scroll ---
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (header) {
            window.scrollY > 50 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
        }
    });

    // --- Menu Mobile ---
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.classList.replace('ph-list', 'ph-x');
                } else {
                    icon.classList.replace('ph-x', 'ph-list');
                }
            }
        });

        // Fecha ao clicar em link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.querySelector('i')?.classList.replace('ph-x', 'ph-list');
            });
        });
    }

    // --- FAQ Accordion ---
    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-question')?.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                const ans = i.querySelector('.faq-answer');
                if (ans) ans.style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                if (answer) answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // --- Scroll Animations (Intersection Observer) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up, .section-header, .card, .form-container').forEach(el => {
        el.classList.add('fade-up');
        observer.observe(el);
    });

    // --- Inicializar Supabase após o carregamento ---
    initSupabase();
});

// ============================================================================
// FUNÇÕES GLOBAIS (MODAL & FORMS)
// ============================================================================
window.openModal = function() {
    document.getElementById('loginModal')?.classList.add('active');
};

window.closeModal = function() {
    document.getElementById('loginModal')?.classList.remove('active');
};

window.toggleForm = function(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    
    if (el.style.display === 'none' || el.style.display === '') {
        el.style.display = 'block';
        btn.innerText = btn.innerText.replace('Mostrar formulário:', 'Ocultar formulário:');
    } else {
        el.style.display = 'none';
        btn.innerText = btn.innerText.replace('Ocultar formulário:', 'Mostrar formulário:');
    }
};

// ============================================================================
// AUTENTICAÇÃO & BANCO DE DADOS
// ============================================================================
async function checkSession() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateUI(true);
    }

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        updateUI(!!session);
        if (session) window.closeModal();
    });
}

function updateUI(isLoggedIn) {
    const authSection = document.getElementById('authSection');
    if (!authSection) return;

    if (isLoggedIn && currentUser) {
        const name = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
        authSection.innerHTML = `
            <div class="user-profile">
                <div class="fidelity-badge" title="Fidelidade Orange"><i class="ph-fill ph-star text-orange"></i> Fidelidade: 0/5</div>
                <div class="user-avatar">${name[0].toUpperCase()}</div>
                <span class="d-none d-md-block">Olá, ${name.split(' ')[0]}</span>
                <button class="btn btn-outline-light text-small" onclick="window.logout()">Sair</button>
            </div>`;
    } else {
        authSection.innerHTML = `<button class="btn btn-outline" id="btnLoginModal" onclick="window.openModal()">Entrar</button>`;
    }
}

// --- Alternar abas do modal (Login / Cadastro) ---
window.switchAuthTab = function(tab) {
    const loginForm = document.getElementById('authLoginForm');
    const signupForm = document.getElementById('authSignupForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const title = document.getElementById('modalTitle');
    const subtitle = document.getElementById('modalSubtitle');
    const toggleText = document.getElementById('authToggleText');

    if (tab === 'signup') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        tabLogin.classList.remove('active');
        tabSignup.classList.add('active');
        title.textContent = 'Criar conta';
        subtitle.textContent = 'Cadastre-se para aproveitar tudo da Orange.';
        toggleText.innerHTML = 'Já tem conta? <a href="#" onclick="event.preventDefault(); window.switchAuthTab(\'login\')" style="color:var(--color-orange);font-weight:600;">Entrar</a>';
    } else {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        tabSignup.classList.remove('active');
        tabLogin.classList.add('active');
        title.textContent = 'Entrar';
        subtitle.textContent = 'Acesse sua conta para enviar formulários e solicitações.';
        toggleText.innerHTML = 'Não tem conta? <a href="#" onclick="event.preventDefault(); window.switchAuthTab(\'signup\')" style="color:var(--color-orange);font-weight:600;">Cadastre-se</a>';
    }
};

// --- Login com e-mail e senha ---
window.loginEmail = async function(e) {
    e.preventDefault();
    if (!supabaseClient) return window.showToast("Erro: Supabase não carregado", "error");

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('btnAuthSubmit');
    btn.textContent = 'Entrando...';
    btn.disabled = true;

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.showToast("Login realizado com sucesso!", "success");
    } catch (err) {
        window.showToast(err.message || "E-mail ou senha incorretos", "error");
    } finally {
        btn.textContent = 'Entrar';
        btn.disabled = false;
    }
};

// --- Cadastro com e-mail e senha ---
window.signupEmail = async function(e) {
    e.preventDefault();
    if (!supabaseClient) return window.showToast("Erro: Supabase não carregado", "error");

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const btn = document.getElementById('btnSignupSubmit');
    btn.textContent = 'Criando...';
    btn.disabled = true;

    try {
        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });
        if (error) throw error;
        window.showToast("Conta criada! Verifique seu e-mail para confirmar.", "success");
        window.switchAuthTab('login');
    } catch (err) {
        window.showToast(err.message || "Erro ao criar conta", "error");
    } finally {
        btn.textContent = 'Criar conta';
        btn.disabled = false;
    }
};

window.logout = async () => {
    await supabaseClient?.auth.signOut();
    window.location.reload();
};

// --- Envio de Dados ---
async function requireAuthAndSubmit(e, table, data) {
    e.preventDefault();
    if (!currentUser) {
        window.showToast("Faça login para continuar", "error");
        window.openModal();
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Enviando...";
    btn.disabled = true;

    try {
        const { error } = await supabaseClient.from(table).insert([data]);
        if (error) throw error;
        window.showToast("Enviado com sucesso!", "success");
        e.target.reset();
    } catch (err) {
        window.showToast("Erro ao enviar", "error");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- Listeners de Formulários ---
document.getElementById('formParcerias')?.addEventListener('submit', (e) => {
    requireAuthAndSubmit(e, 'parcerias', {
        nome: document.getElementById('parcNome').value,
        empresa: document.getElementById('parcEmpresa').value,
        contato: document.getElementById('parcContato').value,
        mensagem: document.getElementById('parcMensagem').value
    });
});

document.getElementById('formEventos')?.addEventListener('submit', (e) => {
    requireAuthAndSubmit(e, 'eventos', {
        nome: document.getElementById('evtNome').value,
        evento: document.getElementById('evtEvento').value,
        data: document.getElementById('evtData').value,
        local: document.getElementById('evtLocal').value,
        contato: document.getElementById('evtContato').value
    });
});

document.getElementById('formContato')?.addEventListener('submit', (e) => {
    requireAuthAndSubmit(e, 'contatos', {
        nome: document.getElementById('cttNome').value,
        email: document.getElementById('cttEmail').value,
        mensagem: document.getElementById('cttMensagem').value
    });
});
