# 🔥 QUICK FIX: Firestore Permission Error

## The Error
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

## ⚡ FASTEST SOLUTION (Copy & Paste)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `dvcheck2-e853b`
3. **Click**: Firestore Database → **Rules** tab
4. **DELETE everything** and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{memberId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. **Click Publish** button
6. **Refresh your app** - error should be gone!

---

## What This Does
- ✅ Allows any authenticated user to read/write members
- ✅ Blocks unauthenticated users
- ✅ Simple and works immediately

## After It Works
Once you confirm it's working, you can update to more secure rules (see `FIRESTORE_SETUP.md`)

---

## Still Not Working?

1. **Check you're logged in** - The app needs you to be authenticated
2. **Wait 30 seconds** - Rules can take a moment to propagate
3. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. **Check Firebase Console** - Make sure rules show as "Published"

