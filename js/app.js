import {
  state,
  signIn,
  signInAsReturningUser,
  signInWithGoogle,
  signOut,
  getLastUser,
  getFeedQueue,
  getCurrentPost,
  swipeCurrentPost,
  restartFeed,
  savePostToBoard,
  createBoard,
  createPost,
  getUserPosts,
  getBoardPosts,
  getPost,
  moveCalendarMonth
} from "./state.js";
import { initRouter, navigate } from "./router.js";

const app = document.querySelector("#app");
let pendingImage = "";
let drag = null;
let isAnimatingSwipe = false;

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function navButton(route, label, icon) {
  return `<button class="nav-link ${state.ui.route === route ? "is-active" : ""}" data-route="${route}" aria-label="${label}"><span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span></button>`;
}

function shell(content) {
  return `
    <div class="app-shell">
      <div class="ambient-shape ambient-shape--one"></div>
      <div class="ambient-shape ambient-shape--two"></div>
      <header class="topbar">
        <button class="wordmark" data-route="feed">ootdify<span class="wordmark-dot">.</span></button>
        <nav class="nav" aria-label="Primary navigation">
          ${navButton("feed", "Global", "⌂")}
          ${navButton("friends", "Friends", "☻")}
          ${navButton("calendar", "Calendar", "▦")}
          ${navButton("boards", "Boards", "♡")}
          ${navButton("profile", "Profile", "◌")}
        </nav>
        <button class="button button--quiet topbar-post" data-action="open-post">+ post</button>
      </header>
      <main class="page">${content}</main>
    </div>
  `;
}

function loginView() {
  const lastUser = getLastUser();
  const returning = lastUser
    ? `<button class="returning-user" data-action="returning-signin">
        <span class="avatar-bubble">${escapeHTML(lastUser.displayName.slice(0, 1).toUpperCase())}</span>
        <span><strong>Continue as ${escapeHTML(lastUser.displayName)}</strong><small>@${escapeHTML(lastUser.username)}</small></span>
        <span class="returning-arrow">→</span>
      </button>`
    : "";

  return `
    <main class="auth-page">
      <div class="auth-blob auth-blob--one"></div>
      <div class="auth-blob auth-blob--two"></div>
      <section class="auth-card">
        <div class="auth-brand">
          <span class="auth-sticker">what are we wearing?</span>
          <h1>ootdify<span>.</span></h1>
          <p>Find a fit, keep up with your friends, and remember what you wore without turning style into homework.</p>
        </div>

        <div class="auth-actions">
          ${returning}
          <button class="google-button" data-action="google-signin">
            <span class="google-g" aria-hidden="true">G</span>
            Continue with Google
          </button>
          <div class="auth-divider"><span>or</span></div>
          <form data-form="signin" class="stack auth-form">
            <label>
              <span>${lastUser ? "Use another account" : "Create or enter your profile"}</span>
              <input name="username" autocomplete="username" placeholder="name or email" required>
            </label>
            <button class="button button--full" type="submit">${lastUser ? "Log in" : "Start styling"}</button>
          </form>
        </div>
        <p class="fine-print auth-note">Prototype authentication for now — Google is wired as a replaceable provider adapter, not production OAuth yet.</p>
      </section>
    </main>
  `;
}

function postCard(post, scope) {
  if (!post) return "";

  return `
    <article class="fit-card" data-post-id="${post.id}" data-swipe-card data-feed-scope="${scope}">
      <div class="swipe-stamp swipe-stamp--pass" data-swipe-pass>PASS</div>
      <div class="swipe-stamp swipe-stamp--keep" data-swipe-keep>KEEP</div>
      <div class="fit-card__image-wrap">
        <img class="fit-card__image" src="${escapeHTML(post.image)}" alt="${escapeHTML(post.caption || "Outfit post")}">
      </div>
      <div class="fit-card__body">
        <div class="post-meta">
          <div class="creator-row">
            <span class="mini-avatar">${escapeHTML(post.user.name.slice(0, 1))}</span>
            <div><strong>${escapeHTML(post.user.name)}</strong><span>@${escapeHTML(post.user.handle)}</span></div>
          </div>
          <span class="comment-count">${post.comments} ✦</span>
        </div>
        <p class="caption">${escapeHTML(post.caption)}</p>
        <div class="tag-row">${post.tags.map((tag) => `<span>#${escapeHTML(tag)}</span>`).join("")}</div>
      </div>
    </article>
  `;
}

function feedView(scope = "global") {
  const post = getCurrentPost(scope);
  const queue = getFeedQueue(scope);
  const isFriends = scope === "friends";
  const content = post
    ? `
      <section class="feed-layout">
        <div class="feed-context">
          <span class="feed-context__dot ${isFriends ? "feed-context__dot--friends" : ""}"></span>
          <span>${isFriends ? "friends only" : "global discovery"}</span>
        </div>
        <div class="section-heading feed-heading">
          <div><p class="eyebrow">${isFriends ? "from your people" : "today's little lineup"}</p><h1>${isFriends ? "friends' fits" : "find your vibe"}</h1></div>
          <span class="count-pill">${queue.length} left</span>
        </div>
        <div class="card-stage">
          <div class="ghost-card ghost-card--back"></div>
          <div class="ghost-card ghost-card--mid"></div>
          ${postCard(post, scope)}
        </div>
        <div class="swipe-actions" aria-label="Outfit actions">
          <button class="swipe-button swipe-button--pass" data-action="pass" aria-label="Pass this outfit"><span>←</span><small>pass</small></button>
          <p class="swipe-hint"><span class="mobile-hint">swipe it</span><span class="desktop-hint">use ← → or click</span></p>
          <button class="swipe-button swipe-button--keep" data-action="keep" aria-label="Keep this outfit"><span>→</span><small>keep</small></button>
        </div>
      </section>`
    : `
      <section class="empty-state bubbly-panel">
        <span class="empty-doodle">${isFriends ? "☻" : "✿"}</span>
        <p class="eyebrow">${isFriends ? "friend check complete" : "you made it"}</p>
        <h1>${isFriends ? "all caught up" : "all caught up!"}</h1>
        <p>${isFriends ? "You’ve seen everything your prototype friends have posted here." : "You’ve swiped through today’s prototype fits."}</p>
        <button class="button" data-action="restart-feed">go again</button>
      </section>`;

  return shell(content);
}

function boardsView() {
  const cards = state.boards.map((board, index) => {
    const posts = getBoardPosts(board.id);
    const preview = posts.slice(0, 3).map((post) => `<img src="${escapeHTML(post.image)}" alt="">`).join("");
    return `
      <article class="board-card board-card--${(index % 3) + 1}">
        <div class="board-preview ${posts.length ? "" : "is-empty"}">${preview || "<span>♡</span><small>nothing tucked away yet</small>"}</div>
        <div><h2>${escapeHTML(board.name)}</h2><p class="muted">${posts.length} saved fit${posts.length === 1 ? "" : "s"}</p></div>
      </article>`;
  }).join("");

  return shell(`
    <section>
      <div class="section-heading"><div><p class="eyebrow">your style pockets</p><h1>boards</h1></div></div>
      <form data-form="board" class="inline-form bubbly-panel">
        <input name="boardName" placeholder="name a new board..." required>
        <button class="button button--secondary" type="submit">+ make it</button>
      </form>
      <div class="board-grid">${cards}</div>
    </section>
  `);
}

function formatPostDate(dateString, options = {}) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en", {
    month: options.short ? "short" : "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function profileView() {
  const posts = getUserPosts();
  const keptCount = Object.values(state.swipes).filter((value) => value === "keep").length;
  return shell(`
    <section>
      <div class="profile-header bubbly-panel">
        <div class="profile-identity">
          <div class="profile-avatar">${escapeHTML(state.session.user.displayName.slice(0, 1).toUpperCase())}</div>
          <div><p class="eyebrow">your corner</p><h1>${escapeHTML(state.session.user.displayName)}</h1><p class="muted">@${escapeHTML(state.session.user.username)}</p></div>
        </div>
        <button class="button button--quiet" data-action="signout">log out</button>
      </div>
      <div class="profile-stats">
        <div><strong>${posts.length}</strong><span>fits posted</span></div>
        <div><strong>${keptCount}</strong><span>fits kept</span></div>
        <div><strong>${state.boards.reduce((sum, board) => sum + board.postIds.length, 0)}</strong><span>board saves</span></div>
      </div>
      <div class="profile-gallery-heading">
        <div><p class="eyebrow">your outfit archive</p><h2>tap a post to open it</h2></div>
        <button class="text-link" data-route="calendar">see calendar →</button>
      </div>
      ${posts.length
        ? `<div class="profile-grid">${posts.map((post) => `
            <button class="profile-post" data-action="open-detail" data-post-id="${post.id}" aria-label="Open outfit from ${escapeHTML(formatPostDate(post.createdAt))}">
              <img src="${escapeHTML(post.image)}" alt="${escapeHTML(post.caption)}">
              <span class="profile-post__date">${escapeHTML(formatPostDate(post.createdAt, { short: true }))}</span>
            </button>`).join("")}</div>`
        : `<div class="empty-inline bubbly-panel"><span>☻</span><p>No fits here yet. Once you post, your grid and calendar become your outfit diary.</p><button class="button" data-action="open-post">post your first one</button></div>`}
    </section>
  `);
}

function calendarView() {
  const posts = getUserPosts();
  const [year, month] = state.ui.calendarMonth.split("-").map(Number);
  const monthIndex = month - 1;
  const firstDay = new Date(year, monthIndex, 1);
  const dayOffset = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(firstDay);
  const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  const postsByDay = new Map();
  posts.forEach((post) => {
    const date = new Date(post.createdAt);
    if (date.getFullYear() !== year || date.getMonth() !== monthIndex) return;
    const day = date.getDate();
    if (!postsByDay.has(day)) postsByDay.set(day, []);
    postsByDay.get(day).push(post);
  });

  const cells = [];
  for (let i = 0; i < dayOffset; i += 1) cells.push(`<div class="calendar-cell calendar-cell--blank" aria-hidden="true"></div>`);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayPosts = postsByDay.get(day) || [];
    const firstPost = dayPosts[0];
    cells.push(firstPost
      ? `<button class="calendar-cell calendar-cell--posted" data-action="open-detail" data-post-id="${firstPost.id}" aria-label="Open ${dayPosts.length} outfit post${dayPosts.length === 1 ? "" : "s"} from ${monthLabel} ${day}">
          <img src="${escapeHTML(firstPost.image)}" alt="">
          <span class="calendar-day">${day}</span>
          ${dayPosts.length > 1 ? `<span class="calendar-count">+${dayPosts.length - 1}</span>` : ""}
        </button>`
      : `<div class="calendar-cell"><span class="calendar-day">${day}</span></div>`);
  }

  const monthCount = [...postsByDay.values()].reduce((sum, dayPosts) => sum + dayPosts.length, 0);

  return shell(`
    <section class="calendar-page">
      <div class="calendar-intro">
        <div><p class="eyebrow">your outfit memory</p><h1>calendar</h1></div>
        <p class="calendar-intro__copy">A tiny visual diary of what you wore and when you shared it.</p>
      </div>
      <div class="calendar-shell bubbly-panel">
        <div class="calendar-toolbar">
          <button class="calendar-arrow" data-action="previous-month" aria-label="Previous month">←</button>
          <div><h2>${escapeHTML(monthLabel)}</h2><p>${monthCount} post${monthCount === 1 ? "" : "s"} this month</p></div>
          <button class="calendar-arrow" data-action="next-month" aria-label="Next month">→</button>
        </div>
        <div class="calendar-weekdays">${weekdays.map((day) => `<span>${day}</span>`).join("")}</div>
        <div class="calendar-grid">${cells.join("")}</div>
      </div>
      ${posts.length === 0 ? `<div class="calendar-empty"><span>✿</span><p>Your calendar fills itself as you post. No extra logging required.</p><button class="button" data-action="open-post">post today's fit</button></div>` : ""}
    </section>
  `);
}

function postModal() {
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="post-modal-title" data-modal-panel>
        <div class="modal-heading"><div><p class="eyebrow">show us the fit</p><h2 id="post-modal-title">post your ootd</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
        <form data-form="post" class="stack">
          <label class="upload-box">
            <span>${pendingImage ? "photo picked ✓" : "tap to choose an outfit photo"}</span>
            <input name="image" type="file" accept="image/*">
          </label>
          ${pendingImage ? `<img class="upload-preview" src="${pendingImage}" alt="Selected outfit preview">` : ""}
          <label><span>Caption</span><textarea name="caption" rows="3" placeholder="what's the story today?"></textarea></label>
          <label><span>Tags</span><input name="tags" placeholder="#workwear, #thrifted, #softgirl"></label>
          <button class="button" type="submit">post it</button>
        </form>
      </section>
    </div>
  `;
}

function boardModal(postId) {
  const post = getPost(postId);
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="modal" role="dialog" aria-modal="true" data-modal-panel>
        <div class="modal-heading"><div><p class="eyebrow">you kept it ♡</p><h2>where should it live?</h2></div><button class="icon-button" data-action="close-modal">×</button></div>
        ${post ? `<p class="muted">${escapeHTML(post.caption)}</p>` : ""}
        <div class="choice-list">
          ${state.boards.map((board) => `<button class="choice" data-action="save-board" data-board-id="${board.id}" data-post-id="${postId}"><span>${escapeHTML(board.name)}</span><small>${board.postIds.length} saved</small></button>`).join("")}
        </div>
      </section>
    </div>`;
}

function postHistoryModal(selectedPostId) {
  const posts = getUserPosts();
  const selectedIndex = Math.max(0, posts.findIndex((post) => post.id === selectedPostId));

  return `
    <div class="modal-backdrop modal-backdrop--history" data-action="close-modal">
      <section class="history-modal" role="dialog" aria-modal="true" aria-label="Your outfit history" data-modal-panel>
        <header class="history-header">
          <div>
            <p class="eyebrow">your outfit history</p>
            <h2>${posts.length ? `${selectedIndex + 1} of ${posts.length}` : "your posts"}</h2>
          </div>
          <button class="icon-button" data-action="close-modal" aria-label="Close">×</button>
        </header>
        <div class="history-scroll" data-history-scroll>
          ${posts.map((post) => `
            <article class="history-post ${post.id === selectedPostId ? "is-selected" : ""}" id="detail-${post.id}" data-detail-post="${post.id}">
              <div class="history-post__date">
                <span>${escapeHTML(formatPostDate(post.createdAt))}</span>
                ${post.id === selectedPostId ? `<small>opened from your profile</small>` : ""}
              </div>
              <img class="history-post__image" src="${escapeHTML(post.image)}" alt="${escapeHTML(post.caption || "Outfit post")}">
              <div class="history-post__body">
                ${post.caption ? `<p>${escapeHTML(post.caption)}</p>` : `<p class="muted">no caption — the fit said enough.</p>`}
                ${post.tags.length ? `<div class="tag-row">${post.tags.map((tag) => `<span>#${escapeHTML(tag)}</span>`).join("")}</div>` : ""}
              </div>
            </article>
          `).join("")}
          ${posts.length > 1 ? `<p class="history-end">you've reached the edge of this little outfit timeline ✿</p>` : ""}
        </div>
      </section>
    </div>
  `;
}

function scrollSelectedPostIntoView(postId) {
  window.requestAnimationFrame(() => {
    const target = document.getElementById(`detail-${postId}`);
    target?.scrollIntoView({ block: "start" });
  });
}

function render() {
  drag = null;
  isAnimatingSwipe = false;

  if (!state.session.isSignedIn || state.ui.route === "login") {
    app.innerHTML = loginView();
    return;
  }

  if (state.ui.route === "friends") app.innerHTML = feedView("friends");
  else if (state.ui.route === "calendar") app.innerHTML = calendarView();
  else if (state.ui.route === "boards") app.innerHTML = boardsView();
  else if (state.ui.route === "profile") app.innerHTML = profileView();
  else app.innerHTML = feedView("global");

  if (state.ui.activeModal === "post") app.insertAdjacentHTML("beforeend", postModal());
  if (state.ui.activeModal === "board" && state.ui.selectedPostId) app.insertAdjacentHTML("beforeend", boardModal(state.ui.selectedPostId));
  if (state.ui.activeModal === "post-detail" && state.ui.selectedPostId) {
    app.insertAdjacentHTML("beforeend", postHistoryModal(state.ui.selectedPostId));
    scrollSelectedPostIntoView(state.ui.selectedPostId);
  }
}

function openModal(name, postId = null) {
  state.ui.activeModal = name;
  state.ui.selectedPostId = postId;
  render();
}

function closeModal() {
  state.ui.activeModal = null;
  state.ui.selectedPostId = null;
  pendingImage = "";
  render();
}

function currentFeedScope() {
  return state.ui.route === "friends" ? "friends" : "global";
}

function commitSwipe(action) {
  const scope = currentFeedScope();
  if (isAnimatingSwipe || !getCurrentPost(scope)) return;
  isAnimatingSwipe = true;

  const card = app.querySelector("[data-swipe-card]");
  if (!card) {
    completeSwipe(action, scope);
    return;
  }

  const direction = action === "keep" ? 1 : -1;
  card.classList.add("is-committing");
  card.style.transform = `translateX(${direction * 130}%) rotate(${direction * 16}deg)`;
  card.style.opacity = "0";

  window.setTimeout(() => completeSwipe(action, scope), 220);
}

function completeSwipe(action, scope) {
  if (action === "pass") {
    swipeCurrentPost("pass", scope);
    render();
    return;
  }

  const post = swipeCurrentPost("keep", scope);
  if (post) openModal("board", post.id);
  else render();
}

function resetDraggedCard(card) {
  card.classList.add("is-resetting");
  card.style.transform = "";
  card.style.opacity = "";
  const passStamp = card.querySelector("[data-swipe-pass]");
  const keepStamp = card.querySelector("[data-swipe-keep]");
  if (passStamp) passStamp.style.opacity = "0";
  if (keepStamp) keepStamp.style.opacity = "0";
  window.setTimeout(() => card.classList.remove("is-resetting"), 220);
}

function beginDrag(event) {
  const card = event.target.closest("[data-swipe-card]");
  if (!card || isAnimatingSwipe || state.ui.activeModal) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;

  drag = { card, pointerId: event.pointerId, startX: event.clientX, dx: 0 };
  card.setPointerCapture?.(event.pointerId);
  card.classList.add("is-dragging");
}

function moveDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  drag.dx = event.clientX - drag.startX;
  const width = drag.card.offsetWidth || 1;
  const progress = Math.min(Math.abs(drag.dx) / (width * 0.32), 1);
  const rotation = Math.max(-12, Math.min(12, drag.dx / 18));

  drag.card.style.transform = `translateX(${drag.dx}px) rotate(${rotation}deg)`;
  const passStamp = drag.card.querySelector("[data-swipe-pass]");
  const keepStamp = drag.card.querySelector("[data-swipe-keep]");
  if (passStamp) passStamp.style.opacity = drag.dx < 0 ? String(progress) : "0";
  if (keepStamp) keepStamp.style.opacity = drag.dx > 0 ? String(progress) : "0";
}

function endDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const { card, dx } = drag;
  drag = null;
  card.classList.remove("is-dragging");

  const threshold = Math.min(110, card.offsetWidth * 0.24);
  if (Math.abs(dx) >= threshold) {
    commitSwipe(dx > 0 ? "keep" : "pass");
  } else {
    resetDraggedCard(card);
  }
}

app.addEventListener("pointerdown", beginDrag);
app.addEventListener("pointermove", moveDrag);
app.addEventListener("pointerup", endDrag);
app.addEventListener("pointercancel", endDrag);

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-route], [data-action]");
  if (!target) return;

  if (target.dataset.route) {
    navigate(target.dataset.route);
    return;
  }

  const action = target.dataset.action;

  if (action === "open-post") openModal("post");
  if (action === "open-detail") openModal("post-detail", target.dataset.postId);
  if (action === "close-modal") {
    const clickedInsidePanel = Boolean(event.target.closest("[data-modal-panel]"));
    if (target.matches("button") || !clickedInsidePanel) closeModal();
  }
  if (action === "pass") commitSwipe("pass");
  if (action === "keep") commitSwipe("keep");
  if (action === "restart-feed") {
    restartFeed(currentFeedScope());
    render();
  }
  if (action === "save-board") {
    savePostToBoard(target.dataset.postId, target.dataset.boardId);
    closeModal();
  }
  if (action === "previous-month") {
    moveCalendarMonth(-1);
    render();
  }
  if (action === "next-month") {
    moveCalendarMonth(1);
    render();
  }
  if (action === "signout") {
    signOut();
    navigate("login");
  }
  if (action === "returning-signin") {
    signInAsReturningUser();
    navigate("feed");
  }
  if (action === "google-signin") {
    signInWithGoogle();
    navigate("feed");
  }
});

app.addEventListener("change", (event) => {
  if (event.target.name !== "image") return;
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    pendingImage = reader.result;
    render();
  };
  reader.readAsDataURL(file);
});

app.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);

  if (form.dataset.form === "signin") {
    signIn(data.get("username") || "guest");
    navigate("feed");
  }

  if (form.dataset.form === "board") {
    createBoard(data.get("boardName") || "");
    render();
  }

  if (form.dataset.form === "post") {
    try {
      createPost({
        image: pendingImage,
        caption: data.get("caption") || "",
        tags: data.get("tags") || ""
      });
      closeModal();
      navigate("profile");
    } catch (error) {
      alert(error.message);
    }
  }
});

window.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName;
  const isTyping = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
  const isFeedRoute = state.ui.route === "feed" || state.ui.route === "friends";
  if (isTyping || !isFeedRoute || state.ui.activeModal || !state.session.isSignedIn) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    commitSwipe("pass");
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    commitSwipe("keep");
  }
});

window.addEventListener("ootdify:route", render);
initRouter();
render();
