/**
 * ORANGE - Landing Page App
 * Integração Robusta com Supabase e Lógica de Interface
 */

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================
const SUPABASE_URL = 'https://lwayxjikuqdseezynifr.supabase.co';
const SUPABASE_ANON_KEY = 'sbp_3f3fa1c40942101306c73ae085b6050ea11aa242';

let supabase = null;
let currentUser = null;

// Tenta inicializar o Supabase com segurança
function initSupabase() {
    try {
        if (window.supabase && SUPABASE_ANON_KEY !== 'SUA_SUPABASE_ANON_KEY') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateUI(true);
    }

    supabase.auth.onAuthStateChange((_event, session) => {
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

window.login = async function(provider) {
    if (!supabase) return window.showToast("Erro: Supabase não carregado", "error");
    const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
    });
    if (error) window.showToast("Erro ao entrar", "error");
};

window.logout = async () => {
    await supabase?.auth.signOut();
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
        const { error } = await supabase.from(table).insert([data]);
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
