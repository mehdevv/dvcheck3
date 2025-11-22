# Firestore Security Rules Setup

## The Problem
You're getting a permission error because Firestore security rules are blocking access. You need to update the security rules in your Firebase Console.

## Solution: Update Firestore Security Rules

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `dvcheck2-e853b`
3. Click on **Firestore Database** in the left sidebar

### Step 2: Navigate to Rules
1. Click on the **Rules** tab at the top
2. You'll see the current security rules (probably the default restrictive rules)

### Step 3: Update the Rules
Copy and paste the following rules into the Rules editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email == 'kernoumehdi17@gmail.com';
    }
    
    // Members collection rules
    match /members/{memberId} {
      // Allow read if user is authenticated
      allow read: if request.auth != null;
      
      // Allow create if user is admin
      allow create: if isAdmin();
      
      // Allow update/delete if user is admin
      allow update, delete: if isAdmin();
    }
    
    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 4: Publish the Rules
1. Click the **Publish** button
2. Wait for the confirmation that rules have been published

### Alternative: Simpler Rules (for development/testing)
If you want simpler rules for testing (less secure), you can use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{memberId} {
      // Allow all operations for authenticated users (for development)
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ Warning:** The simpler rules are less secure and should only be used for development/testing.

### Step 5: Verify
After publishing, try using your app again. The permission error should be resolved.

## What These Rules Do

1. **isAdmin()** - Checks if the authenticated user is the admin (kernoumehdi17@gmail.com)
2. **Members Read** - Any authenticated user can read members
3. **Members Create** - Only admin can create new members
4. **Members Update/Delete** - Only admin can update or delete members

## Troubleshooting

If you still get permission errors:
1. Make sure you're logged in as admin
2. Check that the email in the rules matches exactly: `kernoumehdi17@gmail.com`
3. Clear your browser cache and try again
4. Check Firebase Console for any error messages

