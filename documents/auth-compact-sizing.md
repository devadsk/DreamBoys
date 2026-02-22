# Auth Pages - Compact Mobile Sizing

## Size Comparison: Before vs After

### Tablet (768px)

| Element | Before | After | Reduction |
|---------|--------|-------|-----------|
| Page Padding | 1.5rem | 1rem | 33% |
| Container Padding | 2.5rem 2rem | 2rem 1.5rem | 25% |
| Heading (h1) | 1.75rem | 1.5rem | 14% |
| Subheading (p) | 0.95rem | 0.875rem | 8% |
| Input Padding | 0.75rem | 0.625rem 0.75rem | 17% |
| Button Padding | 0.875rem 1.25rem | 0.75rem 1rem | 20% |
| Form Gap | default | 1rem | - |
| Divider Margin | default | 1.25rem 0 | - |

### Mobile (500px)

| Element | Before | After | Reduction |
|---------|--------|-------|-----------|
| Page Padding | 1rem | 0.75rem | 25% |
| Container Padding | 2rem 1.5rem | 1.5rem 1.25rem | 25% |
| Heading (h1) | 1.5rem | 1.375rem | 8% |
| Subheading (p) | 0.875rem | 0.8125rem | 7% |
| Input Padding | 0.75rem 0.875rem | 0.5rem 0.625rem | 33% |
| Button Padding | 0.875rem 1rem | 0.625rem 0.875rem | 29% |
| Form Gap | 1.25rem | 0.875rem | 30% |
| Divider Margin | 1.5rem 0 | 1rem 0 | 33% |
| Error Padding | default | 0.625rem 0.75rem | - |

### Small Mobile (360px)

| Element | Before | After | Reduction |
|---------|--------|-------|-----------|
| Page Padding | 0.75rem | 0.5rem | 33% |
| Container Padding | 1.5rem 1rem | 1.25rem 1rem | 17% |
| Heading (h1) | 1.375rem | 1.25rem | 9% |
| Subheading (p) | 0.8rem | 0.75rem | 6% |
| Input Padding | 0.625rem 0.75rem | 0.5rem 0.625rem | 20% |
| Button Padding | 0.75rem 0.875rem | 0.5rem 0.75rem | 33% |
| Form Gap | default | 0.75rem | - |
| Divider Margin | default | 0.875rem 0 | - |
| Google Icon | 18px | 16px | 11% |

## Visual Comparison

### Before (500px screen)
```
┌────────────────────────────┐
│  Page Padding: 1rem        │
│  ┌──────────────────────┐  │
│  │ Container: 2rem 1.5rem│ │
│  │                       │  │
│  │  Welcome Back         │  │ ← 1.5rem
│  │  Sign in to continue  │  │ ← 0.875rem
│  │                       │  │
│  │  [Email Input]        │  │ ← 0.75rem padding
│  │  [Password Input]     │  │
│  │                       │  │
│  │  [Sign In Button]     │  │ ← 0.875rem padding
│  │                       │  │
│  │  ──── OR ────         │  │ ← 1.5rem margin
│  │                       │  │
│  │  [Google Button]      │  │
│  │                       │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

### After (500px screen)
```
┌──────────────────────────┐
│ Padding: 0.75rem         │
│ ┌────────────────────┐   │
│ │ Container: 1.5/1.25│   │
│ │                    │   │
│ │ Welcome Back       │   │ ← 1.375rem
│ │ Sign in to cont... │   │ ← 0.8125rem
│ │                    │   │
│ │ [Email Input]      │   │ ← 0.5rem padding
│ │ [Password Input]   │   │
│ │                    │   │
│ │ [Sign In Button]   │   │ ← 0.625rem padding
│ │                    │   │
│ │ ─── OR ───         │   │ ← 1rem margin
│ │                    │   │
│ │ [Google Button]    │   │
│ │                    │   │
│ └────────────────────┘   │
└──────────────────────────┘
```

## Space Savings

### Total Height Reduction (500px screen)
- **Header**: ~8px smaller
- **Form spacing**: ~12px tighter
- **Inputs**: ~8px per input (16px total)
- **Buttons**: ~8px per button (16px total)
- **Divider**: ~16px smaller margin
- **Footer**: ~16px smaller margin

**Total saved**: ~72px (approximately 15-20% height reduction)

### Benefits
✅ More content visible without scrolling
✅ Easier one-handed mobile use
✅ Faster to fill out forms
✅ Less thumb travel distance
✅ Better for small screens (iPhone SE, etc.)

## New Compact Features

### 500px Breakpoint
- Reduced border radius: 12px → 6px (inputs/buttons)
- Tighter form group gaps: 0.5rem → 0.25rem
- Smaller error messages: 0.8125rem font
- Compact divider text: 0.8125rem

### 360px Breakpoint
- Minimal padding: 0.5rem page, 1.25rem container
- Smallest heading: 1.25rem
- Tiny text: 0.75rem
- Compact buttons: 0.5rem padding
- Small Google icon: 16px

## Testing Recommendations

Test on these devices:
- iPhone SE (375px width)
- iPhone 12 Mini (360px width)
- Small Android phones (360px width)
- Galaxy Fold (280px width when folded)

Verify:
- [ ] All text is readable
- [ ] Buttons are tappable (min 44px height)
- [ ] No horizontal scroll
- [ ] Form fits without excessive scrolling
- [ ] Error messages are visible
- [ ] Google button icon is clear
