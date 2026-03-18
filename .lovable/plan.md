

## Plan: Fix Video Player Black Overlay and Add Branding Text

### Step 1: Fix Internal Error

The error `51cbb5b5ee87a21fb9175e3121f6b440` is a Lovable internal build/preview error. No matching code exists in the codebase. The app code itself compiles correctly. I'll trigger a clean rebuild by making a minor safe edit (e.g., whitespace in `App.tsx`) to clear any stale build cache.

### Step 2: Remove Black Shadow Overlays and Add "Lovable Developer" Text

From the screenshots, the black bar at the bottom of the video player is caused by three explicit black `div` elements in **`MahimaGhostPlayer.tsx`** (lines 721-726):

```text
Line 722: bottom strip   → height: 56px, background: #000
Line 724: right blocker  → width: 200px, height: 56px, background: #000  
Line 726: left blocker   → width: 120px, height: 56px, background: #000
```

These cover YouTube's native controls. The same pattern exists in:
- **`StudentVideoPlayer.tsx`** — bird logo + white pill overlay (lines ~95-110)
- **`LivePlayer.tsx`** — bird logo + white pill overlay (lines ~60-75)
- **`UnifiedVideoPlayer.tsx`** — `BrandingOverlay` component + black blockers for Archive/Vimeo (lines 112-131, 165-179)

**Changes across all four files:**

1. **Remove** the three black `#000` blocker divs in `MahimaGhostPlayer.tsx`
2. **Remove** the bird logo and "Naveen Bharat" white pill overlays from all players
3. **Replace** with a single clean "lovable developer" text label positioned at the bottom of the video — white text, semi-transparent background, clean readable font
4. Apply the same treatment to `StudentVideoPlayer.tsx`, `LivePlayer.tsx`, and the `BrandingOverlay` in `UnifiedVideoPlayer.tsx`

### Files to Edit

| File | Change |
|------|--------|
| `src/components/video/MahimaGhostPlayer.tsx` | Remove 3 black blocker divs (lines 721-726), remove bird logo (691-700) and white pill (702-719), add "lovable developer" text |
| `src/components/video/StudentVideoPlayer.tsx` | Remove bird logo + white pill overlays, add "lovable developer" text |
| `src/components/video/UnifiedVideoPlayer.tsx` | Update `BrandingOverlay` to show "lovable developer", remove black blocker divs for Archive/Vimeo |
| `src/components/live/LivePlayer.tsx` | Remove bird logo + white pill overlays, add "lovable developer" text |

