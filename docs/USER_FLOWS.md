# MovieChoice — User Flows

> **Purpose:** This document defines the detailed user flows for MovieChoice v1. It covers every interaction path from onboarding to recommendation, including edge cases and error states.
>
> **Scope:** Covers Quick Pick flow, Explore flow, onboarding, household profile management, taste signal collection, AI refinement, and saved lists.
>
> **Dependencies:** [PRD.md](./PRD.md) — Product Requirements Document
>
> **Source Documents:** [DISCOVERY.md](./DISCOVERY.md), [PRODUCT.md](./PRODUCT.md), [PRD.md](./PRD.md)

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1-draft |
| **Status** | Draft |
| **Owner** | Ashwani |
| **Last Updated** | 2026-07-23 |
| **Source Documents** | [DISCOVERY.md](./DISCOVERY.md), [PRODUCT.md](./PRODUCT.md), [PRD.md](./PRD.md) |

---

## 1. Flow Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        User Entry Points                        │
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ First Visit │    │ Returning    │    │ Guest (No Account)│   │
│  │ (Anonymous) │    │ User         │    │                  │   │
│  └──────┬──────┘    └──────┬───────┘    └────────┬─────────┘   │
│         │                  │                      │            │
│         ▼                  ▼                      ▼            │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Profile Selection Screen               │       │
│  │  "Who's watching?"                                  │       │
│  └─────────────────────────────────────────────────────┘       │
│                     │            │            │                  │
│         ┌───────────┤            │            ├─────────┐       │
│         ▼            ▼            ▼            ▼           ▼       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Profile  │ │ Profile  │ │ Profile  │ │ Continue │       │
│  │ 1        │ │ 2        │ │ 3        │ │ as Guest │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└──────────────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Quick Pick Flow   │
              │   (Main Path)       │
              └─────────────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
      ┌──────────────┐    ┌────────────────┐
      │  Explore Mode │    │  AI Refinement │
      └──────────────┘    └────────────────┘
```

---

## 2. Quick Pick Flow (Hero Path)

### 2.1 Flow Diagram

```
┌─────────────┐
│  Screen 1:  │
│  Who's      │
│  Watching?  │
└──────┬──────┘
       │ Select profile
       ▼
┌─────────────┐
│  Screen 2:  │
│  What Mood  │
│  Are You    │
│  In?        │
└──────┬──────┘
       │ Select mood(s)
       ▼
┌─────────────┐
│  Screen 3:  │
│  How Much   │
│  Time Do    │
│  You Have?  │
└──────┬──────┘
       │ Select time
       ▼
┌─────────────┐
│  Screen 4:  │
│  Streaming   │
│  Services?   │
└──────┬──────┘
       │ Confirm services
       ▼
┌─────────────┐
│  Screen 5:  │
│  Recommendation│
│  Result      │
└─────────────┘
```

### 2.2 Step-by-Step Flow

#### Step 1: Who's Watching?

**Screen:** Profile Selection

**Entry Points:**
- First visit (no session)
- Returning user opens app
- User signs in

**UI Elements:**
- Profile cards (avatar + name) as large tappable tiles
- "Continue as Guest" button
- "Sign Up" button (for guests)
- "Create Profile" button (if no profiles exist)
- "Add Profile" button (if < 8 profiles)

**Flow:**
1. User sees available household profiles
2. User taps a profile card
3. App loads profile data (subscriptions, taste signals)
4. App transitions to Mood selection

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| No profiles exist | Show "Create your first profile" CTA |
| Guest user | Show "Continue as Guest" + "Sign Up" |
| Profile deleted by owner | Show "Profile no longer available" → return to profile list |
| Profile count = 8 | Hide "Add Profile", show "Manage profiles" link |

**Data Loaded:**
```json
{
  "profiles": [
    {
      "id": "prof_001",
      "name": "Ashwani",
      "avatar": "robot",
      "isPrimary": true,
      "subscriptions": ["netflix", "prime"]
    }
  ]
}
```

---

#### Step 2: What Mood Are You In?

**Screen:** Mood Selection

**UI Elements:**
- Grid of large mood cards (icon + label)
- "Next" button (enabled when ≥ 1 mood selected)
- "Back" button
- Selected mood count badge (e.g., "2/3 selected")

**Mood Options:**
| Mood | Icon | Description |
|------|------|-------------|
| Uplifting | ☀️ | Feel-good, positive energy |
| Suspenseful | 🕵️ | Tension, thrill, edge-of-seat |
| Feel-Good | 💛 | Warm, heartwarming |
| Mind-Bending | 🧠 | Complex, thought-provoking |
| Dark | 🌑 | Gritty, serious, intense |
| Relaxing | 🧘 | Light, easygoing, unwind |
| Emotional | 💧 | Moving, tear-jerker |
| Adventurous | 🗺️ | Exciting, action-packed |

**Flow:**
1. User sees mood grid
2. User taps to select mood(s) (1-3)
3. User taps "Next"
4. App transitions to Time selection

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| User taps same mood twice | Deselects it |
| User selects 3 moods, taps more | Shows "Maximum 3 moods" toast |
| User presses "Back" | Returns to profile selection |

---

#### Step 3: How Much Time Do You Have?

**Screen:** Time Selection

**UI Elements:**
- Large time cards with visual indicators
- "Next" button
- "Back" button

**Time Options:**
| Option | Label | Runtime Range | Visual |
|--------|-------|---------------|--------|
| `under30` | "Under 30 min" | 0-30 min | ⏱️ |
| `under90` | "Under 90 min" | 30-90 min | 📺 |
| `90-120` | "Movie Night" | 90-120 min | 🎬 |
| `2plus` | "Marathon" | 120+ min | 🍿 |

**Flow:**
1. User sees time options
2. User taps a time option
3. User taps "Next"
4. App transitions to Services confirmation

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| User presses "Back" | Returns to mood selection |
| No titles match selected time | Shows "No results" → offer to broaden |

---

#### Step 4: Streaming Services

**Screen:** Services Confirmation

**UI Elements:**
- "My Services" toggle (default)
- "All Services" toggle option
- Service icons/logos as visual indicators
- "Get Recommendation" button
- "Back" button

**Flow:**
1. User sees pre-filled subscriptions from profile
2. User can toggle "All Services" to broaden
3. User taps "Get Recommendation"
4. App generates recommendation

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| No subscriptions set | Prompt user to add at least one |
| User toggles "All Services" | Shows warning: "This includes titles from all services" |

---

#### Step 5: Recommendation Result

**Screen:** Recommendation Display

**UI Elements:**
- Large poster image
- Title, year, rating
- Runtime, genres
- Available services (icons)
- "Why recommended" explanation text
- Action buttons: "Save", "Not Quite Right", "Refine with AI"
- "Watch Now" button (if deep-link available)

**Flow:**
1. Recommendation appears with animation
2. User reads explanation
3. User takes action:
   - **Save** → Add to saved list
   - **Not Quite Right** → Re-generate with same filters
   - **Refine with AI** → Open AI refinement input
   - **Watch Now** → Navigate to provider (deep-link or info)

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| No results match filters | Show "No results" with "Broaden search" CTA |
| AI unavailable | Disable "Refine with AI", show deterministic re-generation |
| Guest user saves | Prompt "Sign up to save your picks" |

---

## 3. AI Refinement Flow

### 3.1 Flow Diagram

```
┌─────────────────────┐
│  Any Quick Pick     │
│  Screen             │
└──────────┬──────────┘
           │ Tap "Refine with AI"
           ▼
┌─────────────────────┐
│  AI Input Overlay   │
│  (Bottom Sheet)     │
│                     │
│  "Tell me more..."  │
│  [________________] │
│                     │
│  [Cancel] [Send]    │
└──────────┬──────────┘
           │ Tap Send
           ▼
┌─────────────────────┐
│  AI Processing      │
│  (Loading State)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  New Recommendation │
│  + Refined Context  │
└─────────────────────┘
```

### 3.2 AI Refinement Examples

| User Input | Parsed Parameters |
|------------|-------------------|
| "I loved The Bear but want something lighter" | mood: ["light", "comedy"], exclude: ["drama"] |
| "My wife hates horror" | excludeGenres: ["horror"] |
| "Nothing with subtitles" | exclude: ["subtitled"] |
| "Only movies under two hours" | time: "under120", titleType: "movie" |
| "Give me something underrated" | boost: ["hiddenGems"] |
| "Something from the 90s" | releaseYearRange: [1990, 1999] |

### 3.3 Edge Cases

| Scenario | Behavior |
|----------|----------|
| AI returns no results | Show "No results found" → offer to revert to original |
| AI times out | Show "Try again" button |
| Empty input | Show "Please type your refinement" error |
| Invalid input (nonsensical) | Show "I didn't quite get that — try again" |

---

## 4. Explore Flow

### 4.1 Flow Diagram

```
┌─────────────────────┐
│  User navigates to  │
│  Explore mode       │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Explore Home       │
│  (Tabs)             │
│                     │
│  [Collections]      │
│  [Friday Picks]     │
│  [Hidden Gems]      │
│  [Trending]         │
│  [Award Winners]    │
│  [Curated Lists]    │
└──────────┬──────────┘
           │ Tap tab
           ▼
┌─────────────────────┐
│  Tab Content        │
│  (Scrollable Grid)  │
└──────────┬──────────┘
           │ Tap item
           ▼
┌─────────────────────┐
│  Title Detail       │
│  (Same as Quick     │
│   Pick result)      │
└─────────────────────┘
```

### 4.2 Explore Tab Content

#### Collections Tab
- Horizontal scrollable cards
- Each card: poster image + collection name
- Tap → show collection items grid

#### Friday Picks Tab
- Weekly curated picks (updated every Friday)
- Each pick: poster + title + pick reason
- Tap → title detail

#### Hidden Gems Tab
- Underrated titles with high match score
- Each item: poster + title + gem score badge
- Tap → title detail

#### Trending Tab
- Titles gaining traction
- Each item: poster + title + trend score badge
- Tap → title detail

#### Award Winners Tab
- Academy Award, Golden Globe winners
- Each item: poster + title + awards list
- Tap → title detail

#### Curated Lists Tab
- Editor-selected lists by genre/decade/director
- Each item: cover image + list name + item count
- Tap → list items grid

---

## 5. Onboarding Flow

### 5.1 Flow Diagram

```
┌─────────────────────┐
│  User signs in via  │
│  Google or Email    │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Welcome Screen     │
│  "Let's set up     │
│   your profile"     │
│                     │
│  [Continue] [Skip]  │
└──────────┬──────────┘
           │ Continue
           ▼
┌─────────────────────┐
│  Create Profile     │
│  Name + Avatar      │
└──────────┬──────────┘
           │ Save
           ▼
┌─────────────────────┐
│  Select Subscriptions│
│  (Tap to toggle)    │
│                     │
│  [Netflix] [Prime]  │
│  [Disney+] [Max]    │
│  [Hulu] [Peacock]   │
│  [More...]          │
└──────────┬──────────┘
           │ Save
           ▼
┌─────────────────────┐
│  Taste Bootstrap    │
│  (Optional)         │
│                     │
│  "Pick 3 favorites" │
│  [Movie grid...]    │
└──────────┬──────────┘
           │ Save / Skip
           ▼
┌─────────────────────┐
│  First Quick Pick   │
│  Recommendation     │
└─────────────────────┘
```

### 5.2 Onboarding Steps

| Step | Screen | Required | Data Captured |
|------|--------|----------|---------------|
| 1 | Welcome | Optional | N/A |
| 2 | Create Profile | Yes | name, avatar |
| 3 | Subscriptions | Optional | subscriptions[] |
| 4 | Taste Bootstrap | Optional | tasteSignals[] |

### 5.3 Edge Cases

| Scenario | Behavior |
|----------|----------|
| User skips onboarding | Take to Quick Pick with generic experience |
| User skips subscriptions | Show "Add subscriptions" banner on profile |
| User skips taste bootstrap | Take to Quick Pick; prompt "Add favorites in Settings" |

---

## 6. Household Profile Management Flow

### 6.1 Flow Diagram

```
┌─────────────────────┐
│  Settings →         │
│  Household Profiles │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Profile List       │
│  (Scrollable)       │
│                     │
│  [Avatar] Name  ··  │  ← Manage menu
│  [Avatar] Name  ··  │
│  [+ Add Profile]    │
└──────────┬──────────┘
           │ Tap "·"
           ▼
┌─────────────────────┐
│  Manage Menu        │
│                     │
│  [Edit Profile]     │
│  [Set as Primary]   │
│  [Delete]           │
└─────────────────────┘
```

### 6.2 Profile Management Actions

| Action | Description |
|--------|-------------|
| **Edit Profile** | Change name, avatar, subscriptions |
| **Set as Primary** | Make this the default profile |
| **Delete** | Remove profile (confirms before delete) |
| **Add Profile** | Create new household profile |

### 6.3 Edge Cases

| Scenario | Behavior |
|----------|----------|
| Profile count = 8 | Disable "Add Profile", show "Maximum reached" |
| Delete primary profile | Auto-promote another as primary |
| Delete profile with taste data | Keep taste data (for analytics), unlink from profile |

---

## 7. Taste Signal Collection Flow

### 7.1 Flow Diagram

```
┌─────────────────────┐
│  Recommendation     │
│  Result Screen      │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌────────┐
│ Thumbs │  │ Save   │
│  Up    │  │  (+)   │
└───┬────┘  └───┬────┘
    │           │
    ▼           ▼
┌────────┐  ┌────────┐
│ Thumbs │  │ Saved  │
│ Down   │  │ List   │
└───┬────┘  └────────┘
    │
    ▼
┌─────────────────────┐
│  Rating Modal       │
│  (Optional follow)  │
│                     │
│  ★ ★ ★ ★ ★         │
└─────────────────────┘
```

### 7.2 Taste Signal Types

| Signal | Trigger | Storage |
|--------|---------|---------|
| Thumbs Up | Tap thumbs-up on result | TasteSignals(type: thumbs_up) |
| Thumbs Down | Tap thumbs-down on result | TasteSignals(type: thumbs_down) |
| Rating | Tap star rating | TasteSignals(type: rating, value: 1-5) |
| Seen It | Mark in Settings | TasteSignals(type: seen) |
| Favorite | Add to favorites list | TasteSignals(type: favorite) |

---

## 8. Saved Lists Flow

### 8.1 Flow Diagram

```
┌─────────────────────┐
│  Saved Lists        │
│  Screen             │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌────────┐
│ View   │  │ Create │
│ List   │  │ List   │
└───┬────┘  └───┬────┘
    │           │
    ▼           ▼
┌────────┐  ┌────────┐
│ List   │  │ Name   │
│ Items  │  │ Input  │
│ Grid   │  └────────┘
└───┬────┘
    │
    ▼
┌─────────────────────┐
│  Item Actions       │
│  (Per item)         │
│                     │
│  [View] [Save]      │
│  [Remove]           │
└─────────────────────┘
```

### 8.2 Default Lists

| List Name | Auto-Created | Description |
|-----------|--------------|-------------|
| "Watch Tonight" | Yes | Default list for quick access |
| "Watchlist" | Yes | General watchlist |
| Custom lists | User | User-created lists |

---

## 9. Error States

### 9.1 Error Handling by Flow

| Flow | Error | Display | Recovery |
|------|-------|---------|----------|
| Quick Pick | No results | "No results found" card | "Broaden search" button |
| Quick Pick | API failure | "Something went wrong" banner | "Try again" button |
| AI Refinement | AI unavailable | "AI temporarily unavailable" | Revert to deterministic |
| AI Refinement | Network error | "Connection error" banner | "Retry" button |
| Explore | Load failure | Empty state + "Reload" | "Reload" button |
| Onboarding | Auth failure | "Sign-in failed" banner | "Try again" |
| Profile | Delete failure | "Could not delete" toast | N/A |
| Taste Signal | Save failure | "Could not save" toast | Retry automatically |

### 9.2 Offline Behavior

| Scenario | Behavior |
|----------|----------|
| No connection + cached data | Show cached recommendations |
| No connection + no cache | Show "Go online for recommendations" |
| Connection restored | Auto-refresh cached data |

---

## Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | **Mood options** — What is the final set of mood options? | Quick Pick UI design | Ashwani |
| 2 | **Friday Picks definition** — Editor-curated or algorithmic? | Explore mode implementation | Ashwani |
| 3 | **Default saved lists** — What are the default list names? | Saved lists implementation | Ashwani |
| 4 | **Playback hand-off** — Deep-link or informational? | Quick Pick result end-flow | Ashwani |
| 5 | **Time-to-first-value target** — Specific metric for first-time users? | Performance requirements | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — flows implement product decisions |
| [PRODUCT.md](./PRODUCT.md) | Product vision — flows support Quick Pick, Explore |
| [PRD.md](./PRD.md) | Product requirements — flows implement REQ-100, REQ-200, REQ-300 series |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture — flows consume API endpoints |
| [DATABASE.md](./DATABASE.md) | Database design — flows create/read these collections |
| [API.md](./API.md) | API contract — flows call these endpoints |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Design tokens — flows use these components |