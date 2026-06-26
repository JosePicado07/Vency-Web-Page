# Admin Page Testing Guide

## Quick Test Checklist

### Security (5 min)
- [ ] **XSS Test**: In Metrics, try entering `<script>alert('xss')</script>` as fragrance name during a manual test
- [ ] **Token test**: Logout, re-enter wrong token → should fail
- [ ] **Token test**: Re-enter correct token → should load metrics

### Performance (Ctrl+Shift+K DevTools → Network)
- [ ] Admin loads in <2 sec
- [ ] No 404 errors (all scripts/CSS loaded)
- [ ] catalogo-data.js only loads when VENDER tab opened

### A11y (Keyboard-only)
- [ ] Tab through all controls (gate, tabs, buttons, inputs)
- [ ] Enter/Space activate buttons
- [ ] Tab order is logical (left→right, top→bottom)
- [ ] Focus visible (outline/border on focused elements)

### Mobile (375px width, Safari/Chrome)
- [ ] All buttons are tappable (48px+ height)
- [ ] Text is readable (not cut off)
- [ ] Modals/panels fit screen
- [ ] Spinner visible while loading

### UX Flow
- [ ] **Gate**: Shows "Clave de vendedor" prompt
- [ ] **Eye toggle**: Click icon → password shows/hides
- [ ] **Empty state**: Search "zzzzzzzzzz" → "Sin resultados" shows
- [ ] **Loading spinner**: Refresh metrics → spinner animates
- [ ] **Best seller**: Monthly top shows 👑 crown

### Integration
- [ ] Logout clears localStorage (DevTools → Application → Storage)
- [ ] Refresh after logout → gate reappears
- [ ] Sales register POST succeeds (check Network tab, ref format `VA####`)

---

## Detailed Tests

### 1. Keyboard Navigation (2 min)
```
1. Gate screen:
   - Tab → input field highlights
   - Type token
   - Tab → button highlights
   - Enter → submits

2. App (after login):
   - Tab cycles: header logout → tabs → search → grid
   - Shift+Tab reverses
   - Arrow keys (TBD if implemented) navigate grid
```

### 2. Screen Reader (NVDA/JAWS, if available)
```
1. Gate form:
   - "Clave de vendedor" label announced
   - Form submitted on Enter

2. Metrics:
   - "Resumen de ventas" section announced
   - Tabs announced with aria-selected state
   - "Top: Citrus Enigma ×3" announced

3. Grid:
   - Fragrance names read aloud
   - "Best seller" indicated (TBD: crown emoji read as "crown")
```

### 3. Color Contrast (WebAIM tool: webaim.org/resources/contrastchecker)
```
Test these colors:
- Text on metrics bg: var(--volcanic-ink) on var(--botanical-parchment)
  Expected: ≥4.5:1 (WCAG AA)
- Button text: oklch(95% 0.007 90) on oklch(55% 0.10 55)
  Expected: ≥4.5:1
```

### 4. Mobile Responsive (DevTools → Device Toolbar)
```
Devices to test:
- iPhone 12 mini (375px)
- iPhone 12 (390px)
- iPad (768px)
- Android (360px)

Checklist:
- [ ] No horizontal scroll
- [ ] Buttons 48px+ tall
- [ ] Text readable (not tiny)
- [ ] Modals don't overflow
```

### 5. Network Performance (DevTools → Network)
```
Setup: Slow 3G throttling
1. Load admin.html → all scripts/CSS load
2. Click "Mes" tab → metrics refresh
3. Open VENDER tab → catalogo-data.js loads

Expected:
- Initial load <2 sec
- catalogo-data.js loads async
- All resources gzip-compressed
```

---

## Edge Cases

| Case | Expected | How to Test |
|------|----------|-------------|
| **No internet** | "Sin conexión — abrí la hoja" | DevTools → offline mode |
| **Slow response** | Spinner shows while fetching | Network throttle + slow server |
| **XSS in name** | Name sanitized (shows literal `<>`) | Inject `<b>test</b>` in sales ref |
| **Very long name** | Text wraps or ellipsizes | Find fragrance with 50+ char name |
| **Empty inventory** | "Sin resultados" shows | Search "zzzzzzzzzzz" |
| **Rate limit** | Server responds `slow` | 40+ POSTs in 1 minute |

---

## Regression Tests

After each update, verify:
1. ✅ Token gate still works
2. ✅ Metrics load without errors
3. ✅ Best seller crown appears
4. ✅ No console errors (DevTools → Console)
5. ✅ Logout clears token

---

## Known Issues / TBD

- [ ] Crown emoji (👑) screen-reader accessibility
- [ ] Keyboard shortcuts (e.g., `/` for search)
- [ ] Offline metrics (currently requires connection)
