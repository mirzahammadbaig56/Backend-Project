# MyTube — A Complete Video Platform Backend

A fully-featured, production-style backend for a video-sharing platform (inspired by YouTube), built from scratch with **Node.js**, **Express**, and **MongoDB**. This project covers the entire feature set of a real-world video platform — authentication, video management, social interactions, and channel analytics — with a strong focus on clean architecture, security, and correct data modeling.

**Model/Architecture Reference:** [Eraser.io Workspace Diagram](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj?origin=share)

**Live API:** `https://backend-project-production-ecdd.up.railway.app`

---

## 🚀 Features

### 🔐 Authentication & User Management
- Secure registration with avatar/cover image upload
- Login with username **or** email
- JWT-based authentication using **access tokens** (short-lived) and **refresh tokens** (long-lived, stored & validated server-side)
- Automatic token refresh flow
- Secure logout with token invalidation
- Password change with old-password verification
- Update account details, avatar, and cover image independently
- Channel profile with subscriber/subscription counts (via aggregation)
- Watch history tracking with full video + uploader details

### 📹 Video Management
- Upload videos with thumbnail (Cloudinary storage, chunked upload for large files)
- Get all videos with **pagination, search, and sorting**
- Get single video (with view-count increment)
- Update video details (title, description, thumbnail)
- Delete video (cleans up Cloudinary assets)
- Toggle publish/unpublish status
- Access control — unpublished videos visible only to their owner

### 🔔 Subscriptions
- Subscribe / unsubscribe toggle
- Get a channel's subscriber list
- Get channels a user is subscribed to
- Self-subscription prevention

### ❤️ Likes
- Toggle like/unlike on videos, comments, and tweets
- Get all videos liked by the current user

### 💬 Comments
- Add, update, and delete comments on videos
- Paginated comment listing with commenter details

### 🐦 Tweets (Community Posts)
- Create, read, update, and delete short text posts
- Fetch all tweets by a specific user

### 📃 Playlists
- Create, update, and delete playlists
- Add/remove videos from a playlist (duplicate-safe)
- Get a user's playlists and a single playlist by ID (with full video + owner details)

### 📊 Dashboard
- Channel statistics — total videos, total views, total subscribers, total likes
- List of all videos uploaded by the channel owner

### ✅ Healthcheck
- Simple endpoint to verify server uptime (useful for deployment monitoring)

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB with Mongoose |
| Authentication | JWT (jsonwebtoken), bcrypt |
| File Storage | Cloudinary |
| File Uploads | Multer |
| Validation | Zod |
| Pagination | mongoose-aggregate-paginate-v2 |
| Deployment | Railway |

---

## 📁 Core Modules

| Module | Description |
|---|---|
| **User** | Registration, login, JWT auth, profile & account management, watch history |
| **Video** | CRUD, publishing, search/sort/pagination, view tracking |
| **Subscription** | Subscribe/unsubscribe, subscriber & subscription lists |
| **Like** | Like/unlike videos, comments, and tweets |
| **Comment** | Commenting system with pagination |
| **Tweet** | Short-form text posts |
| **Playlist** | Playlist creation and video management |
| **Dashboard** | Channel analytics |
| **Healthcheck** | Server status monitoring |

---

## 🧠 Key Engineering Highlights

- **Secure token architecture** — short-lived access tokens paired with server-validated refresh tokens to balance security and user experience, with protection against token reuse.
- **MongoDB Aggregation Pipelines** — extensive use of `$lookup` (including nested sub-pipelines), `$addFields`, `$group`, and `$match` to compute channel statistics, subscriber counts, and populate related data (owners, videos) in a single query.
- **Chunked large-file uploads** — videos are uploaded to Cloudinary using a chunked upload strategy to reliably handle large media files.
- **Consistent validation layer** — request bodies validated with Zod schemas across every module, with clear, structured error responses.
- **Ownership-based access control** — every mutating endpoint (update/delete) verifies resource ownership before allowing changes.
- **Clean file lifecycle management** — local temp files and orphaned Cloudinary assets are cleaned up automatically on both success and failure paths.

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Cloudinary account

### Installation

```bash
git clone <repository-url>
cd backend-project
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=your_frontend_url

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run the project

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:8000` (or your configured `PORT`).

---

## 📡 API Endpoints

All routes are prefixed with `/api/v1`. Endpoints marked 🔒 require authentication (valid access token via cookie or `Authorization: Bearer` header).

### 👤 Users — `/api/v1/users`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new user (avatar + optional cover image) |
| POST | `/login` | Login with username/email + password |
| POST | `/refresh-token` | Get a new access token using the refresh token |
| POST | `/logout` 🔒 | Logout and invalidate refresh token |
| POST | `/change-password` 🔒 | Change the current password |
| GET | `/current-user` 🔒 | Get the logged-in user's profile |
| PATCH | `/update-account` 🔒 | Update account details (username, email, full name) |
| PATCH | `/avatar` 🔒 | Update avatar image |
| PATCH | `/cover-image` 🔒 | Update cover image |
| GET | `/c/:username` | Get a channel's public profile (with subscriber counts) |
| GET | `/watch-history` 🔒 | Get the logged-in user's watch history |

### 📹 Videos — `/api/v1/videos`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all videos (supports `page`, `limit`, `query`, `sortBy`, `sortType`, `userId`) |
| POST | `/` 🔒 | Publish a new video (video file + thumbnail) |
| GET | `/:videoId` | Get a single video by ID (increments view count) |
| PATCH | `/:videoId` 🔒 | Update video title/description/thumbnail |
| DELETE | `/:videoId` 🔒 | Delete a video |
| PATCH | `/toggle/publish/:videoId` 🔒 | Toggle publish/unpublish status |

### 🔔 Subscriptions — `/api/v1/subscriptions`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/c/:channelId` 🔒 | Subscribe/unsubscribe to a channel (toggle) |
| GET | `/subscribers/:channelId` | Get a channel's list of subscribers |
| GET | `/channels/:subscriberId` | Get channels a user is subscribed to |

### ❤️ Likes — `/api/v1/likes` 🔒 (all routes require authentication)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/toggle/v/:videoId` | Like/unlike a video |
| POST | `/toggle/c/:commentId` | Like/unlike a comment |
| POST | `/toggle/t/:tweetId` | Like/unlike a tweet |
| GET | `/videos` | Get all videos liked by the current user |

### 💬 Comments — `/api/v1/comments`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/:videoId` | Get all comments on a video (paginated) |
| POST | `/:videoId` 🔒 | Add a comment to a video |
| PATCH | `/c/:commentId` 🔒 | Update a comment |
| DELETE | `/c/:commentId` 🔒 | Delete a comment |

### 🐦 Tweets — `/api/v1/tweets` 🔒 (all routes require authentication)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a tweet |
| GET | `/user/:userId` | Get all tweets by a user |
| PATCH | `/:tweetId` | Update a tweet |
| DELETE | `/:tweetId` | Delete a tweet |

### 📃 Playlists — `/api/v1/playlists` 🔒 (all routes require authentication)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a playlist |
| GET | `/user/:userId` | Get all playlists of a user |
| GET | `/:playlistId` | Get a single playlist (with videos + owners) |
| PATCH | `/:playlistId` | Update playlist name/description |
| DELETE | `/:playlistId` | Delete a playlist |
| PATCH | `/add/:videoId/:playlistId` | Add a video to a playlist |
| PATCH | `/remove/:videoId/:playlistId` | Remove a video from a playlist |

### 📊 Dashboard — `/api/v1/dashboard` 🔒 (all routes require authentication)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Get channel statistics (videos, views, subscribers, likes) |
| GET | `/videos` | Get all videos uploaded by the channel owner |

### ✅ Healthcheck — `/api/v1/healthcheck`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check if the server is up and running |

---

## 📌 What I Learned Building This

- Designing a full authentication system from the ground up, including the reasoning behind access/refresh token separation and its security trade-offs.
- Writing and reasoning about multi-stage MongoDB aggregation pipelines, including how `$lookup` always returns arrays and how nested pipelines operate on different document contexts at each level.
- Handling real-world file upload challenges — from Multer configuration to Cloudinary's chunked upload API for large video files.
- Building consistent, defensive backend patterns: ownership checks, input validation, orphaned-resource cleanup, and structured error handling.
- Deploying a Node.js + MongoDB Atlas backend to a live environment (Railway) and configuring environment variables, CORS, and networking for production.

---

## 🔮 Roadmap

- Frontend client (React) to consume this API
- Custom domain
- Rate limiting and additional security hardening

---

## Author

**Mirza Hammad Baig** — Software Engineering student, self-directed backend developer.
