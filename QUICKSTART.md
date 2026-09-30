# 🚀 SeatSwap - Quick Start Guide

## ✅ Everything is Connected and Ready!

All your pages are now fully integrated with authentication. Here's how to test:

---

## 🎯 Access SeatSwap in Your Browser

The server is currently running and active on **both** Port 3000 and Port 8080!

Open any of these links:
- **Dashboard**: [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html) (or `http://localhost:8080/dashboard.html`)
- **Landing Page**: [http://localhost:3000/index.html](http://localhost:3000/index.html) (or `http://localhost:8080/index.html`)
- **Auth / Login**: [http://localhost:3000/login](http://localhost:3000/login) (or `http://localhost:8080/auth-app/dist/index.html`)

To restart the server at any time:
```bash
npm start
# or: node server.js
```

---

## 🧪 Testing Checklist

### **1. Test New User Journey** (Sign Up)
```
✅ Visit: http://localhost:8080/index.html
✅ Click "Browse available seats" button
✅ Should redirect to login page
✅ Click "Create an account"
✅ Fill form and submit
✅ Should auto-login and go to dashboard
✅ User menu should appear in top-right
```

### **2. Test Login Flow**
```
✅ Clear localStorage (DevTools → Application → Clear)
✅ Visit: http://localhost:8080/dashboard.html
✅ Should redirect to login
✅ Enter any email/password
✅ Should return to dashboard
✅ Lease modals should work
```

### **3. Test Logout**
```
✅ Click user menu dropdown
✅ Click "Sign Out"
✅ Should clear auth and return to landing
✅ User menu should disappear
```

---

## 🌐 Page Links

| Page | URL | Auth Required |
|------|-----|---------------|
| Landing | http://localhost:8080/index.html | ❌ No |
| Dashboard | http://localhost:8080/dashboard.html | ✅ Yes |
| Login | http://localhost:8080/auth-app/dist/index.html | ❌ No |
| Sign Up | http://localhost:8080/auth-app/dist/index.html#/signup | ❌ No |
| Reset Password | http://localhost:8080/auth-app/dist/index.html#/reset-password | ❌ No |

---

## 🔑 Current Authentication

**Mock Mode** (for testing):
- Any email works
- Any password works
- Auto-generates token
- Saves to localStorage

**Test Credentials:**
- Email: `test@seatswap.com`
- Password: `password123`
- Or any other combination!

---

## 🎨 What's Working

✅ **Landing Page**
- Video background with scroll animations
- Currency toggle (USD/INR)
- Navigation with auth-aware buttons
- Shows user menu when logged in

✅ **Dashboard**
- Protected by authentication
- Auto-redirects to login if needed
- Catalog browsing with filters
- Lease modals require auth
- User menu with logout

✅ **Auth Pages**
- Login with remember me
- Sign up with validation
- Password reset flow
- Auto-login after signup
- Smart redirects

---

## 📂 File Structure

```
SeatSwap/
├── index.html              ← Landing page
├── dashboard.html          ← Dashboard (protected)
├── js/
│   ├── integration.js      ← Auth integration script ⭐
│   └── auth.js             ← Auth helpers
├── auth-app/
│   ├── src/                ← React source files
│   └── dist/               ← Built auth pages ⭐
│       └── index.html      ← Entry point for auth
└── INTEGRATION_COMPLETE.md ← Full documentation
```

---

## 🔄 User Flow Diagram

```
┌─────────────────────┐
│   Landing Page      │
│   (index.html)      │
└──────────┬──────────┘
           │
    Click "Browse"
           │
           ▼
    ┌──────────────┐
    │ Authenticated?│
    └──────┬───────┘
           │
    ┌──────┴──────┐
    │             │
   No            Yes
    │             │
    ▼             ▼
┌─────────┐   ┌──────────┐
│ Login   │   │Dashboard │
│ Page    │   │          │
└────┬────┘   └──────────┘
     │
  Submit
     │
     └──────────┐
                │
         Success login
                │
                ▼
           ┌──────────┐
           │Dashboard │
           │+ User    │
           │  Menu    │
           └──────────┘
```

---

## 🐛 Troubleshooting

### **Issue: Can't access auth pages**
```bash
# Make sure auth app is built
cd /Users/shubham/Documents/SeatSwap/auth-app
npm run build
```

### **Issue: Redirects not working**
- Check browser console for errors
- Clear localStorage: DevTools → Application → Clear
- Refresh the page

### **Issue: User menu not showing**
- Make sure you're logged in
- Check localStorage has `seatswap_auth_token`
- Refresh the page

### **Issue: Dashboard redirects to login immediately**
- This is correct behavior when not logged in!
- Log in and you'll be redirected back

---

## 📊 What's Stored

**localStorage:**
```javascript
{
  "seatswap_auth_token": "mock_jwt_token_1234567890",
  "seatswap_user_data": "{\"email\":\"user@example.com\",\"fullName\":\"User\",\"id\":\"user_123\"}",
  "seatswap_currency": "USD"
}
```

**sessionStorage:**
```javascript
{
  "seatswap_redirect_after_login": "/dashboard.html"
}
```

---

## 🎯 Next: Backend Integration

To connect real authentication:

### **1. Build Backend API**
```javascript
// Express.js example
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  
  // Validate credentials
  const user = await User.findByEmail(email)
  const valid = await bcrypt.compare(password, user.password)
  
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' })
  
  // Generate JWT
  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' })
  
  res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } })
})
```

### **2. Update Frontend**
Replace mock setTimeout in:
- `auth-app/src/pages/Login.tsx` (line ~62)
- `auth-app/src/pages/SignUp.tsx` (line ~71)
- `auth-app/src/pages/ResetPassword.tsx` (line ~50)

---

## 🎉 You're All Set!

**Your authentication system is fully functional and ready to use!**

Visit: http://localhost:8080/index.html and try the complete flow!

---

## 📖 Full Documentation

See [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md) for:
- Complete architecture details
- Backend integration guide
- Security considerations
- Advanced features
- Production deployment

---

**Happy testing! 🚀**
