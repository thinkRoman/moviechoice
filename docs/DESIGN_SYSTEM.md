# MovieChoice — Design System

> **Purpose:** This document defines the design system for MovieChoice v1. It covers design tokens, component library, color palette, typography, responsive breakpoints, accessibility standards, and PWA-specific behaviors.
>
> **Scope:** Covers all visual and interaction design standards for the mobile-first PWA.
>
> **Dependencies:** [ARCHITECTURE.md](./ARCHITECTURE.md) — System Architecture
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

## 1. Design Principles

| Principle | Application |
|-----------|-------------|
| **Speed-first design** | Every screen loads instantly; no loading spinners on the default path |
| **Thumb-friendly** | Primary actions within thumb reach zone on mobile |
| **Card-based hierarchy** | All content presented as cards; visual hierarchy through size and spacing |
| **Minimal chrome** | Navigation and controls disappear when not needed |
| **Warm, confident tone** | Copy and microcopy feels like a trusted friend, not a search engine |
| **Motion with purpose** | Animations guide attention, never waste time |

---

## 2. Design Tokens

### 2.1 Color Palette

#### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#F5F3FF` | Background tints |
| `primary-100` | `#EDE9FE` | Hover backgrounds |
| `primary-500` | `#7C3AED` | Primary buttons, active states |
| `primary-600` | `#6D28D9` | Primary buttons pressed |
| `primary-700` | `#5B21B6` | Primary text (dark mode) |
| `primary-900` | `#3B0764` | Dark backgrounds |

#### Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | `#FAFAFA` | Page background (light) |
| `neutral-100` | `#F4F4F5` | Card background (light) |
| `neutral-200` | `#E4E4E7` | Borders, dividers |
| `neutral-300` | `#D4D4D8` | Disabled states |
| `neutral-500` | `#71717A` | Secondary text |
| `neutral-700` | `#27272A` | Primary text |
| `neutral-900` | `#09090B` | Headings, dark backgrounds |

#### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success-500` | `#22C55E` | Positive feedback |
| `success-50` | `#F0FDF4` | Success backgrounds |
| `warning-500` | `#F59E0B` | Warning states |
| `warning-50` | `#FFFBEB` | Warning backgrounds |
| `error-500` | `#EF4444` | Error states |
| `error-50` | `#FEF2F2` | Error backgrounds |
| `info-500` | `#3B82F6` | Informational states |
| `info-50` | `#EFF6FF` | Info backgrounds |

#### Streaming Service Colors

| Service | Color | Usage |
|---------|-------|-------|
| Netflix | `#E50914` | Service icon, brand recognition |
| Prime Video | `#00A8E1` | Service icon, brand recognition |
| Disney+ | `#113CCF` | Service icon, brand recognition |
| Max | `#002BE7` | Service icon, brand recognition |
| Hulu | `#1CE783` | Service icon, brand recognition |
| Peacock | `#007CC1` | Service icon, brand recognition |
| Paramount+ | `#0064FF` | Service icon, brand recognition |
| Crunchyroll | `#F47521` | Service icon, brand recognition |
| AMC+ | `#0A1E3C` | Service icon, brand recognition |

### 2.2 Typography

#### Font Family

| Role | Font | Fallback |
|------|------|----------|
| Primary | `Inter`, system-ui, sans-serif | System default |
| Monospace | `JetBrains Mono`, monospace | Code displays |

#### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display` | 48px / 3rem | 800 | 1.1 | Hero titles (rare) |
| `heading-1` | 36px / 2.25rem | 700 | 1.2 | Page titles |
| `heading-2` | 30px / 1.875rem | 700 | 1.2 | Section headers |
| `heading-3` | 24px / 1.5rem | 600 | 1.3 | Card titles |
| `heading-4` | 20px / 1.25rem | 600 | 1.4 | Sub-section headers |
| `body-large` | 18px / 1.125rem | 400 | 1.6 | Primary body text |
| `body` | 16px / 1rem | 400 | 1.5 | Standard body text |
| `body-small` | 14px / 0.875rem | 400 | 1.5 | Secondary text, captions |
| `caption` | 12px / 0.75rem | 400 | 1.4 | Labels, metadata |
| `button` | 16px / 1rem | 600 | 1 | Button text |

#### Text Roles

| Role | Token | Weight | Color |
|------|-------|--------|-------|
| Primary text | `body-large` | 400 | `neutral-900` (light) / `neutral-50` (dark) |
| Secondary text | `body` | 400 | `neutral-500` |
| Tertiary text | `body-small` | 400 | `neutral-300` |
| Heading | `heading-3` | 600 | `neutral-900` (light) / `neutral-50` (dark) |
| Link | `body` | 400 | `primary-600` |
| Button | `button` | 600 | `neutral-50` (on primary) |

### 2.3 Spacing

#### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-1` | 4px | Micro spacing (icon to text) |
| `spacing-2` | 8px | Small spacing (padding) |
| `spacing-3` | 12px | Medium spacing |
| `spacing-4` | 16px | Standard spacing unit |
| `spacing-5` | 20px | Component gaps |
| `spacing-6` | 24px | Section padding |
| `spacing-8` | 32px | Section gaps |
| `spacing-10` | 40px | Layout gaps |
| `spacing-12` | 48px | Page padding |
| `spacing-16` | 64px | Page margins |

#### Spacing Rules

| Element | Rule |
|---------|------|
| Card padding | `spacing-4` |
| Card gap | `spacing-4` |
| Section padding | `spacing-8` mobile / `spacing-12` desktop |
| Button padding | `spacing-4` horizontal, `spacing-3` vertical |
| Input padding | `spacing-3` horizontal, `spacing-3` vertical |

### 2.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Input fields, small cards |
| `radius-md` | 12px | Standard cards |
| `radius-lg` | 16px | Large cards, modals |
| `radius-xl` | 24px | Poster cards, hero sections |
| `radius-full` | 9999px | Avatar circles, pill badges |

### 2.5 Shadows

| Token | Shadow | Usage |
|-------|--------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Card elevation |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modal elevation |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Overlay elevation |

### 2.6 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | 0 | Default content |
| `z-sticky` | 10 | Sticky headers |
| `z-dropdown` | 100 | Dropdown menus |
| `z-modal` | 200 | Modals |
| `z-overlay` | 300 | Full-screen overlays |
| `z-toast` | 400 | Toast notifications |

---

## 3. Component Library (shadcn/ui)

### 3.1 Core Components

| Component | Usage in MovieChoice |
|-----------|---------------------|
| `Button` | Primary actions (Next, Get Recommendation, Save) |
| `Card` | Profile cards, mood cards, time cards, recommendation results |
| `Input` | AI refinement input, search |
| `Select` | Service selection, filters |
| `Checkbox` | Subscription selection during onboarding |
| `RadioGroup` | Profile selection (if needed) |
| `Slider` | Time range (if needed) |
| `Tabs` | Explore mode tabs |
| `Dialog` | Confirmation dialogs, rating modal |
| `Toast` | Success/error feedback |
| `Avatar` | Household profile avatars |
| `Badge` | Gem score, trend score, service badges |
| `Skeleton` | Loading placeholders |
| `Separator` | Visual dividers |
| `Tooltip` | Help text, metadata |

### 3.2 Custom Components

#### ProfileCard

| Property | Value |
|----------|-------|
| Purpose | Display household profile for selection |
| Props | `name`, `avatar`, `isPrimary`, `onClick` |
| Size | 120px × 120px (mobile), 100px × 100px (desktop) |
| Radius | `radius-full` |

#### MoodCard

| Property | Value |
|----------|-------|
| Purpose | Display mood option for selection |
| Props | `icon`, `label`, `isSelected`, `onClick` |
| Size | 100px × 80px |
| Radius | `radius-lg` |
| States | default, selected, disabled |

#### TimeCard

| Property | Value |
|----------|-------|
| Purpose | Display time option for selection |
| Props | `icon`, `label`, `range`, `isSelected`, `onClick` |
| Size | 140px × 80px |
| Radius | `radius-lg` |
| States | default, selected, disabled |

#### ServiceBadge

| Property | Value |
|----------|-------|
| Purpose | Display streaming service icon |
| Props | `serviceId`, `serviceName`, `isSelected`, `onClick` |
| Size | 48px × 48px |
| Radius | `radius-md` |
| States | default, selected, disabled |

#### RecommendationCard

| Property | Value |
|----------|-------|
| Purpose | Display recommendation result |
| Props | `title`, `posterUrl`, `rating`, `runtime`, `genres`, `availability`, `why`, `onSave`, `onRefine` |
| Size | Full width (mobile), 360px (desktop) |
| Radius | `radius-xl` |
| States | default, loading, error |

#### PosterCard

| Property | Value |
|----------|-------|
| Purpose | Display title poster in Explore mode |
| Props | `title`, `posterUrl`, `rating`, `overlayInfo` |
| Size | 160px × 240px (mobile), 200px × 300px (desktop) |
| Radius | `radius-lg` |
| States | default, hover (desktop), loading |

---

## 4. Responsive Breakpoints

### 4.1 Breakpoints

| Name | Width | Device |
|------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets (portrait) |
| `lg` | 1024px | Tablets (landscape), small desktops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

### 4.2 Layout by Breakpoint

| Breakpoint | Quick Pick | Explore | Cards |
|------------|------------|---------|-------|
| `sm` (mobile) | Full-width vertical | Full-width tabs | Single column |
| `md` (tablet) | Full-width vertical | Tabs → Grid | 2-column grid |
| `lg` (desktop) | Centered (max 480px) | Grid layout | 3-column grid |
| `xl` (desktop) | Centered (max 480px) | Grid layout | 4-column grid |

### 4.3 Mobile-First Rules

| Rule | Value |
|------|-------|
| Default | Mobile styles |
| `md:` | Tablet adjustments |
| `lg:` | Desktop adjustments |
| `xl:` | Large desktop adjustments |

---

## 5. Accessibility

### 5.1 WCAG 2.1 AA Requirements

| Requirement | Target |
|-------------|--------|
| **Color contrast** | 4.5:1 minimum for normal text, 3:1 for large text |
| **Focus indicators** | Visible focus ring on all interactive elements |
| **Touch targets** | Minimum 44px × 44px |
| **Screen reader** | All images have alt text; all buttons have labels |
| **Keyboard navigation** | Full keyboard support for all flows |
| **Reduced motion** | Respect `prefers-reduced-motion` |

### 5.2 Focus Ring

| Token | Value |
|-------|-------|
| `focus-ring` | `0 0 0 3px rgba(124, 58, 237, 0.4)` |

### 5.3 Dark Mode

| Aspect | Approach |
|--------|----------|
| Detection | `prefers-color-scheme` media query |
| Background | `neutral-950` page, `neutral-900` cards |
| Text | `neutral-50` primary, `neutral-400` secondary |
| Accent | `primary-400` for interactive elements |

---

## 6. Motion & Animation

### 6.1 Animation Tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `motion-fast` | 150ms | `ease-out` | Hover states, micro-interactions |
| `motion-normal` | 300ms | `ease-in-out` | Card transitions, modal open/close |
| `motion-slow` | 500ms | `ease-in-out` | Page transitions, hero animations |

### 6.2 Animation Rules

| Element | Animation |
|---------|-----------|
| Recommendation card | Fade in + slide up (300ms) |
| Mood/Time cards | Scale on select (150ms) |
| Profile cards | Scale on select (150ms) |
| Modal/dialog | Fade in + scale (300ms) |
| Toast notification | Slide in from bottom (300ms) |
| Skeleton loader | Shimmer (1500ms infinite) |
| Button press | Scale down (100ms) |

### 6.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. PWA-Specific Design

### 7.1 Install Prompt

| Property | Value |
|----------|-------|
| Trigger | After first Quick Pick or sign-up |
| Position | Bottom sheet |
| Copy | "Add MovieChoice to your home screen for the best experience" |
| CTA | "Add to Home Screen" / "Not now" |

### 7.2 Offline State

| Property | Value |
|----------|-------|
| Background | `neutral-100` / `neutral-900` |
| Icon | MovieChoice logo (simplified) |
| Copy | "You're offline. Cached recommendations are available." |
| CTA | "Go online for new recommendations" |

### 7.3 Splash Screen

| Property | Value |
|----------|-------|
| Background | `primary-900` |
| Logo | MovieChoice wordmark (white) |
| Animation | Fade in (500ms) |

### 7.4 Manifest Configuration

```json
{
  "name": "MovieChoice — What Should We Watch Tonight?",
  "short_name": "MovieChoice",
  "description": "Eliminate streaming decision fatigue with personalized recommendations",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#3B0764",
  "theme_color": "#3B0764",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 8. Iconography

### 8.1 Icon Library

| Library | Usage |
|---------|-------|
| **lucide-react** | All app icons |

### 8.2 Icon Sizes

| Size | Value | Usage |
|------|-------|-------|
| `sm` | 16px | Inline icons, badges |
| `md` | 20px | Standard icons |
| `lg` | 24px | Card icons, navigation |
| `xl` | 32px | Hero icons |
| `2xl` | 48px | Empty states |

### 8.3 Key Icons (Lucide)

| Icon | Usage |
|------|-------|
| `Search` | Explore search |
| `Heart` | Save/favorite |
| `ThumbsUp` | Thumbs up |
| `ThumbsDown` | Thumbs down |
| `Star` | Rating |
| `Clock` | Time filter |
| `Film` | Movie type |
| `TV` | TV show type |
| `ChevronRight` | Navigation |
| `ChevronLeft` | Back navigation |
| `Menu` | Navigation menu |
| `User` | Profile |
| `Settings` | Settings |
| `Sparkles` | AI refinement |
| `RefreshCw` | Re-generate |
| `ExternalLink` | Watch now / deep-link |
| `X` | Close |
| `Plus` | Add |
| `Trash2` | Delete |
| `Check` | Confirm |

---

## Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | **Avatar options** — What avatars for household profiles? | Profile card design | Ashwani |
| 2 | **Empty state illustrations** — Custom or icon-based? | Explore mode design | Ashwani |
| 3 | **Brand wordmark** — Final MovieChoice logo/wordmark? | Splash screen, PWA manifest | Ashwani |
| 4 | **Dark mode trigger** — System preference or user toggle? | Design system implementation | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — design implements product principles |
| [PRODUCT.md](./PRODUCT.md) | Product vision — design supports "trusted friend" tone |
| [PRD.md](./PRD.md) | Product requirements — design implements REQ-700 series (PWA) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture — PWA deployment on Vercel |
| [USER_FLOWS.md](./USER_FLOWS.md) | User flows — design provides components for each screen |