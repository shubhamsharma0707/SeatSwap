# SeatSwap Authentication App

Complete authentication system with Sign Up, Login, and Password Reset pages built with React + Vite + TypeScript + Tailwind CSS.

## Features

✅ **Sign Up Page** - Full registration with validation (name, email, password, confirm password)
✅ **Login Page** - Email/password login with "Remember Me" option
✅ **Password Reset** - Email-based password recovery with success confirmation
✅ **Cinematic Design** - Fullscreen video background with glassmorphic UI
✅ **Form Validation** - Real-time validation with error messages
✅ **Responsive** - Mobile-friendly design
✅ **TypeScript** - Full type safety
✅ **Smooth Animations** - Fade-rise entrance animations

## Installation

```bash
cd auth-app
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
auth-app/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AuthLayout.tsx      # Shared layout with video background
│   │   └── ui/
│   │       ├── Button.tsx          # Reusable button component
│   │       ├── Input.tsx           # Form input with error handling
│   │       └── Label.tsx           # Form label component
│   ├── pages/
│   │   ├── Login.tsx               # Login page
│   │   ├── SignUp.tsx              # Sign up page
│   │   └── ResetPassword.tsx       # Password reset page
│   ├── App.tsx                     # Router configuration
│   ├── main.tsx                    # App entry point
│   └── index.css                   # Global styles + liquid glass effect
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Routes

- `/` or `/login` - Login page
- `/signup` - Sign up page
- `/reset-password` - Password reset page

## Design System

**Colors (Dark Theme):**
- Background: Deep navy blue (`hsl(201 100% 13%)`)
- Foreground: White (`hsl(0 0% 100%)`)
- Muted: Gray tones for secondary text

**Typography:**
- Display: Instrument Serif (headings)
- Body: Inter (forms, labels, body text)

**Effects:**
- Liquid glass morphism with subtle borders
- Fade-rise entrance animations
- Smooth hover transitions

## Integration Notes

### Backend Integration

Replace the `setTimeout` simulations in each page with actual API calls:

**SignUp.tsx (Line 66):**
```typescript
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})
const data = await response.json()
```

**Login.tsx (Line 62):**
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...formData, rememberMe })
})
const data = await response.json()
```

**ResetPassword.tsx (Line 50):**
```typescript
const response = await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: formData.email })
})
```

### Redirect After Login

Currently redirects to `/dashboard.html` - update this path based on your routing setup.

## Next Steps

1. **Install dependencies:** `cd auth-app && npm install`
2. **Run dev server:** `npm run dev`
3. **Test all flows:** Sign up → Login → Password Reset
4. **Backend integration:** Connect forms to your API endpoints
5. **Add OAuth:** Google/GitHub sign-in options
6. **Email verification:** Add verification page after signup
7. **Session management:** Add JWT token handling

## Video Background

Uses CloudFront-hosted video. To change:
- Update video URL in `src/components/layout/AuthLayout.tsx` (line 21)
- Ensure video is encoded as all-intra H.264 for smooth scrubbing

## License

Part of the SeatSwap project.
