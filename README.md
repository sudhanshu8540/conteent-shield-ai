# ContentShield AI — Backend

Production-ready REST API for AI-powered content fingerprinting and duplicate detection.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| File Upload | Multer |                      
| Cloud Storage | Cloudinary (optional) |
| Real-time | Socket.IO |
| Rate Limiting | express-rate-limit |

---

## Folder Structure

```
/server
├── server.js                 # Entry point – Express + Socket.IO
├── .env.example              # Environment variable template
├── config/
│   ├── db.js                 # MongoDB connection
│   └── cloudinary.js         # Cloudinary SDK config
├── models/
│   ├── User.js               # Auth schema (bcrypt pre-save hook)
│   ├── File.js               # Upload metadata
│   ├── Fingerprint.js        # SHA-256 hash per file
│   └── Detection.js          # Match results + similarity scores
├── controllers/
│   ├── authController.js     # register / login
│   ├── uploadController.js   # upload + auto fingerprint + auto detect
│   ├── fingerprintController.js  # on-demand hash generation
│   ├── detectionController.js    # on-demand detect + list detections
│   └── analyticsController.js   # aggregated stats
├── routes/
│   ├── authRoutes.js
│   ├── uploadRoutes.js
│   ├── fingerprintRoutes.js
│   ├── detectionRoutes.js
│   └── analyticsRoutes.js
├── middleware/
│   ├── authMiddleware.js     # JWT Bearer guard
│   ├── errorMiddleware.js    # Global error handler + asyncHandler
│   ├── rateLimiter.js        # 100 req / 15 min
│   └── uploadMiddleware.js   # Multer (local OR cloudinary)
└── utils/
    ├── jwtUtils.js           # sign / verify JWT
    ├── hashUtils.js          # SHA-256 + similarity scoring
    ├── fileUtils.js          # MIME allow-list, type categorisation
    └── platformUtils.js      # Mock platform names
```

---

## Setup

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Configure environment
```bash                   
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/contentshield_ai
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d

# Leave blank to use local /uploads folder
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# "local" or "cloudinary"
STORAGE_MODE=local

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 3. Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

---

## API Reference

All protected routes require:
```
Authorization: Bearer <token>
```

---

### Auth

#### `POST /api/auth/register`
```json
// Body
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }

// Response 201
{
  "message": "User registered successfully",
  "token": "eyJ...",
  "user": { "id": "...", "name": "Alice", "email": "alice@example.com", "createdAt": "..." }
}
```

#### `POST /api/auth/login`
```json
// Body
{ "email": "alice@example.com", "password": "secret123" }

// Response 200
{ "message": "Login successful", "token": "eyJ...", "user": { ... } }
```

---

### Files

#### `POST /api/upload`  🔒
- Content-Type: `multipart/form-data`
- Field name: `file`
- Accepts: image, video, audio, PDF (max 50 MB)

Automatically runs fingerprinting + duplicate detection on upload.

```json
// Response 201
{
  "message": "File uploaded successfully",
  "file": { "userId": "...", "fileName": "...", "fileType": "image", "fileSize": 204800, "fileUrl": "..." },
  "fingerprint": { "id": "...", "hash": "a3f2..." },
  "detection": {
    "originalFile": { ... },
    "matchedFiles": [{ "fileId": "...", "similarityScore": 87 }],
    "isDuplicate": false,
    "totalMatches": 1
  }
}
```

#### `GET /api/files`  🔒
```
Query params: page, limit, type (image|video|audio|pdf)
```
```json
// Response 200
{ "total": 42, "page": 1, "pages": 3, "files": [ ... ] }
```

---

### Fingerprinting

#### `POST /api/fingerprint/generate`  🔒
```json
// Body
{ "fileId": "64abc..." }

// Response 201
{ "message": "Fingerprint generated successfully", "fingerprint": { "fileId": "...", "fingerprintHash": "a3f2...", "algorithm": "SHA-256" } }
```

---

### Detection

#### `POST /api/detect`  🔒
```json
// Body
{ "fileId": "64abc..." }

// Response 200
{
  "originalFile": { ... },
  "matchedFiles": [
    { "fileId": "...", "similarityScore": 94, "platform": "Instagram" }
  ],
  "totalMatches": 1,
  "isDuplicate": true
}
```

#### `GET /api/detections`  🔒
```
Query params: page, limit, duplicatesOnly=true
```
```json
// Response 200
{ "total": 10, "page": 1, "pages": 1, "detections": [ ... ] }
```

---

### Analytics

#### `GET /api/analytics`  🔒
```json
// Response 200
{
  "overview": {
    "totalFilesUploaded": 150,
    "totalDuplicatesFound": 23,
    "totalDetections": 150,
    "accuracyPercentage": 73
  },
  "fileTypeBreakdown": [
    { "fileType": "image", "count": 90 },
    { "fileType": "video", "count": 40 }
  ],
  "platformDistribution": [
    { "platform": "Instagram", "count": 187 },
    { "platform": "Twitter", "count": 134 }
  ],
  "uploadsLast7Days": [
    { "date": "2025-01-10", "count": 12 }
  ],
  "generatedAt": "2025-01-16T10:30:00.000Z"
}
```

### Health Check

#### `GET /api/health`
```json
{ "status": "ok", "timestamp": "2025-01-16T10:30:00.000Z" }
```

---

## WebSocket Events

Connect via Socket.IO client:
```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

// Fires whenever a duplicate is detected
socket.on("detection:new", (data) => {
  console.log(data);
  // { fileId, fileName, totalMatches, isDuplicate, detectedAt }
});
```

---

## Error Format

All errors return:
```json
{ "message": "Human-readable description" }
```

| Code | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 404 | Resource not found |
| 409 | Conflict (duplicate email etc.) |
| 413 | File too large |
| 415 | Unsupported file type |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Rate Limiting

- **100 requests per 15 minutes** per IP (configurable via `.env`)
- Returns HTTP 429 with `{ "message": "Too many requests..." }` when exceeded

---

## Upgrading from Mock to Real AI Detection

The current fingerprint engine uses SHA-256 + nibble-level similarity scoring.
To upgrade to perceptual hashing:

1. Install `sharp` + `phash` (for images) or `ffmpeg` (for video/audio)
2. Replace `computeSimilarityScore` in `utils/hashUtils.js` with a Hamming-distance-based pHash comparison
3. Update the `Fingerprint` model's `metadata` field to store perceptual hash vectors

maine dono maine bnaaya hai
dono?
awaaj dhire kyu ho jaati
