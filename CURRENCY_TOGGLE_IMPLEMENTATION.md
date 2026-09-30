# Currency Toggle Implementation

## Overview
Added USD/INR currency toggle to both `index.html` (landing page) and `dashboard.html` that persists user preference across pages using localStorage.

## Conversion Rate
- **1 USD = ₹83 INR** (hardcoded constant)

## Features Implemented

### 1. Toggle UI Component
**Location:** Navigation bar on both pages

**Design:**
- Pill-shaped toggle with two buttons: USD | INR
- Active state highlighted with contrasting background
- Smooth transitions on state change
- Matches existing design system (frosted glass on dashboard, editorial on landing)

### 2. Price Elements Updated

#### Landing Page (index.html)
- Panel 1 subtitle: "$3–$15/month" → "₹250–₹1,250/month"

#### Dashboard (dashboard.html)
**Pricing Table:**
- Figma: $540 → ₹44,820
- Adobe CC: $720 → ₹59,760
- LeetCode: $350 → ₹29,050
- Midjourney: $480 → ₹39,840
- Total SeatSwap: $349 → ₹28,967
- Total Retail: $2,000+ → ₹1,66,000+

**Catalog Cards:**
- Figma Enterprise: $12.00/mo → ₹996/mo (retail: $45 → ₹3,735)
- Adobe CC All Apps: $18.00/mo → ₹1,494/mo (retail: $60 → ₹4,980)
- LeetCode Premium: $9.00/mo → ₹747/mo (retail: $35 → ₹2,905)
- Midjourney Pro: $15.00/mo → ₹1,245/mo (retail: $60 → ₹4,980)

**Modals:**
- All lease modal option prices
- Escrow guarantee summary price
- Active telemetry card escrow amount

**Dynamic Elements:**
- Dispute simulation refund amount: $10.80 → ₹896

### 3. Persistence Logic
```javascript
// Saves to localStorage as "seatswap_currency"
localStorage.setItem("seatswap_currency", "USD" or "INR")

// Loads on page init, defaults to USD if not set
let currentCurrency = localStorage.getItem("seatswap_currency") || "USD";
```

### 4. Implementation Details

**HTML Structure:**
```html
<div class="currency-toggle">
  <button id="currencyUSD" class="active">USD</button>
  <button id="currencyINR">INR</button>
</div>
```

**Price Elements:**
```html
<span class="price" data-usd="$12.00" data-inr="₹996">$12.00</span>
```

**JavaScript:**
- `setCurrency(currency)` - Updates all price elements and toggle state
- Event listeners on both buttons
- Runs on `DOMContentLoaded` for dashboard, immediately for landing page

## CSS Classes Added

### Landing Page (index.html)
```css
.currency-toggle {
  background: rgba(13,12,11,.06);
  border: 1px solid var(--rule);
  border-radius: 999px;
  padding: 3px;
}
```

### Dashboard (dashboard.html)
```css
.currency-toggle {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--apple-border);
  backdrop-filter: var(--apple-frosted-filter);
  border-radius: 999px;
  padding: 3px;
}
```

## User Flow
1. User lands on `index.html`
2. Clicks "INR" in currency toggle
3. All prices update instantly to rupees
4. Preference saved to localStorage
5. User navigates to `dashboard.html`
6. Dashboard automatically loads in INR currency
7. User switches back to USD
8. Returns to landing page → still shows USD

## Mobile Responsive
- Toggle remains visible on mobile (doesn't hide with nav links)
- Touch targets meet 36px minimum
- Works on screens down to 320px width

## Browser Compatibility
- Uses standard localStorage API (IE8+)
- `querySelector`/`querySelectorAll` for price updates
- `addEventListener` for events
- ES6 arrow functions in dashboard, ES5 in landing page
- No external dependencies

## Testing
Run existing test suite:
```bash
npm test
```

Tests verify:
- Page structure intact
- Design tokens unchanged
- No JavaScript errors
- Price elements have data attributes

## Future Enhancements
1. Add more currencies (EUR, GBP, JPY)
2. Fetch live exchange rates from API
3. Add currency symbol formatting library
4. Store last-updated exchange rate timestamp
5. Add "Auto-detect location" option using IP geolocation
