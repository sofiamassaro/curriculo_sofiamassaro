/* =========================================================
   SOFIA MASSARO · PORTFÓLIO — script.js
   - Integração com a API pública do GitHub
   - Tema claro/escuro
   - Animações de entrada por scroll
   - Pequenas interações
   ========================================================= */

/* Altere aqui se mudar o usuário do GitHub */
const GITHUB_USERNAME = 'sofiamassaro';

/* Quantos repositórios exibir no máximo */
const MAX_REPOS = 9;


/* =========================================================
   1. TEMA CLARO / ESCURO
   ========================================================= */

/* Armazenamento seguro: se o navegador bloquear o localStorage,
   o site continua funcionando sem quebrar. */
const storage = {
    get(key) {
        try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
        try { localStorage.setItem(key, value); } catch { /* ignora */ }
    }
};

const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '◐' : '◑';
}

/* Tema inicial: usa o que foi salvo ou a preferência do sistema */
const savedTheme = storage.get('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storage.set('theme', next);
});


/* =========================================================
   2. ANO ATUAL NO RODAPÉ
   ========================================================= */
document.getElementById('footer-year').textContent =
    '© ' + new Date().getFullYear();


/* =========================================================
   3. BOTÃO DE CONTATO
   ========================================================= */
document.getElementById('contact-btn').addEventListener('click', () => {
    alert('Contato\n\nTelefone: (48) 99672-6386\nFlorianópolis, SC');
});


/* =========================================================
   4. FALLBACK DA FOTO DE PERFIL
   Se "selfie_sofia.jpeg" não carregar, mostramos as iniciais.
   ========================================================= */
const photo = document.getElementById('profile-photo');
photo.addEventListener('error', () => {
    photo.style.display = 'none';
    document.querySelector('.photo-fallback').style.display = 'block';
});


/* =========================================================
   5. ANIMAÇÃO DE ENTRADA POR SCROLL
   Usa IntersectionObserver: revela cada bloco ao entrar na tela.
   ========================================================= */
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));


/* =========================================================
   6. LINK DE NAVEGAÇÃO ATIVO CONFORME A SEÇÃO VISÍVEL
   ========================================================= */
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('main section, header.hero');

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + id);
            });
        }
    });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach((s) => navObserver.observe(s));


/* =========================================================
   7. CONTADOR ANIMADO
   Conta de 0 até o número final (usado nos repositórios).
   ========================================================= */
function animateCount(element, target) {
    const duration = 900;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        element.textContent = Math.round(progress * target);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}


/* =========================================================
   8. INTEGRAÇÃO COM A API DO GITHUB
   Busca os repositórios públicos e monta os cards dinamicamente.
   Documentação: https://docs.github.com/rest
   ========================================================= */

/* Cores aproximadas por linguagem (padrão GitHub) */
const LANG_COLORS = {
    JavaScript: '#f1e05a',
    Python:     '#3572A5',
    HTML:       '#e34c26',
    CSS:        '#563d7c',
    Java:       '#b07219',
    TypeScript: '#3178c6'
};

/* Cria o HTML de um card de repositório */
function buildRepoCard(repo) {
    const card = document.createElement('a');
    card.className = 'repo-card';
    card.href = repo.html_url;
    card.target = '_blank';
    card.rel = 'noopener';

    const description = repo.description || 'Sem descrição.';
    const langColor = LANG_COLORS[repo.language] || 'var(--sage)';
    const langLabel = repo.language || 'Outro';

    card.innerHTML = `
        <h3>${repo.name} <span class="arrow">↗</span></h3>
        <p class="repo-desc">${description}</p>
        <div class="repo-foot">
            <span class="repo-lang">
                <span class="lang-dot" style="background:${langColor}"></span>
                ${langLabel}
            </span>
            <span>★ ${repo.stargazers_count}</span>
        </div>
    `;
    return card;
}

/* Busca e exibe os repositórios */
async function loadGitHubRepos() {
    const grid = document.getElementById('repos-grid');
    const counter = document.getElementById('repo-count');

    try {
        const response = await fetch(
            `https://api.github.com/users/sofiamassaro/repos?sort=updated&per_page=100`
        );

        if (!response.ok) {
            throw new Error('Resposta da API: ' + response.status);
        }

        const repos = await response.json();

        /* Mantém apenas repositórios próprios (sem forks) */
        const ownRepos = repos.filter((r) => !r.fork);

        /* Atualiza o contador com animação */
        animateCount(counter, ownRepos.length);

        grid.innerHTML = '';

        if (ownRepos.length === 0) {
            grid.innerHTML =
                '<p class="repos-status">Nenhum repositório público encontrado ainda.</p>';
            return;
        }

        /* Exibe os mais recentes (limitado por MAX_REPOS) */
        ownRepos.slice(0, MAX_REPOS).forEach((repo) => {
            grid.appendChild(buildRepoCard(repo));
        });

    } catch (error) {
        console.error('Erro ao carregar repositórios:', error);
        counter.textContent = '—';
        grid.innerHTML = `
            <p class="repos-status">
                Não foi possível carregar os repositórios agora.
                Veja diretamente em
                <a href="https://github.com/sofiamassaro" target="_blank" rel="noopener"
                   style="color:var(--lilac-dk);font-weight:600;">
                   github.com/sofiamassaro</a>.
            </p>
        `;
    }
}

/* Inicia a busca assim que a página carrega */
loadGitHubRepos();