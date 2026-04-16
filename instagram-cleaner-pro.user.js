// ==UserScript==
// @name         Instagram Cleaner Pro (Smart Engine v4.9 Hardened + AutoLiker)
// @namespace    http://tampermonkey.net/
// @version      4.9.1
// @description  Modular Instagram feed filter + hardened ad detection + human-like auto-liker
// @match        *://www.instagram.com/*
// @include      *instagram.com/*
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    console.log("Instagram Cleaner Pro v4.9.1 Loaded");

    // ----------------------------
    // SETTINGS
    // ----------------------------
    const defaults = {
        hideAds: true,
        hideSuggested: true,
        hideVideos: true,
        hideLiked: true,
        softMode: false,
        debugMode: false,
        autoLikeEnabled: false,
        autoLikeMinDelay: 1500,
        autoLikeMaxDelay: 4000,
        autoLikeScrollDelay: 2000,
        autoLikeBatchSize: 3,
        autoLikeSkipPercent: 30,
        humanizeAutoLiker: true,
        humanViewMinDelay: 1500,
        humanViewMaxDelay: 3000,
        humanPauseAfterLikes: 4,
        humanPauseMinDelay: 10000,
        humanPauseMaxDelay: 20000,
        humanBackscrollChance: 20,
        humanPeekChance: 20,
        humanHoverChance: 50
    };

    let settings = { ...defaults };
    const processed = new Set();
    let autoLikeRunning = false;
    let autoLikeTimer = null;
    let autoLikeScrollTimer = null;
    let likesSincePause = 0;
    let likesThisSession = 0;
    const autoLikeStats = {
        liked: 0,
        skipped: 0,
        failed: 0,
        steps: 0
    };

    function resetAutoLikeStats() {
        autoLikeStats.liked = 0;
        autoLikeStats.skipped = 0;
        autoLikeStats.failed = 0;
        autoLikeStats.steps = 0;
    }

    function logAutoLikeStats(prefix = '[AutoLiker]') {
        if (!settings.debugMode) return;
        console.log(`${prefix} liked=${autoLikeStats.liked} skipped=${autoLikeStats.skipped} failed=${autoLikeStats.failed} steps=${autoLikeStats.steps}`);
    }

    // ----------------------------
    // LOAD / SAVE
    // ----------------------------
    async function loadSettings() {
        for (const k in defaults) {
            const storedValue = await GM.getValue(k, defaults[k]);
            if (typeof defaults[k] === 'boolean') {
                settings[k] = storedValue === true || storedValue === 'true';
            } else if (typeof defaults[k] === 'number') {
                const num = Number(storedValue);
                settings[k] = Number.isFinite(num) ? num : defaults[k];
            } else {
                settings[k] = storedValue;
            }
        }
    }

    async function saveSettings() {
        for (const k in settings) {
            await GM.setValue(k, settings[k]);
        }
    }

    // ----------------------------
    // HIDE LOGIC
    // ----------------------------
    function hide(post, reason) {
        if (settings.debugMode) console.log("[HIDE]", reason);

        if (settings.softMode) {
            post.style.filter = "blur(10px)";
            post.style.opacity = "0.2";
            post.style.pointerEvents = "none";
        } else {
            post.style.height = "0px";
            post.style.opacity = "0";
            post.style.visibility = "hidden";
            post.style.pointerEvents = "none";
            post.style.margin = "0";
            post.style.padding = "0";
        }

        post.dataset.igCleanerHidden = 'true';
    }

    function isHiddenPost(post) {
        if (!post || post.nodeType !== 1) return true;
        if (post.dataset.igCleanerHidden === 'true') return true;

        const style = window.getComputedStyle(post);
        if (!style) return false;

        const opacity = parseFloat(style.opacity);
        const isBlurred = (style.filter || '').includes('blur');

        return (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.pointerEvents === 'none' ||
            post.hasAttribute('hidden') ||
            post.dataset.igCleanerHidden === 'true' ||
            opacity === 0 ||
            opacity < 0.3 ||
            isBlurred
        );
    }

    // ----------------------------
    // 🔥 HARDENED AD DETECTION (FIX)
    // ----------------------------
    function detectAd(post) {
        if (!settings.hideAds) return false;

        const nodes = post.querySelectorAll("span, div, a");

        for (const el of nodes) {
            const txt = (el.textContent || "")
                .replace(/\u200b/g, "")
                .trim()
                .toLowerCase();

            if (txt === "ad") return true;
        }

        const text = (post.innerText || "")
            .replace(/\u200b/g, "")
            .toLowerCase();

        if (text.includes("sponsored")) return true;
        if (text.match(/\bad\b/)) return true;

        return false;
    }

    // ----------------------------
    // SUGGESTED DETECTION (FIXED)
    // ----------------------------
    function detectSuggested(post) {
        if (!settings.hideSuggested) return false;

        const direct = [...post.querySelectorAll("span")]
            .some(el =>
                (el.textContent || "")
                    .trim()
                    .toLowerCase() === "suggested for you"
            );

        if (direct) return true;

        const text = (post.innerText || "").toLowerCase();

        return (
            text.includes("suggested for you") ||
            text.includes("suggested posts") ||
            text.includes("recommended for you") ||
            text.includes("followed by")
        );
    }

    function detectVideo(post) {
        return settings.hideVideos && !!post.querySelector("video");
    }

    function detectLiked(post) {
        if (!settings.hideLiked) return false;

        const btn = post.querySelector('[aria-label*="like"], [aria-label*="Unlike"]');
        const label = btn?.getAttribute("aria-label")?.toLowerCase();

        return label?.includes("unlike");
    }

    function handlePost(post) {
        if (!post || processed.has(post) || isHiddenPost(post)) return;
        processed.add(post);

        if (detectAd(post)) return hide(post, "Ad");
        if (detectSuggested(post)) return hide(post, "Suggested");
        if (detectVideo(post)) return hide(post, "Video");
        if (detectLiked(post)) return hide(post, "Liked");
    }

    function handleFeed() {
        document.querySelectorAll("article").forEach(handlePost);
    }

    function getClosestArticle(node) {
        return node?.nodeType === 1 ? node.closest('article') : null;
    }

    function clearProcessedForMutation(mutations) {
        const articles = new Set();
        for (const mutation of mutations) {
            const targetArticle = getClosestArticle(mutation.target);
            if (targetArticle && !isHiddenPost(targetArticle)) articles.add(targetArticle);

            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    const addedArticle = getClosestArticle(node);
                    if (addedArticle && !isHiddenPost(addedArticle)) articles.add(addedArticle);
                }
            }
        }

        for (const article of articles) {
            processed.delete(article);
        }
    }

    // ----------------------------
    // AUTO LIKER
    // ----------------------------
    function findLikeControl(post) {
        if (isHiddenPost(post)) return null;

        const button = post.querySelector('button[aria-label*="like"], button[aria-label*="Unlike"], [role="button"][aria-label*="like"], [role="button"][aria-label*="Unlike"]');
        if (button) return button;

        const candidates = [...post.querySelectorAll('[aria-label]')]
            .map(el => ({
                el,
                label: (el.getAttribute('aria-label') || '').trim().toLowerCase()
            }))
            .filter(item => item.label.includes('like'));

        if (!candidates.length) return null;

        const unliked = candidates.find(item => !item.label.includes('unlike')) || candidates[0];
        return unliked.el.closest('button, [role="button"]') || unliked.el;
    }

    function isPostLiked(post) {
        return [...post.querySelectorAll('[aria-label]')]
            .some(el => {
                const label = (el.getAttribute('aria-label') || '').trim().toLowerCase();
                return label.includes('unlike');
            });
    }

    function simulateMouseClick(target) {
        if (!target) return false;
        const rect = target.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        const events = ['pointerdown', 'mousedown', 'mouseup', 'click'];
        for (const type of events) {
            const event = new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX,
                clientY,
                button: 0
            });
            target.dispatchEvent(event);
        }
        return true;
    }

    function safeClick(target) {
        if (!target) return false;
        try {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof target.click === 'function') {
                target.click();
            } else {
                simulateMouseClick(target);
            }
            return true;
        } catch (err) {
            if (settings.debugMode) console.warn('[AutoLiker] safeClick failed', err, target);
            try {
                return simulateMouseClick(target);
            } catch (innerErr) {
                if (settings.debugMode) console.warn('[AutoLiker] simulateMouseClick failed', innerErr, target);
                return false;
            }
        }
    }

    function getPostUsername(post) {
        if (!post) return null;
        const header = post.querySelector('header');
        const source = header || post;

        const authorAnchor = source.querySelector('a[href^="/"]');
        if (authorAnchor) {
            const text = (authorAnchor.textContent || '').trim();
            if (text) return text.split('\n')[0].trim().toLowerCase();

            const href = authorAnchor.getAttribute('href') || '';
            const parts = href.split('/').filter(Boolean);
            if (parts.length === 1) return parts[0].toLowerCase();
            if (parts.length === 2 && parts[0] === 'u') return parts[1].toLowerCase();
        }

        const imgAlt = source.querySelector('img[alt]')?.alt;
        if (imgAlt) {
            const match = imgAlt.match(/^(.+?)(?:'s|’s)?\s*profile picture$/i);
            if (match) return match[1].trim().toLowerCase();
        }

        return null;
    }

    function hasStoryRing(element, depth = 0) {
        if (!element || depth > 3) return false;
        if (element.querySelector('canvas, svg, circle, path')) return true;

        const className = (element.className || '').toString().toLowerCase();
        if (/(story|ring|gradient|active)/.test(className)) return true;

        const style = window.getComputedStyle(element);
        if (style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage.includes('gradient')) return true;
        if (style.boxShadow && style.boxShadow !== 'none') return true;
        if (style.borderImage && style.borderImage !== 'none') return true;

        const borderWidth = parseFloat(style.borderTopWidth) + parseFloat(style.borderRightWidth) + parseFloat(style.borderBottomWidth) + parseFloat(style.borderLeftWidth);
        if (borderWidth > 0 && style.borderTopColor !== 'transparent') return true;

        return hasStoryRing(element.parentElement, depth + 1);
    }

    function findStoryControlForPost(post) {
        if (!post) return null;

        const avatarImg = post.querySelector('img[alt$="profile picture"], img[alt*="profile picture"]');
        if (avatarImg) {
            const avatarLink = avatarImg.closest('span[role="link"]') || avatarImg.closest('a[href^="/"]');
            const ringContainer = avatarImg.closest('div[role="button"]') || avatarLink || avatarImg.parentElement;

            if (ringContainer && hasStoryRing(ringContainer)) {
                const innerClick = ringContainer.querySelector('[role="link"], a[href^="/"], button, [role="button"]');
                return innerClick || ringContainer;
            }
        }

        const candidates = [...post.querySelectorAll('div[role="button"], [role="button"], [role="link"], a, button')];
        for (const candidate of candidates) {
            if (hasStoryRing(candidate) || candidate.querySelector('canvas, svg, circle, path')) {
                const innerClick = candidate.querySelector('[role="link"], a[href^="/"], button, [role="button"]');
                return innerClick || candidate;
            }
        }

        if (settings.debugMode) console.log('[AutoLiker] no per-post story ring found for', post);
        return null;
    }

    async function closeStory() {
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
        document.dispatchEvent(escapeEvent);
        await new Promise(resolve => window.setTimeout(resolve, 300));
        const closeButton = document.querySelector('button[aria-label*="Close"], button[class*="Close"], div[role="button"][aria-label*="Close"]');
        if (closeButton) closeButton.click();
    }

    async function openStoryForPost(post, username) {
        const target = findStoryControlForPost(post);
        if (!target) {
            if (settings.debugMode) console.log('[AutoLiker] no active story ring for', username, post);
            return false;
        }

        if (settings.debugMode) console.log('[AutoLiker] opening story for', username, target);
        const clicked = safeClick(target);
        if (!clicked) {
            if (settings.debugMode) console.warn('[AutoLiker] failed to click story ring for', username, target);
            return false;
        }

        const duration = randomInt(3000, 6000);
        await new Promise(resolve => window.setTimeout(resolve, duration));
        await closeStory();
        return true;
    }

    function getUnlikedPosts() {
        return [...document.querySelectorAll('article')].filter(post => {
            if (isHiddenPost(post)) return false;
            return !isPostLiked(post) && !!findLikeControl(post);
        });
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function randomInt(min, max) {
        return Math.floor(randomBetween(min, max + 1));
    }

    function chance(percent) {
        return Math.random() * 100 < percent;
    }

    function humanDelay(min, max) {
        return Math.round(min + Math.random() * (max - min));
    }

    function maybeHover(target) {
        if (!target || !chance(settings.humanHoverChance)) return;

        const rect = target.getBoundingClientRect();
        const x = rect.left + rect.width / 2 + randomBetween(-rect.width * 0.1, rect.width * 0.1);
        const y = rect.top + rect.height / 2 + randomBetween(-rect.height * 0.1, rect.height * 0.1);

        target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));
        target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }));
    }

    async function humanViewPost(post) {
        if (!settings.humanizeAutoLiker) return;
        post.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(resolve => window.setTimeout(resolve, humanDelay(settings.humanViewMinDelay, settings.humanViewMaxDelay)));
    }

    function estimateLikes() {
        const avgLikeDelay = (settings.autoLikeMinDelay + settings.autoLikeMaxDelay) / 2;
        const avgAfterLikeDelay = 350;
        const avgBatchClicks = settings.autoLikeBatchSize * (1 - settings.autoLikeSkipPercent / 100);
        const avgBatchTime = settings.autoLikeBatchSize * (avgLikeDelay + avgAfterLikeDelay) + settings.autoLikeScrollDelay + 700;
        if (avgBatchTime <= 0 || avgBatchClicks <= 0) {
            return { perHour: 0, perDay: 0 };
        }

        const perHour = Math.max(0, Math.round((60 * 60 * 1000 / avgBatchTime) * avgBatchClicks));
        const perDay = Math.max(0, Math.round((24 * 60 * 60 * 1000 / avgBatchTime) * avgBatchClicks));
        return { perHour, perDay };
    }

    function scrollToNext() {
        const articles = [...document.querySelectorAll('article')];
        const lastArticle = articles[articles.length - 1];
        if (!lastArticle) return;
        lastArticle.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    function maybeHumanScroll() {
        if (!settings.humanizeAutoLiker) return;
        const articles = [...document.querySelectorAll('article')];
        if (!articles.length) return;

        if (chance(settings.humanBackscrollChance) && articles.length > 4) {
            const index = Math.max(0, articles.length - 1 - randomInt(1, Math.min(4, articles.length - 1)));
            articles[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const index = Math.min(articles.length - 1, randomInt(Math.max(0, articles.length - 3), articles.length - 1));
        articles[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function maybeTakeLongBreak() {
        if (!settings.humanizeAutoLiker) return false;
        if (likesSincePause < settings.humanPauseAfterLikes) return false;

        likesSincePause = 0;
        const pause = humanDelay(settings.humanPauseMinDelay, settings.humanPauseMaxDelay);
        if (settings.debugMode) console.log(`[AutoLiker] taking human pause for ${pause}ms`);
        await new Promise(resolve => window.setTimeout(resolve, pause));
        return true;
    }

    async function autoLikeStep() {
        if (!settings.autoLikeEnabled) return;

        if (await maybeTakeLongBreak()) {
            const afterBreakDelay = humanDelay(settings.autoLikeMinDelay, settings.autoLikeMaxDelay);
            if (settings.debugMode) console.log(`[AutoLiker] resuming after break in ${afterBreakDelay}ms`);
            return autoLikeTimer = window.setTimeout(autoLikeStep, afterBreakDelay);
        }

        const posts = getUnlikedPosts();
        if (!posts.length) {
            if (settings.debugMode) console.log('[AutoLiker] no unliked posts found, scrolling page');
            maybeHumanScroll();
            autoLikeScrollTimer = window.setTimeout(autoLikeStep, settings.autoLikeScrollDelay);
            return;
        }

        const batch = posts.slice(0, settings.autoLikeBatchSize);
        for (const post of batch) {
            await humanViewPost(post);

            const clickTarget = findLikeControl(post);
            if (!clickTarget) continue;

            if (chance(settings.humanPeekChance)) {
                if (settings.debugMode) console.log('[AutoLiker] peeking post before action', post);
                await new Promise(resolve => window.setTimeout(resolve, humanDelay(700, 1500)));
                window.scrollBy({ top: randomInt(50, 180), left: 0, behavior: 'smooth' });
                await new Promise(resolve => window.setTimeout(resolve, humanDelay(400, 900)));
            }

            maybeHover(clickTarget);

            const skipChance = settings.autoLikeSkipPercent / 100;
            if (Math.random() < skipChance) {
                autoLikeStats.skipped += 1;
                if (settings.debugMode) console.log('[AutoLiker] skipping post randomly', post);
                await new Promise(resolve => window.setTimeout(resolve, humanDelay(500, 1200)));
                continue;
            }

            const delay = humanDelay(settings.autoLikeMinDelay, settings.autoLikeMaxDelay);
            if (settings.debugMode) console.log(`[AutoLiker] liking post in ${delay}ms`, post);
            await new Promise(resolve => window.setTimeout(resolve, delay));

            const username = getPostUsername(post);
            if (username) {
                await openStoryForPost(post, username);
            }

            const clicked = safeClick(clickTarget);
            if (!clicked) {
                autoLikeStats.failed += 1;
                if (settings.debugMode) console.log('[AutoLiker] failed click target', clickTarget, 'user', username || 'unknown');
                continue;
            }

            autoLikeStats.liked += 1;
            if (settings.debugMode) console.log('[AutoLiker] liked post user', username || 'unknown', post);
            likesSincePause += 1;
            likesThisSession += 1;

            await new Promise(resolve => window.setTimeout(resolve, humanDelay(200, 500)));
        }
        autoLikeStats.steps += 1;
        logAutoLikeStats('[AutoLiker] batch complete');

        maybeHumanScroll();
        const nextDelay = settings.autoLikeScrollDelay + humanDelay(200, 1200);
        autoLikeScrollTimer = window.setTimeout(() => {
            autoLikeTimer = window.setTimeout(autoLikeStep, nextDelay);
        }, settings.autoLikeScrollDelay);
    }

    function startAutoLiker() {
        if (autoLikeRunning) return;
        autoLikeRunning = true;
        resetAutoLikeStats();
        if (settings.debugMode) console.log('[AutoLiker] started');
        autoLikeStep();
    }

    function stopAutoLiker() {
        autoLikeRunning = false;
        if (settings.debugMode) logAutoLikeStats('[AutoLiker] stopped');
        if (autoLikeTimer) {
            window.clearTimeout(autoLikeTimer);
            autoLikeTimer = null;
        }
        if (autoLikeScrollTimer) {
            window.clearTimeout(autoLikeScrollTimer);
            autoLikeScrollTimer = null;
        }
        if (settings.debugMode) console.log('[AutoLiker] stopped');
    }

    function toggleAutoLiker(enabled) {
        settings.autoLikeEnabled = enabled;
        if (enabled) {
            startAutoLiker();
        } else {
            stopAutoLiker();
        }
    }

    // ----------------------------
    // SETTINGS UI
    // ----------------------------
    function createSettingsUI() {
        const btn = document.createElement("div");
        btn.innerText = "⚙";
        btn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 9999999;
            background: black;
            color: white;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
        `;

        const panel = document.createElement("div");
        panel.style.cssText = `
            position: fixed;
            bottom: 130px;
            right: 20px;
            z-index: 9999999;
            background: rgba(0,0,0,0.92);
            color: white;
            padding: 12px;
            border-radius: 10px;
            font-size: 13px;
            display: none;
            min-width: 240px;
            font-family: Arial;
        `;

        panel.innerHTML = `
            <label><input type="checkbox" id="hideAds"> Hide Ads</label><br>
            <label><input type="checkbox" id="hideSuggested"> Hide Suggested</label><br>
            <label><input type="checkbox" id="hideVideos"> Hide Videos</label><br>
            <label><input type="checkbox" id="hideLiked"> Hide Liked</label><br>
            <label><input type="checkbox" id="softMode"> Soft Mode</label><br>
            <label><input type="checkbox" id="debugMode"> Debug Mode</label><br>
            <hr style="border-color: rgba(255,255,255,0.2); margin: 8px 0;">
            <label><input type="checkbox" id="autoLikeEnabled"> Enable AutoLiker</label><br>
            <label>Like delay min (sec): <input type="number" id="autoLikeMinDelay" style="width: 60px;" value="${settings.autoLikeMinDelay / 1000}"></label><br>
            <label>Like delay max (sec): <input type="number" id="autoLikeMaxDelay" style="width: 60px;" value="${settings.autoLikeMaxDelay / 1000}"></label><br>
            <label>Scroll delay (sec): <input type="number" id="autoLikeScrollDelay" style="width: 60px;" value="${settings.autoLikeScrollDelay / 1000}"></label><br>
            <label>Batch size: <input type="number" id="autoLikeBatchSize" style="width: 40px;" value="${settings.autoLikeBatchSize}"></label><br>
            <label>Skip chance (%): <input type="number" id="autoLikeSkipPercent" style="width: 40px;" min="0" max="100" value="${settings.autoLikeSkipPercent}"></label><br>
                <label><input type="checkbox" id="humanizeAutoLiker"> Humanize AutoLiker</label><br>
            <label>View time min (sec): <input type="number" id="humanViewMinDelay" style="width: 60px;" value="${settings.humanViewMinDelay / 1000}"></label><br>
            <label>View time max (sec): <input type="number" id="humanViewMaxDelay" style="width: 60px;" value="${settings.humanViewMaxDelay / 1000}"></label><br>
            <label>Pause after likes: <input type="number" id="humanPauseAfterLikes" style="width: 40px;" value="${settings.humanPauseAfterLikes}"></label><br>
            <label>Pause length min (sec): <input type="number" id="humanPauseMinDelay" style="width: 60px;" value="${settings.humanPauseMinDelay / 1000}"></label><br>
            <label>Pause length max (sec): <input type="number" id="humanPauseMaxDelay" style="width: 60px;" value="${settings.humanPauseMaxDelay / 1000}"></label><br>
            <label>Backscroll chance (%): <input type="number" id="humanBackscrollChance" style="width: 40px;" min="0" max="100" value="${settings.humanBackscrollChance}"></label><br>
            <label>Peek chance (%): <input type="number" id="humanPeekChance" style="width: 40px;" min="0" max="100" value="${settings.humanPeekChance}"></label><br>
            <label>Hover chance (%): <input type="number" id="humanHoverChance" style="width: 40px;" min="0" max="100" value="${settings.humanHoverChance}"></label><br>
            <div style="margin-top:8px;font-size:12px;">
                <strong>Estimated likes:</strong><br>
                <span id="autoLikeEstimateHour">0</span> per hour ·
                <span id="autoLikeEstimateDay">0</span> per 24h
            </div>
        `;

        btn.onclick = () => {
            panel.style.display = panel.style.display === "block" ? "none" : "block";
        };

        document.body.appendChild(btn);
        document.body.appendChild(panel);

        const bind = () => {
            panel.querySelector("#hideAds").checked = settings.hideAds;
            panel.querySelector("#hideSuggested").checked = settings.hideSuggested;
            panel.querySelector("#hideVideos").checked = settings.hideVideos;
            panel.querySelector("#hideLiked").checked = settings.hideLiked;
            panel.querySelector("#softMode").checked = settings.softMode;
            panel.querySelector("#debugMode").checked = settings.debugMode;
            panel.querySelector("#autoLikeEnabled").checked = settings.autoLikeEnabled;
            panel.querySelector("#autoLikeMinDelay").value = settings.autoLikeMinDelay / 1000;
            panel.querySelector("#autoLikeMaxDelay").value = settings.autoLikeMaxDelay / 1000;
            panel.querySelector("#autoLikeScrollDelay").value = settings.autoLikeScrollDelay / 1000;
            panel.querySelector("#autoLikeBatchSize").value = settings.autoLikeBatchSize;
            panel.querySelector("#autoLikeSkipPercent").value = settings.autoLikeSkipPercent;
            panel.querySelector("#humanizeAutoLiker").checked = settings.humanizeAutoLiker;
            panel.querySelector("#humanViewMinDelay").value = settings.humanViewMinDelay / 1000;
            panel.querySelector("#humanViewMaxDelay").value = settings.humanViewMaxDelay / 1000;
            panel.querySelector("#humanPauseAfterLikes").value = settings.humanPauseAfterLikes;
            panel.querySelector("#humanPauseMinDelay").value = settings.humanPauseMinDelay / 1000;
            panel.querySelector("#humanPauseMaxDelay").value = settings.humanPauseMaxDelay / 1000;
            panel.querySelector("#humanBackscrollChance").value = settings.humanBackscrollChance;
            panel.querySelector("#humanPeekChance").value = settings.humanPeekChance;
            panel.querySelector("#humanHoverChance").value = settings.humanHoverChance;
            const estimate = estimateLikes();
            panel.querySelector("#autoLikeEstimateHour").innerText = estimate.perHour;
            panel.querySelector("#autoLikeEstimateDay").innerText = estimate.perDay;
        };

        bind();

        panel.addEventListener("change", async () => {
            const wasAutoLikeEnabled = settings.autoLikeEnabled;

            settings.hideAds = panel.querySelector("#hideAds").checked;
            settings.hideSuggested = panel.querySelector("#hideSuggested").checked;
            settings.hideVideos = panel.querySelector("#hideVideos").checked;
            settings.hideLiked = panel.querySelector("#hideLiked").checked;
            settings.softMode = panel.querySelector("#softMode").checked;
            settings.debugMode = panel.querySelector("#debugMode").checked;
            settings.autoLikeEnabled = panel.querySelector("#autoLikeEnabled").checked;
            settings.autoLikeMinDelay = (Number(panel.querySelector("#autoLikeMinDelay").value) || defaults.autoLikeMinDelay / 1000) * 1000;
            settings.autoLikeMaxDelay = (Number(panel.querySelector("#autoLikeMaxDelay").value) || defaults.autoLikeMaxDelay / 1000) * 1000;
            settings.autoLikeScrollDelay = (Number(panel.querySelector("#autoLikeScrollDelay").value) || defaults.autoLikeScrollDelay / 1000) * 1000;
            settings.autoLikeBatchSize = Math.max(1, Number(panel.querySelector("#autoLikeBatchSize").value) || defaults.autoLikeBatchSize);
            settings.autoLikeSkipPercent = Math.min(100, Math.max(0, Number(panel.querySelector("#autoLikeSkipPercent").value) || defaults.autoLikeSkipPercent));
            settings.humanizeAutoLiker = panel.querySelector("#humanizeAutoLiker").checked;
            settings.humanViewMinDelay = (Number(panel.querySelector("#humanViewMinDelay").value) || defaults.humanViewMinDelay / 1000) * 1000;
            settings.humanViewMaxDelay = (Number(panel.querySelector("#humanViewMaxDelay").value) || defaults.humanViewMaxDelay / 1000) * 1000;
            settings.humanPauseAfterLikes = Math.max(1, Number(panel.querySelector("#humanPauseAfterLikes").value) || defaults.humanPauseAfterLikes);
            settings.humanPauseMinDelay = (Number(panel.querySelector("#humanPauseMinDelay").value) || defaults.humanPauseMinDelay / 1000) * 1000;
            settings.humanPauseMaxDelay = (Number(panel.querySelector("#humanPauseMaxDelay").value) || defaults.humanPauseMaxDelay / 1000) * 1000;
            settings.humanBackscrollChance = Math.min(100, Math.max(0, Number(panel.querySelector("#humanBackscrollChance").value) || defaults.humanBackscrollChance));
            settings.humanPeekChance = Math.min(100, Math.max(0, Number(panel.querySelector("#humanPeekChance").value) || defaults.humanPeekChance));
            settings.humanHoverChance = Math.min(100, Math.max(0, Number(panel.querySelector("#humanHoverChance").value) || defaults.humanHoverChance));

            await saveSettings();
            processed.clear();
            handleFeed();
            const estimate = estimateLikes();
            panel.querySelector("#autoLikeEstimateHour").innerText = estimate.perHour;
            panel.querySelector("#autoLikeEstimateDay").innerText = estimate.perDay;

            if (settings.autoLikeEnabled !== wasAutoLikeEnabled) {
                toggleAutoLiker(settings.autoLikeEnabled);
            }
        });
    }

    function initObserver() {
        const target = document.querySelector("main") || document.body;

        const observer = new MutationObserver((mutations) => {
            clearProcessedForMutation(mutations);
            handleFeed();
        });

        observer.observe(target, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }

    function initPreCleaner() {
        const root = document.querySelector("main") || document.body;

        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.matches?.("article")) {
                            handlePost(node);
                        } else {
                            node.querySelectorAll?.("article").forEach(handlePost);
                        }
                    }
                }
            }
        });

        observer.observe(root, {
            childList: true,
            subtree: true
        });
    }

    async function init() {
        await loadSettings();

        handleFeed();
        createSettingsUI();
        initObserver();
        initPreCleaner();

        if (settings.autoLikeEnabled) {
            startAutoLiker();
        }
    }

    init();
})();
