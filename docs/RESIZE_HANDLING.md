# Resize Handling

**Audience:** Contributors

This document describes how the Remitwise-Frontend codebase handles window and container resize events efficiently. It covers the hooks, utilities, and patterns contributors should follow when adding new responsive behaviour.

---

## Why Resize Handling Matters

Remitwise runs on devices ranging from 320px (iPhone SE) to 1440px+ desktops. Resize events drive:

- Responsive layout shifts (grid columns, padding, text size)
- Chart container reflows (Recharts `ResponsiveContainer`)
- Mobile vs. desktop UI variants (e.g. shorter search placeholders on small screens)
- Accessibility gating (reduced-motion preference changes)

Uncontrolled or un-throttled resize listeners cause layout thrashing, unnecessary React renders, and janky scrolling. The patterns below keep resize work efficient and predictable.

---

## Current Architecture

### 1. Tailwind CSS Responsive Utilities (Primary Approach)

The **dominant responsive strategy** is CSS-based. Tailwind breakpoint prefixes handle layout without any JavaScript resize listeners.

**Custom breakpoints** defined in `tailwind.config.js`:

| Prefix | Width | Target |
|--------|-------|--------|
| `320:` | 320px | iPhone SE |
| `375:` | 375px | iPhone 14 |
| `450:` | 450px | Foldables |
| `tablet:` | 768px | iPad portrait |
| `laptop:` | 1024px | iPad landscape |
| `desktop:` | 1440px | Desktop |

**Example — progressive padding:**

```tsx
<main className="max-w-7xl mx-auto px-5 320:px-6 375:px-7 sm:px-6 lg:px-8 py-7 375:py-8">
```

This approach requires zero JavaScript and triggers no React renders. Use it whenever possible.

### 2. `useResizeObserver` — Container Resize

**File:** `lib/hooks/useResizeObserver.ts`

The hook wraps the browser `ResizeObserver` API for observing element size changes. It is SSR-safe, cleans up on unmount, and handles target changes.

```tsx
import { useResizeObserver } from "@/lib/hooks/useResizeObserver";

function ResizablePanel() {
  const ref = useResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      console.log("New size:", width, height);
    }
  });

  return <div ref={ref}>Resizable content</div>;
}
```

**Key properties:**

- Returns a `RefObject` you attach to the target element
- Automatically disconnects the observer on unmount
- Re-observes when the target element changes
- Skips gracefully when `ResizeObserver` is unavailable (SSR, old browsers)
- Uses a ref-based callback pattern to avoid re-creating observers on every render

### 3. `matchMedia` — Breakpoint Detection in JS

When you need a boolean in React state (e.g. to swap UI variants), use `window.matchMedia` — **not** `window.addEventListener("resize", ...)`.

**Real example** from `app/dashboard/transaction-history/components/transaction-history-search-input.tsx`:

```tsx
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  if (typeof window === "undefined") return;

  const mediaQuery = window.matchMedia("(max-width: 639px)");
  const updateMatch = () => setIsMobile(mediaQuery.matches);

  updateMatch();
  mediaQuery.addEventListener("change", updateMatch);

  return () => mediaQuery.removeEventListener("change", updateMatch);
}, []);
```

This pattern:

- SSR-guards with `typeof window` check
- Sets initial state synchronously
- Listens only to the `change` event (fires on breakpoint crosses, not every pixel)
- Cleans up on unmount

**When to use:** You need a JS-readable boolean for a breakpoint that Tailwind cannot express (e.g. swapping a placeholder string based on mobile vs. desktop).

### 4. Recharts `ResponsiveContainer` — Chart Reflows

Chart components (`MoneyDistributionWidget`, `SixMonthTrendsWidget`, `remittanceTrendChart`, etc.) use Recharts' `<ResponsiveContainer>` which internally creates a `ResizeObserver` on the chart's parent element.

```tsx
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

<ResponsiveContainer width="100%" height="100%">
  <PieChart>
    <Pie data={data} dataKey="value">
      {data.map((entry, i) => <Cell key={i} fill={colors[i]} />)}
    </Pie>
  </PieChart>
</ResponsiveContainer>
```

No custom resize logic is needed — `ResponsiveContainer` handles it.

### 5. `useEventListener` — General-Purpose DOM Listener

**File:** `lib/hooks/useEventListener.ts`

A generic hook for attaching any DOM event listener with automatic cleanup. While it can listen to `"resize"` on `window`, this pattern is **not used** for resize in this codebase. The hook is used for other events (keyboard, clicks, etc.).

If you do need a raw `resize` listener (rare), `useEventListener` handles cleanup:

```tsx
import { useEventListener } from "@/lib/hooks/useEventListener";

useEventListener("resize", () => {
  // Handle window resize
}, window);
```

---

## Debounce Utilities

Expensive work triggered by resize (e.g. API calls, heavy computations) should be debounced.

### `useDebounce`

**File:** `lib/hooks/useDebounce.ts`

Returns a debounced copy of a value. The value only updates after `delay` ms of inactivity.

```tsx
import { useDebounce } from "@/lib/hooks/useDebounce";

const debouncedSearch = useDebounce(searchQuery, 300);
```

Used in `app/transactions/page.tsx` and `app/dashboard/transaction-history/page.tsx` for search input debouncing.

### `useDebouncedValue`

**File:** `lib/hooks/useDebouncedValue.ts`

Similar to `useDebounce` but with a `mountedRef` guard to prevent state updates on unmounted components. Default delay is 300ms.

```tsx
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

const debouncedAmount = useDebouncedValue(amount, 400);

useEffect(() => {
  if (debouncedAmount) fetchQuote(debouncedAmount);
}, [debouncedAmount]);
```

Used in `app/send/components/AmountCurrencySection.tsx` for debounced quote fetching.

---

## Best Practices

1. **Prefer CSS over JS for responsive layout.** Use Tailwind breakpoint prefixes (`320:`, `375:`, `tablet:`, `desktop:`) for grid columns, padding, text sizes, and visibility. This avoids JavaScript overhead entirely.

2. **Use `useResizeObserver` for container sizes.** When you need to react to a specific element's dimensions (e.g. chart containers, collapsible panels), use the shared hook. Do not create raw `ResizeObserver` instances in components.

3. **Use `matchMedia` for JS breakpoint booleans.** Do not attach `window.addEventListener("resize", ...)`. The `matchMedia` approach fires only on breakpoint crosses, not on every pixel change.

4. **Always clean up listeners and observers.** Every `useResizeObserver`, `useEventListener`, and `matchMedia` listener must have a cleanup function in its `useEffect` return.

5. **Debounce expensive resize handlers.** If a resize callback triggers an API call, a heavy computation, or a state update that causes a large re-render, debounce it with `useDebounce` or `useDebouncedValue`.

6. **Avoid measuring DOM during render.** Never read `element.getBoundingClientRect()` or `element.clientWidth` during the render phase. Measure inside `useEffect` or `useLayoutEffect` only.

7. **Reuse existing utilities.** Do not create a new debounce function, a new `useMediaQuery` hook, or a new `ResizeObserver` wrapper. Use the ones in `lib/hooks/`.

8. **Guard for SSR.** Always check `typeof window === "undefined"` before accessing browser APIs like `ResizeObserver` or `matchMedia`.

---

## Common Mistakes

### Forgetting cleanup

```tsx
// BAD — observer is never disconnected
useEffect(() => {
  const observer = new ResizeObserver(callback);
  observer.observe(element);
}, []);
```

```tsx
// GOOD — cleanup function disconnects the observer
useEffect(() => {
  const observer = new ResizeObserver(callback);
  observer.observe(element);
  return () => observer.disconnect();
}, []);
```

### Using window resize instead of matchMedia

```tsx
// BAD — fires on every pixel change, causes excessive re-renders
useEffect(() => {
  const handler = () => setIsMobile(window.innerWidth < 640);
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}, []);
```

```tsx
// GOOD — fires only on breakpoint crosses
useEffect(() => {
  const mq = window.matchMedia("(max-width: 639px)");
  const handler = () => setIsMobile(mq.matches);
  handler();
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}, []);
```

### Creating ResizeObservers without disconnecting

```tsx
// BAD — observer leaks on every callback change
useEffect(() => {
  const observer = new ResizeObserver((entries) => {
    // heavy work
  });
  observer.observe(element);
});
```

### Measuring DOM during render

```tsx
// BAD — reads layout during render, triggers layout thrashing
function Panel() {
  const width = document.getElementById("panel")?.clientWidth ?? 0;
  return <div>Width: {width}</div>;
}
```

### Multiple resize listeners on the same element

If two hooks or components both observe the same element, create separate `useResizeObserver` instances rather than duplicating observer logic. Each instance cleans up independently.

---

## Adding New Resize Logic

### When to use `useResizeObserver`

- You need the pixel dimensions of a specific DOM element
- You are building a chart, map, or canvas that must fill its container
- You are implementing a collapsible or resizable panel

### When `matchMedia` is sufficient

- You need to know if the viewport is above or below a breakpoint
- You want to swap a UI variant (e.g. mobile vs. desktop placeholder text)
- You want to conditionally render different components at different sizes

### When Tailwind is sufficient

- You are changing padding, margin, grid columns, text size, or visibility
- You do not need the size value in JavaScript

### Where new resize logic should live

- **Hooks** go in `lib/hooks/` with a `use` prefix
- **Components** that consume resize data stay in `components/` or `app/`
- Do not put resize logic in layout files or page components — extract it into a reusable hook

### Keeping resize behaviour performant

- Debounce any resize callback that triggers API calls or heavy computations
- Prefer `matchMedia` change events over `window.resize` events
- Use `useResizeObserver` instead of raw `ResizeObserver` to get automatic cleanup
- Avoid reading layout properties (`getBoundingClientRect`, `clientWidth`) in tight loops

---

## Related Documentation

- [Responsive Breakpoint Guide](./RESPONSIVE_BREAKPOINT_GUIDE.md) — Custom breakpoints and spacing scale
- [Motion Vocabulary](./MOTION.md) — Animation durations and `prefers-reduced-motion`
- [Tailwind Extensions](./tailwind-extensions.md) — Custom utilities and tokens
- [Elevation & Shadow](./ELEVATION.md) — Visual layer system

---

**Last Updated:** 2026-07-26
