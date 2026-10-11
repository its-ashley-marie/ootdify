const STORAGE_KEY = "ootdify:v4";
const LEGACY_STORAGE_KEY = "ootdify:v3";
const ACCOUNT_KEY = "ootdify:last-user";

const seedPosts = [
  {
    id: "seed-1",
    user: { name: "Zara Osei", handle: "zara.osei" },
    image: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=800&h=1100&fit=crop&auto=format",
    caption: "All black everything. NYC morning energy.",
    tags: ["AllBlack", "MinimalistFit", "GRWM"],
    comments: 47,
    createdAt: "2026-09-23T17:00:00.000Z"
  },
  {
    id: "seed-2",
    user: { name: "Kai Nakamura", handle: "kai.fits" },
    image: "https://images.unsplash.com/photo-1708242355178-d8c929b01a9d?w=800&h=1100&fit=crop&auto=format",
    caption: "Leather season is never over.",
    tags: ["Moto", "StreetCore", "LeatherJacket"],
    comments: 33,
    createdAt: "2026-09-22T15:00:00.000Z"
  },
  {
    id: "seed-3",
    user: { name: "Isla Ferreira", handle: "isla.drip" },
    image: "https://images.unsplash.com/photo-1624353656309-8be1a6c457be?w=800&h=1100&fit=crop&auto=format",
    caption: "Matching sets are never going out of style.",
    tags: ["CoordSet", "SummerFit", "Colorful"],
    comments: 21,
    createdAt: "2026-09-20T13:00:00.000Z"
  },
  {
    id: "seed-4",
    user: { name: "Maya Chen", handle: "maya.layers" },
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=1100&fit=crop&auto=format",
    caption: "A little oversized, a little polished.",
    tags: ["Layering", "CityFit", "Neutral"],
    comments: 18,
    createdAt: "2026-09-18T18:30:00.000Z"
  },
  {
    id: "seed-5",
    user: { name: "Noah Reyes", handle: "noah.wears" },
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&h=1100&fit=crop&auto=format",
    caption: "Trying to make office clothes feel less office-y.",
    tags: ["Workwear", "Menswear", "Loafers"],
    comments: 12,
    createdAt: "2026-09-17T16:00:00.000Z"
  }
];

const friendHandles = ["kai.fits", "isla.drip", "maya.layers"];

function initialQueues() {
  return {
    global: seedPosts.map((post) => post.id),
    friends: seedPosts.filter((post) => friendHandles.includes(post.user.handle)).map((post) => post.id)
  };
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const initialState = {
  session: {
    isSignedIn: false,
    user: { username: "guest", displayName: "Guest", provider: "prototype" }
  },
  ui: {
    route: "login",
    activeModal: null,
    selectedPostId: null,
    calendarMonth: monthKey(),
    notice: ""
  },
  posts: seedPosts,
  following: friendHandles,
  feedQueues: initialQueues(),
  swipes: {},
  boards: [
    { id: "inspo", name: "Inspo", postIds: [] },
    { id: "summer", name: "Summer Fits", postIds: [] },
    { id: "going-out", name: "Going Out", postIds: [] }
  ]
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`Could not read ${key}.`, error);
    return null;
  }
}

function normalizedQueues(saved, posts, following) {
  const fallbackGlobal = posts.map((post) => post.id);
  const fallbackFriends = posts.filter((post) => following.includes(post.user.handle)).map((post) => post.id);

  if (saved?.feedQueues && typeof saved.feedQueues === "object") {
    return {
      global: Array.isArray(saved.feedQueues.global) ? saved.feedQueues.global : fallbackGlobal,
      friends: Array.isArray(saved.feedQueues.friends) ? saved.feedQueues.friends : fallbackFriends
    };
  }

  // v3 migration: the old app only had one global feedQueue.
  const legacyGlobal = Array.isArray(saved?.feedQueue) ? saved.feedQueue : fallbackGlobal;
  return { global: legacyGlobal, friends: fallbackFriends };
}

function normalizeState(saved) {
  const base = clone(initialState);
  if (!saved || typeof saved !== "object") return base;

  const posts = Array.isArray(saved.posts) ? saved.posts : base.posts;
  const following = Array.isArray(saved.following) ? saved.following : base.following;

  return {
    ...base,
    ...saved,
    session: { ...base.session, ...(saved.session || {}) },
    ui: {
      ...base.ui,
      ...(saved.ui || {}),
      activeModal: null,
      selectedPostId: null,
      calendarMonth: saved.ui?.calendarMonth || base.ui.calendarMonth
    },
    posts,
    following,
    feedQueues: normalizedQueues(saved, posts, following),
    swipes: saved.swipes || {},
    boards: Array.isArray(saved.boards) ? saved.boards : base.boards
  };
}

function loadState() {
  return normalizeState(safeRead(STORAGE_KEY) || safeRead(LEGACY_STORAGE_KEY));
}

export const state = loadState();

export function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getLastUser() {
  return safeRead(ACCOUNT_KEY);
}

function rememberUser(user) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(user));
}

function usernameFrom(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "guest";
}

function startSession({ displayName, username, provider = "prototype" }) {
  const user = {
    displayName: displayName.trim() || "Guest",
    username: usernameFrom(username || displayName),
    provider
  };

  state.session = { isSignedIn: true, user };
  state.ui.route = "feed";
  rememberUser(user);
  persistState();
  return user;
}

export function signIn(identifier) {
  const clean = identifier.trim() || "guest";
  const displayName = clean.includes("@") ? clean.split("@")[0] : clean;
  return startSession({ displayName, username: clean, provider: "prototype" });
}

export function signInAsReturningUser() {
  const lastUser = getLastUser();
  if (!lastUser) return null;
  return startSession(lastUser);
}

export function signInWithGoogle() {
  // Prototype-only provider adapter. Swap this function for Google Identity
  // Services later without changing the rest of the app's session API.
  const lastUser = getLastUser();
  const googleUser = lastUser?.provider === "google"
    ? lastUser
    : { displayName: "Google User", username: "google.user", provider: "google" };

  return startSession(googleUser);
}

export function signOut() {
  state.session.isSignedIn = false;
  state.ui.route = "login";
  persistState();
}

export function getPost(postId) {
  return state.posts.find((post) => post.id === postId) || null;
}

export function getFeedQueue(scope = "global") {
  return state.feedQueues[scope] || [];
}

export function getCurrentPost(scope = "global") {
  return getPost(getFeedQueue(scope)[0]);
}

export function swipeCurrentPost(action, scope = "global") {
  const queue = getFeedQueue(scope);
  const postId = queue[0];
  if (!postId || !["keep", "pass"].includes(action)) return null;

  state.swipes[postId] = action;

  // A post should not immediately reappear in the other discovery tab.
  state.feedQueues.global = state.feedQueues.global.filter((id) => id !== postId);
  state.feedQueues.friends = state.feedQueues.friends.filter((id) => id !== postId);
  persistState();
  return getPost(postId);
}

export function restartFeed(scope = "global") {
  const candidates = state.posts.filter((post) => post.user.handle !== state.session.user.username);
  state.feedQueues[scope] = candidates
    .filter((post) => scope !== "friends" || state.following.includes(post.user.handle))
    .map((post) => post.id);
  persistState();
}

export function savePostToBoard(postId, boardId) {
  const board = state.boards.find((item) => item.id === boardId);
  if (!board || !getPost(postId)) return;

  if (!board.postIds.includes(postId)) board.postIds.push(postId);
  persistState();
}

export function createBoard(name) {
  const clean = name.trim();
  if (!clean) return null;

  const board = {
    id: `board-${Date.now()}`,
    name: clean,
    postIds: []
  };
  state.boards.push(board);
  persistState();
  return board;
}

export function createPost({ image, caption, tags }) {
  if (!image) throw new Error("Choose an image before posting.");

  const post = {
    id: `post-${Date.now()}`,
    user: {
      name: state.session.user.displayName,
      handle: state.session.user.username
    },
    image,
    caption: caption.trim(),
    tags: tags
      .split(/[#,]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    comments: 0,
    createdAt: new Date().toISOString()
  };

  state.posts.unshift(post);
  persistState();
  return post;
}

export function getUserPosts() {
  return state.posts
    .filter((post) => post.user.handle === state.session.user.username)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getBoardPosts(boardId) {
  const board = state.boards.find((item) => item.id === boardId);
  if (!board) return [];
  return board.postIds.map(getPost).filter(Boolean);
}

export function setCalendarMonth(year, monthIndex) {
  const date = new Date(year, monthIndex, 1);
  state.ui.calendarMonth = monthKey(date);
  persistState();
}

export function moveCalendarMonth(offset) {
  const [year, month] = state.ui.calendarMonth.split("-").map(Number);
  setCalendarMonth(year, month - 1 + offset);
}
