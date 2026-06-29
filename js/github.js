/* =================================================================
   github.js — live public stats from the GitHub REST API
   No token: read-only public endpoints. Cached in sessionStorage.
   ================================================================= */
(function () {
    "use strict";

    const USER = "elkisser";
    const CACHE_KEY = "gh-cache-v1";
    const CACHE_TTL = 60 * 60 * 1000; // 1h

    const LANG_COLORS = {
        TypeScript: "#3178c6", JavaScript: "#f1e05a", HTML: "#e34c26",
        CSS: "#563d7c", PHP: "#4F5D95", Astro: "#ff5d01", Dart: "#00B4AB",
        Twig: "#c1d026", Python: "#3572A5", Java: "#b07219"
    };

    function setText(key, value) {
        const el = document.querySelector(`[data-gh="${key}"]`);
        if (el) el.textContent = value;
    }

    function animateCount(key, target) {
        const el = document.querySelector(`[data-gh="${key}"]`);
        if (!el) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            el.textContent = String(target);
            return;
        }
        const start = performance.now();
        const dur = 900;
        function step(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = String(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function renderLangs(langs) {
        const wrap = document.getElementById("gh-langs");
        if (!wrap) return;
        wrap.innerHTML = "";
        langs.slice(0, 6).forEach((name) => {
            const span = document.createElement("span");
            span.className = "gh-lang";
            const dot = document.createElement("span");
            dot.className = "dot";
            dot.style.background = LANG_COLORS[name] || "var(--accent)";
            span.appendChild(dot);
            span.appendChild(document.createTextNode(name));
            wrap.appendChild(span);
        });
    }

    function paint(data) {
        animateCount("repos", data.repos);
        animateCount("stars", data.stars);
        animateCount("followers", data.followers);
        animateCount("languages", data.languages.length);
        renderLangs(data.languages);
    }

    async function fetchData() {
        const [userRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${USER}`),
            fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`)
        ]);
        if (!userRes.ok || !reposRes.ok) throw new Error("GitHub API error");

        const user = await userRes.json();
        const repos = await reposRes.json();

        const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
        const langCount = {};
        repos.forEach((r) => {
            if (r.language && !r.fork) langCount[r.language] = (langCount[r.language] || 0) + 1;
        });
        const languages = Object.keys(langCount).sort((a, b) => langCount[b] - langCount[a]);

        return {
            repos: user.public_repos || repos.length,
            stars,
            followers: user.followers || 0,
            languages
        };
    }

    function readCache() {
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const { t, data } = JSON.parse(raw);
            if (Date.now() - t > CACHE_TTL) return null;
            return data;
        } catch (_) {
            return null;
        }
    }

    function writeCache(data) {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data }));
        } catch (_) { /* ignore quota */ }
    }

    function showFallback() {
        // Keep the dashes but make the section still useful
        ["repos", "stars", "followers", "languages"].forEach((k) => {
            const el = document.querySelector(`[data-gh="${k}"]`);
            if (el && el.textContent === "—") el.textContent = "·";
        });
    }

    // Load only when the section approaches the viewport
    function init() {
        const section = document.getElementById("github");
        if (!section) return;

        const cached = readCache();
        if (cached) { paint(cached); return; }

        const run = () => {
            fetchData()
                .then((data) => { writeCache(data); paint(data); })
                .catch(() => showFallback());
        };

        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver((entries, obs) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) { run(); obs.disconnect(); }
                });
            }, { rootMargin: "200px" });
            io.observe(section);
        } else {
            run();
        }
    }

    if (document.readyState !== "loading") init();
    else document.addEventListener("DOMContentLoaded", init);
})();
