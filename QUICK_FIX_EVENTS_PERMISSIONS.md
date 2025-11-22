# 🔥 QUICK FIX: Events Permission Error

## The Error
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

This happens because the `events` collection is not in your Firestore security rules.

## ⚡ FASTEST SOLUTION

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `dvcheck2-e853b`
3. **Click**: Firestore Database → **Rules** tab
4. **DELETE everything** and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email == 'kernoumehdi17@gmail.com';
    }
    
    match /members/{memberId} {
      allow read: if request.auth != null;
      allow create: if isAdmin();
      allow update, delete: if isAdmin();
    }
    
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

5. **Click Publish** button
6. **Refresh your app** - error should be gone!

---

## What This Does
- ✅ Allows authenticated users to read members and events
- ✅ Only admin can create/update/delete members
- ✅ Only admin can create/update/delete events
- ✅ Blocks unauthenticated users

---

## Still Not Working?

1. **Check you're logged in** - The app needs you to be authenticated
2. **Wait 30 seconds** - Rules can take a moment to propagate
3. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. **Check Firebase Console** - Make sure rules show as "Published"

