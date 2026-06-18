# FAQHub — Feature Specification v2.0

> **Version:** 2.0  
> **Last Updated:** 2026-05-28  
> **Status:** Draft for Review  
> **Applies to:** Vicharanashala Internship FAQ Platform (MERN Stack)

---

## Table of Contents

1. [Multi-lingual Chatbot with Image Identification](#1-multi-lingual-chatbot-with-image-identification)
2. [Enhanced Database with Pictorial Visualization](#2-enhanced-database-with-pictorial-visualization)
3. [Admin Capabilities — Special Credentials & Priority Tracking](#3-admin-capabilities--special-credentials--priority-tracking)
4. [Moderator Review System](#4-moderator-review-system)
5. [Duplicate Question Detection & Merging](#5-duplicate-question-detection--merging)
6. [Integration Matrix](#6-integration-matrix)
7. [Cross-Cutting Concerns](#7-cross-cutting-concerns)

---

## 1. Multi-lingual Chatbot with Image Identification

### 1.1 Objective

Provide an AI-powered conversational assistant that:
- Answers user queries in multiple Indian and international languages
- Accepts image uploads and extracts text/content from them via OCR
- Answers questions contextually based on the FAQ database
- Falls back gracefully when AI is unavailable

### 1.2 User Workflows

#### 1.2.1 Text Chat (Any Language)

```
1. User clicks floating chat bubble (bottom-right, persistent across all pages)
2. Chat panel slides up (Framer Motion, 300ms ease-out)
3. User types in their language (e.g., Hindi, Telugu, Tamil, Punjabi, English)
4. System detects language via a library or header
5. Query is sent to backend → embedded search against FAQ collection
6. If confidence > 70%: return FAQ answer in user's language (via translation layer)
7. If confidence < 70%: return "I'm not fully sure. Here's what I found:" + closest match
8. If no match: offer to redirect to /raise-query with pre-filled title
9. Conversation history stored in sessionStorage for context
```

#### 1.2.2 Image Upload Flow

```
1. User clicks camera/image icon in chat input bar
2. File picker opens (accept: image/png, image/jpeg, image/webp; max 5 MB)
3. Image preview shown in chat as a thumbnail with loading spinner
4. Backend receives image → OCR processing (Tesseract.js or cloud OCR API)
5. Extracted text is combined with user's optional text query
6. FAQ search is performed against extracted text
7. Result returned with annotation: "From your image, I read: <extracted text>"
8. User can copy extracted text or ask follow-up questions
```

#### 1.2.3 Language Selector

- Top of chat panel: a language dropdown showing 10+ languages
- Selection persists in localStorage
- All UI labels in the chat widget itself also switch language (i18n)

### 1.3 Technical Considerations

| Area | Approach |
|------|----------|
| **OCR (Client-side)** | `Tesseract.js` — runs in-browser via WebAssembly, no server cost. Lighter alternative: `PaddleOCR` via a microservice. |
| **OCR (Server-side)** | Google Cloud Vision API or Azure Computer Vision for higher accuracy. Cost: ~$1.50 per 1000 images. |
| **Translation** | `@google-cloud/translate` or LibreTranslate self-hosted (free, 30+ languages). Cache translations in MongoDB to avoid repeated API calls. |
| **Language Detection** | `franc-min` (client) or `@google-cloud/translate/detect` (server). |
| **Chat UI** | Custom React component using Framer Motion; no heavy library needed. |
| **Fallback** | If both OCR and translation APIs fail, show a friendly error and fall back to English FAQ search. |
| **Rate Limiting** | 30 messages/min per user on chat endpoint. |

### 1.4 Database Changes

```javascript
// Collection: chat_sessions (optional, for analytics)
{
  _id: ObjectId,
  user_id: ObjectId | null,
  messages: [
    {
      role: "user" | "bot",
      content: String,
      language: String,
      image_url: String | null,
      extracted_text: String | null,
      timestamp: Date
    }
  ],
  created_at: Date,
  updated_at: Date
}

// Add to FAQ model (for translation cache):
// translated_answers: { hi: String, te: String, ta: String, ... }
```

### 1.5 Integration Points

- **FAQ Hub** — Chatbot searches the same FAQ collection (`/api/faqs/search`)
- **Raise Query** — "No match" flow redirects here with pre-filled title
- **Auth** — Chat available to all users; logged-in users see history
- **Admin Dashboard** — Chat analytics panel showing top queries, language distribution

### 1.6 UI Specifications

```
Chat Bubble: Fixed bottom-right, z-50, w-14 h-14 rounded-full
  - bg-indigo-600, white icon, shadow-lg
  - Pulse animation when unread suggested FAQs exist

Chat Panel: w-96 max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-120px)]
  - Glassmorphism header (bg-white/80 backdrop-blur-lg)
  - Message bubbles: user = indigo-100, bot = gray-100 (dark variants)
  - Typing indicator: 3 bouncing dots
  - Image preview: rounded-lg max-w-[200px] with X button
  - Language selector: dropdown at top
  - Input bar: fixed bottom, with send + image buttons
```

### 1.7 Acceptance Criteria

| # | Criterion | Metric |
|---|-----------|--------|
| 1 | Chat responds within 2 seconds for text queries | < 2s p95 |
| 2 | Image OCR extracts text within 5 seconds | < 5s p95 |
| 3 | Translation accuracy > 80% for top 5 languages | Spot-check |
| 4 | Chat bubble does not overlap page content on mobile | No visual breakage |
| 5 | Language preference persists across page navigation | localStorage |
| 6 | Fallback to English when translation API fails | Silent degradation |

---

## 2. Enhanced Database with Pictorial Visualization

### 2.1 Objective

Transform the current text-only FAQ display into a visually rich, categorized gallery where users can view FAQs as cards with icons, color coding, and optional diagrams, while adding an "OTHERS" catch-all category in every dropdown.

### 2.2 User Workflows

#### 2.2.1 Browsing the Visual FAQ Gallery

```
1. User navigates to /faq (default view togglable between Tree View and Gallery View)
2. Gallery View shows FAQs as cards in a responsive grid (2-3 columns desktop, 1 mobile)
3. Each card displays:
   - Category icon (colored) + category name as badge
   - Question text (2-line clamp)
   - First 3 tags as chips
   - View count + bookmark count
   - A small preview image if the FAQ has one attached
4. Clicking a card opens the answer in a modal/expanded card
5. Hover: slight lift (translateY(-2px)) + shadow increase
```

#### 2.2.2 Adding "OTHERS" to Every Dropdown

```
1. Every <select> for category in the system includes "OTHERS" as the last option
2. "OTHERS" is a real category in the Category collection
3. When "OTHERS" is selected:
   - Backend saves the question/FAQ with category = "OTHERS"
   - Frontend shows a free-text "Specify category" field
   - Admin gets a notification to review and possibly re-categorize
```

### 2.3 Affected Dropdowns

| Page | Dropdown | Current Options | Change |
|------|----------|-----------------|--------|
| /raise-query | Category | Dynamic from DB | Append "OTHERS" |
| /admin/manage-faqs | Category filter | Dynamic from DB | Append "OTHERS" |
| /community-qa | Filter by category | Dynamic from DB | Append "OTHERS" |
| Category editor (admin) | Parent category | Dynamic from DB | Append "OTHERS" |

### 2.4 Database Changes

```javascript
// Add to FAQ model:
// image_url: String (optional — URL to attached diagram/screenshot)
// icon_name: String (optional — overrides category icon)

// Add to Category model or seed data:
{
  name: "OTHERS",
  description: "Miscellaneous queries that don't fit existing categories",
  icon: "more-horizontal",
  is_catchall: true
}

// New collection: category_override_requests
{
  _id: ObjectId,
  faq_id: ObjectId,
  suggested_category: String,
  submitted_by: ObjectId,
  status: "pending" | "approved" | "rejected",
  admin_notes: String,
  created_at: Date
}
```

### 2.5 UI Specifications

```
Gallery Card:
  - w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)]
  - bg-white dark:bg-gray-800 rounded-xl border p-4
  - Transition: hover:shadow-lg hover:-translate-y-0.5 duration-200
  - Icon circle: 40px, gradient bg based on category color map
  - Question: font-medium text-sm line-clamp-2
  - Tags: flex-wrap gap-1
  - Footer: view count, bookmark button, share button

View Toggle:
  - Pill switch in the FAQ header: "Tree" | "Gallery"
  - Active state: bg-indigo-600 text-white
  - Stored in localStorage

OTHERS Badge:
  - Same visual weight as other categories
  - Icon: "more-horizontal" (three dots)
  - Color: gray-400 (neutral, less prominent)
```

### 2.6 Acceptance Criteria

| # | Criterion | Metric |
|---|-----------|--------|
| 1 | Gallery cards render within 500ms for 50 FAQs | Lighthouse |
| 2 | All dropdowns contain "OTHERS" option | Manual audit |
| 3 | "OTHERS" FAQs are filterable and searchable | E2E test |
| 4 | Gallery/Tree toggle persists across page reloads | localStorage |
| 5 | Mobile grid collapses to single column | Responsive |

---

## 3. Admin Capabilities — Special Credentials & Priority Tracking

### 3.1 Objective

Empower admins to:
- Issue special access credentials (temporary admin/mod/mentor roles)
- View and manage a priority-ranked list of frequently asked questions
- Track which questions are asked most often by students (filterable by demographic)

### 3.2 User Workflows

#### 3.2.1 Special Credential Management

```
1. Admin navigates to /admin/credentials
2. Table shows all current special users (moderators, mentors, TAs)
3. Admin clicks "Issue Credential"
4. Modal opens with fields:
   - Email of recipient
   - Role: moderator | mentor | ta | analyst
   - Duration: 7d | 30d | 90d | permanent
   - Reason (internal note)
5. System sends email to recipient with:
   - Temporary login link (or instructions)
   - Credential duration
   - Scope of access
6. Credential appears in table with countdown timer
7. Admin can revoke at any time
```

#### 3.2.2 Priority Tracking Dashboard

```
1. Admin navigates to /admin/priority-faqs
2. Dashboard shows:
   - Top 20 most-viewed FAQs (last 7d, 30d, all time)
   - Top 20 most-bookmarked FAQs
   - FAQs with most pending "unhelpful" feedback
   - "Trending" FAQs (spike in views over last 48 hours)
3. Each row shows: rank, question, category, view count, trend arrow
4. Admin can click "Promote" to pin a FAQ to the top of /faq
5. Admin can click "Flag for Review" if content is stale
```

#### 3.2.3 Student Priority Tracking

```
1. Admin selects filter: "Students only" on analytics
2. Backend filters FAQ views/bookmarks/questions by users with
   role = "user" AND email domain NOT in [admin domains]
3. Results show which FAQs students struggle with most
4. Admin can create targeted FAQ improvements based on this data
```

### 3.3 Technical Considerations

| Area | Approach |
|------|----------|
| **Credentials** | New `Credential` collection with expiry + scope. JWT includes `special_roles[]`. |
| **Trending algorithm** | Compare view count in last 48h vs preceding 48h. Spike = >200% increase. |
| **Student detection** | `User.role === "user"` by default. Optional domain allowlist for "admin domains". |
| **Promotion/pinning** | Add `is_pinned: Boolean, pinned_order: Number` to FAQ model. |

### 3.4 Database Changes

```javascript
// New collection: credentials
{
  _id: ObjectId,
  email: String,
  user_id: ObjectId | null,        // linked when user registers
  role: "moderator" | "mentor" | "ta" | "analyst",
  granted_by: ObjectId,             // admin who issued
  reason: String,
  expires_at: Date,
  is_active: Boolean,
  created_at: Date,
  revoked_at: Date | null
}

// Add to FAQ model:
// is_pinned: { type: Boolean, default: false }
// pinned_order: { type: Number, default: 0 }
// trending_score: { type: Number, default: 0 }  // computed daily

// New collection: view_logs (for trending)
{
  _id: ObjectId,
  faq_id: ObjectId,
  user_id: ObjectId | null,
  timestamp: Date,
  session_id: String
}
// Index: { faq_id: 1, timestamp: -1 }
// TTL index on timestamp: expire after 90 days
```

### 3.5 Integration Points

- **Admin Dashboard** — New tab "Priority FAQs" and "Credentials"
- **FAQ Hub** — Pinned FAQs appear first in tree and gallery views
- **Auth Middleware** — `authorize()` updated to check `credentials` collection in addition to `User.role`
- **Chatbot** — Trending FAQs are prioritized in chatbot responses
- **Duplicate Detection** — High-priority duplicate clusters flagged first

### 3.6 Acceptance Criteria

| # | Criterion | Metric |
|---|-----------|--------|
| 1 | Admin can issue credential and email reaches recipient in < 30s | E2E |
| 2 | Revoked credential blocks access within 1 minute | Auth test |
| 3 | Trending calculation runs in < 5s for 10K view logs | Performance |
| 4 | Pinned FAQs appear first in all listing views | Visual test |
| 5 | Student-only filter returns correct subset | Unit test |

---

## 4. Moderator Review System

### 4.1 Objective

Establish a moderation workflow where peer answers and suggested FAQ edits are reviewed, validated, and approved by designated moderators before being published globally.

### 4.2 User Workflows

#### 4.2.1 Answer Moderation (Inbound)

```
1. User submits an answer on /community-qa → status = "pending_review"
2. Answer is NOT visible to other users yet
3. Moderator sees pending answers in:
   - /moderate/pending-answers queue (sorted by oldest first)
   - Real-time notification badge in navbar
4. Moderator reviews answer:
   - Can read full question context + user profile
   - Actions: Approve | Reject (with reason) | Request Edit
5. On Approve:
   - Answer becomes visible
   - Original author gets notification
   - If question was unresolved, mark question as "has_approved_answer"
6. On Reject:
   - Answer is soft-deleted (hidden, not removed from DB)
   - Author gets notification with reason
7. On Request Edit:
   - Author gets notification with moderator's suggestions
   - Author can resubmit for re-review
```

#### 4.2.2 FAQ Edit Moderation (Inbound)

```
1. Any authenticated user can suggest an edit to an existing FAQ
   via "Suggest Edit" button on expanded FAQ card
2. Edit suggestion stored as a diff (original vs proposed)
3. Appears in /moderate/pending-faq-edits
4. Moderator can: Accept (applies diff) | Reject | Edit Further
5. On Accept: FAQ is updated, version history preserved, user thanked
```

#### 4.2.3 Moderator Dashboard

```
- /moderate dashboard shows:
  - Queue counts: Pending Answers, Pending FAQ Edits, Pending Re-categorizations
  - Your recent actions (last 50)
  - Average review time
  - Leaderboard (optional, gamification)
- Filters: by category, by date range, by moderator
```

### 4.3 Technical Considerations

| Area | Approach |
|------|----------|
| **Pending state** | Answer model gets `status: "pending_review" | "approved" | "rejected" | "changes_requested"` |
| **Notifications** | Reuse existing Notification model with new `type: "moderation"` |
| **Soft delete** | `is_hidden: Boolean` on Answer, never actually deleted |
| **Versioning** | Optional: store FAQ edit history in a `faq_versions` collection |
| **Auto-approve** | Trusted users (reputation > 100) can bypass moderation via `auto_approve_threshold` |

### 4.4 Database Changes

```javascript
// Update Answer model:
// status: { type: String, enum: ["pending_review", "approved", "rejected", "changes_requested"], default: "pending_review" }
// reviewed_by: { type: ObjectId, ref: "User", default: null }
// reviewed_at: { type: Date }
// rejection_reason: { type: String }
// moderator_notes: { type: String }
// is_hidden: { type: Boolean, default: false }

// New collection: faq_edit_suggestions
{
  _id: ObjectId,
  faq_id: ObjectId,
  suggested_by: ObjectId,
  field: "question" | "answer" | "category" | "tags",
  original_value: String,
  proposed_value: String,
  status: "pending" | "approved" | "rejected",
  reviewed_by: ObjectId | null,
  reviewed_at: Date | null,
  moderator_notes: String,
  created_at: Date
}

// New collection: moderation_actions (audit log)
{
  _id: ObjectId,
  moderator_id: ObjectId,
  action_type: "approve_answer" | "reject_answer" | "approve_faq_edit" | "reject_faq_edit",
  target_id: ObjectId,
  target_type: "Answer" | "FAQEditSuggestion",
  notes: String,
  created_at: Date
}
```

### 4.5 Integration Points

- **Community Hub** — Answers with `status !== "approved"` hidden from non-moderators
- **Admin Dashboard** — New "Moderation" section with queue counts
- **Notifications** — Authors notified on status changes
- **User Model** — `reputation` field used for auto-approve threshold
- **FAQ Edit** — "Suggest Edit" button on FAQ cards in /faq

### 4.6 UI Specifications

```
Moderation Queue (/moderate/pending-answers):
  - Split panel: left = question + answer, right = moderation actions
  - Answer rendered in read-only mode with syntax highlighting
  - Action buttons: large, colored (green=Approve, red=Reject, blue=Request Edit)
  - Rejection reason: textarea (required for reject, optional for edit request)
  - Keyboard shortcuts: A = Approve, R = Reject, E = Request Edit
  - Auto-load next item after action (configurable)

Notification Badge:
  - Navbar: bell icon with count of pending items
  - Polls /api/moderation/queue-count every 30 seconds
  - Click opens dropdown with last 5 pending items + "View All" link
```

### 4.7 Acceptance Criteria

| # | Criterion | Metric |
|---|-----------|--------|
| 1 | Pending answer is invisible to non-moderators within seconds | E2E |
| 2 | Moderator can review + approve an answer in < 3 clicks | Usability |
| 3 | Author receives notification within 1 minute of action | E2E |
| 4 | Queue count badge updates correctly in real time | Integration |
| 5 | Auto-approve works for users above reputation threshold | Unit test |

---

## 5. Duplicate Question Detection & Merging

### 5.1 Objective

Identify duplicate questions in the FAQ database and pending questions queue using text similarity, then allow admins/moderators to merge them with a single click, reducing redundancy.

### 5.2 User Workflows

#### 5.2.1 Automated Detection (Background Job)

```
1. Cron job runs every 6 hours (or on-demand via admin panel)
2. For each question (both FAQ + pending questions):
   a. Normalize text (lowercase, remove stopwords, stem)
   b. Compute TF-IDF vector
   c. Compare against all other questions using cosine similarity
3. Pairs with similarity > 0.85 flagged as "High Confidence Duplicates"
4. Pairs with similarity > 0.70 flagged as "Possible Duplicates"
5. Results stored in duplicate_report collection
6. Admin/moderator notified via dashboard badge
```

#### 5.2.2 Manual Detection (On-Demand)

```
1. On /admin/duplicates page, admin sees:
   - "Run Detection Now" button (triggers sync check)
   - List of existing duplicate groups
   - Search bar to manually find similar questions
2. Admin can manually select 2+ questions and click "Check Similarity"
3. System computes similarity on-the-fly and shows percentage
4. Admin can merge regardless of automated score
```

#### 5.2.3 Merge Workflow

```
1. Admin selects a duplicate pair/group
2. Merge modal shows:
   - Left: Primary question (admin chooses which is canonical)
   - Right: Duplicate(s) to merge
   - Diff view showing any differences in answer content
   - Merge options:
     a. Keep primary answer, discard duplicate answer
     b. Keep longer/more complete answer
     c. Combine both answers (merge text)
3. On confirm:
   - Duplicate question is marked as `is_duplicate_of: primary_id`
   - All view/bookmark counts summed into primary
   - Duplicate's URL redirects to primary (301)
   - Any answers under duplicate are reassigned to primary
   - Notification sent to original authors
```

### 5.3 Technical Considerations

| Area | Approach |
|------|----------|
| **Text Similarity** | `natural` (Node.js) — TF-IDF + cosine similarity. Alternative: `string-similarity` for lightweight. |
| **Background Job** | `node-cron` in-process or Bull queue for production. |
| **Stemming** | `natural` provides Porter stemmer for English. For other languages, use language-specific stemmers or skip. |
| **Stopwords** | `stopword` npm package with multilingual support. |
| **Performance** | Naive O(n²) comparison is fine for < 10K questions. For larger, use MinHash/LSH. |
| **Redirect** | Frontend route `/faq/:id` checks `is_duplicate_of` and redirects. |

### 5.4 Database Changes

```javascript
// Add to Question model:
// is_duplicate: { type: Boolean, default: false }
// duplicate_of: { type: ObjectId, ref: "Question", default: null }
// duplicate_group_id: { type: ObjectId, default: null }
// similarity_scores: [{ question_id: ObjectId, score: Number }]

// Add to FAQ model:
// is_duplicate: { type: Boolean, default: false }
// duplicate_of: { type: ObjectId, ref: "FAQ", default: null }

// New collection: duplicate_reports
{
  _id: ObjectId,
  run_at: Date,
  pairs: [
    {
      question_a: { id: ObjectId, type: "FAQ" | "Question", text: String },
      question_b: { id: ObjectId, type: "FAQ" | "Question", text: String },
      similarity: Number,               // 0-1
      confidence: "high" | "possible",
      reviewed: Boolean,
      merged: Boolean
    }
  ],
  total_pairs: Number,
  high_confidence_count: Number,
  possible_count: Number,
  status: "running" | "complete" | "failed"
}
```

### 5.5 Integration Points

- **Admin Dashboard** — Duplicate detection tab with run/manage UI
- **Community Hub** — Pending questions with high similarity flagged for admin
- **FAQ Hub** — Merged FAQs redirect transparently to canonical
- **Moderation System** — Duplicate detection can auto-flag new questions
- **Priority Tracking** — Duplicate frequency is a signal for trending

### 5.6 UI Specifications

```
Duplicate Management (/admin/duplicates):
  - Top bar: "Run Detection" button + last run timestamp
  - Tabs: "High Confidence" | "Possible" | "Merged History"
  - Each row: Question A ↔ Question B with similarity % badge
  - Color: green (>85%), yellow (70-85%), gray (<70%)
  - Expand row: shows full text of both questions side-by-side
  - Action: "Merge" button opens modal

Merge Modal:
  - Radio buttons to select primary (canonical) question
  - Side-by-side diff view
  - "Merge Answers" radio: Keep Primary | Keep Longer | Combine
  - Preview of merged result
  - Confirm button (with undo option — soft merge only)
```

### 5.7 Acceptance Criteria

| # | Criterion | Metric |
|---|-----------|--------|
| 1 | Detection run completes for 5K questions in < 30s | Performance |
| 2 | Merge operation completes in < 2s | Performance |
| 3 | Redirect from duplicate to canonical works | E2E |
| 4 | All answers from duplicate reassigned correctly | Data integrity |
| 5 | No false positive rate > 5% on high-confidence | Manual spot-check |

---

## 6. Integration Matrix

How the five features connect and depend on each other:

| Feature | Depends On | Provides Data To | Shared Components |
|---------|-----------|-----------------|-------------------|
| Chatbot | FAQ collection, Translation cache | Trending signals for Priority Tracking | Search endpoint, Session storage |
| Pictorial DB | Category model, FAQ model | Category list for all dropdowns | Category select component |
| Admin Credentials | Auth middleware, User model | Role checks for Moderator System | JWT middleware |
| Moderator Review | Answer model, Notification model | Approved content → FAQ collection | Notification component, Queue badge |
| Duplicate Detection | FAQ model, Question model | Merge candidates for Admin | FAQ detail view, Merge modal |

### 6.1 Data Flow Diagram (Text)

```
[User] → [Chatbot] ──→ [FAQ Search] ──→ [MongoDB FAQs]
                        ↓
                   [No Match] → [/raise-query]

[User] → [Submit Answer] → status: pending_review
                            ↓
                    [Moderator Queue] → Approve → status: approved → visible to all
                                        → Reject  → author notified

[Admin] → [Run Duplicate Detection] → [natural TF-IDF] → [duplicate_reports]
           ↓
        [Merge Modal] → Updates FAQ/Question → Redirects setup

[Admin] → [Issue Credential] → [credentials collection] → [Auth checks]

[System] → [Cron: Trending] → [view_logs] → [FAQ.trending_score]
```

---

## 7. Cross-Cutting Concerns

### 7.1 Performance

| Feature | Expected Load | Mitigation |
|---------|--------------|------------|
| Chatbot | 100 concurrent users | Rate limit, cache translations |
| OCR | 50 images/hour | Queue processing, max 5MB |
| Duplicate Detection | 1 run/6 hours | Background job, not user-facing |
| Moderation Queue | < 10 pending at any time | Real-time, no caching needed |

### 7.2 Security

- **OCR images**: Sanitize filenames, validate MIME types, scan for malware (ClamAV optional)
- **Credential system**: All special credentials logged in audit trail; revoked immediately
- **Moderation bypass**: Only users with `role: "admin"` or valid `credential` can access `/moderate/*`
- **Duplicates**: Merge is a soft operation (reversible) for first 30 days

### 7.3 Accessibility

- All interactive elements keyboard-navigable
- Chatbot messages support screen readers (aria-live)
- Image OCR results include alt text
- Color-coded priority badges include text labels (not color-only)
- Language selector uses native `<select>` for screen reader compatibility

### 7.4 Mobile Responsiveness

| Feature | Mobile Behavior |
|---------|----------------|
| Chatbot | Full-screen chat panel, input bar at bottom with keyboard handling |
| Gallery View | Single column, cards full width |
| Moderation Queue | Stacked layout (question above, actions below) |
| Merge Modal | Full-screen modal on mobile |

### 7.5 Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | Moderator Review System | 3-4 days | High — content quality |
| P0 | Duplicate Detection | 2-3 days | High — reduces redundancy |
| P1 | Admin Credentials & Priority | 2-3 days | Medium — admin efficiency |
| P1 | Enhanced Database (OTHERS + Gallery) | 2-3 days | Medium — UX improvement |
| P2 | Multi-lingual Chatbot | 5-7 days | High — user engagement but complex |

---

*End of Feature Specification v2.0*
