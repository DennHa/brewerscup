# GitHub Pages Deployment Guide

This guide helps you solve the Firebase MIME type error and deploy to GitHub Pages.

## The Problem

When you deployed to GitHub Pages, you saw this error:

```
Loading of the module from 'https://dennha.github.io/brewerscup/js/firebase-config.js' 
was blocked because of an unapproved MIME type ('text/html').
```

### Why This Happens

1. `firebase-config.js` is in `.gitignore` (for security)
2. GitHub Pages tries to load it from the live site
3. File doesn't exist on GitHub, so server returns 404 (HTML error page)
4. Browser expects JavaScript but gets HTML
5. Browser blocks it due to MIME type mismatch

**This is actually correct behavior** - we DON'T want credentials on GitHub!

## Solution: Local Firebase Config for GitHub Pages

The app is designed to work with local configuration. Here's how to get it working:

### Option 1: Local Testing Only (Recommended for now)

If you just want to test locally and don't need GitHub Pages working yet:

1. Create `js/firebase-config.js`:
   ```bash
   cp js/firebase-config.example.js js/firebase-config.js
   ```

2. Add your Firebase credentials to `js/firebase-config.js`

3. Run locally:
   ```bash
   python -m http.server 8000
   ```

4. Access at: http://localhost:8000

**Result**: App works perfectly locally with real data.

---

### Option 2: Environment Variables on GitHub Pages (Advanced)

To get full GitHub Pages support, we need a build process:

#### Step 1: Set Up GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Create firebase-config.js
      run: |
        cat > js/firebase-config.js << 'EOF'
        const firebaseConfig = {
          apiKey: "${{ secrets.FIREBASE_API_KEY }}",
          authDomain: "${{ secrets.FIREBASE_AUTH_DOMAIN }}",
          projectId: "${{ secrets.FIREBASE_PROJECT_ID }}",
          storageBucket: "${{ secrets.FIREBASE_STORAGE_BUCKET }}",
          messagingSenderId: "${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}",
          appId: "${{ secrets.FIREBASE_APP_ID }}"
        };
        EOF
    
    - name: Create admin.js
      run: |
        cat > js/admin.js << 'EOF'
        const ADMIN_EMAIL = "${{ secrets.ADMIN_EMAIL }}";
        const ADMIN_PASSWORD = "${{ secrets.ADMIN_PASSWORD }}";
        EOF
    
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: .
```

#### Step 2: Add GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:
   - `FIREBASE_API_KEY` - From Firebase Console
   - `FIREBASE_AUTH_DOMAIN` - e.g., `brewerscup-xxxxx.firebaseapp.com`
   - `FIREBASE_PROJECT_ID` - e.g., `brewerscup-xxxxx`
   - `FIREBASE_STORAGE_BUCKET` - e.g., `brewerscup-xxxxx.appspot.com`
   - `FIREBASE_MESSAGING_SENDER_ID` - From Firebase Console
   - `FIREBASE_APP_ID` - From Firebase Console
   - `ADMIN_EMAIL` - Your admin email
   - `ADMIN_PASSWORD` - Your admin password

#### Step 3: Deploy

1. Push to GitHub:
   ```bash
   git push origin main
   ```

2. GitHub Actions automatically:
   - Creates `firebase-config.js` with secrets
   - Creates `admin.js` with secrets
   - Deploys to GitHub Pages

3. Check status:
   - Go to **Actions** tab in your repository
   - Watch the workflow run
   - See deployment status

**Result**: Full working site on GitHub Pages with all features!

---

### Option 3: Backend Config API (Most Secure)

For production, create a backend that serves config:

```javascript
// Create a cloud function that returns config
fetch('/api/config')
  .then(r => r.json())
  .then(config => {
    initializeApp(config);
  });
```

This requires:
- Backend server (Firebase Functions, Heroku, etc.)
- More complex setup
- Better security (credentials never in git)

---

## Quick Decision Guide

| Scenario | Solution |
|----------|----------|
| Local testing only | Option 1 - Local config |
| GitHub Pages with GitHub Actions | Option 2 - Environment variables |
| Production with backend | Option 3 - Config API |

## Current Status

✅ **Your app**: Fully functional, all code on GitHub  
✅ **Credentials**: Secure (not in git)  
🟡 **GitHub Pages**: Needs config to be accessible  

**Recommended**: Use Option 2 (GitHub Actions) for seamless deployment

---

## Checking Your Setup

### Test Locally First

1. Set up `js/firebase-config.js`:
   ```bash
   cp js/firebase-config.example.js js/firebase-config.js
   # Add your Firebase credentials
   ```

2. Run locally:
   ```bash
   python -m http.server 8000
   ```

3. Test features:
   - Submit a test deck
   - Check deck status
   - Access admin panel

4. If everything works locally → GitHub Actions will work too!

### Verify Firebase Connection

In browser DevTools Console:
```javascript
// Check if Firebase is loaded
console.log(firebase);

// Check if config is valid
console.log(firebaseConfig);

// Test Firestore connection
db.collection('decks').get().then(snapshot => {
  console.log('Firestore connected! Docs:', snapshot.size);
});
```

---

## GitHub Pages vs Local Deployment

| Feature | Local | GitHub Pages |
|---------|-------|--------------|
| Setup time | 5 minutes | 10 minutes |
| Cost | Free | Free |
| Firebase access | ✅ Full | ✅ Full (with Option 2) |
| Admin access | ✅ Yes | ✅ Yes (with Option 2) |
| Complexity | Simple | Medium |
| Security | Good | Better |

---

## Troubleshooting

### GitHub Actions fails
**Problem**: Workflow doesn't complete
**Solution**:
1. Check **Actions** tab for error messages
2. Verify all secrets are set correctly
3. Try pushing again: `git push origin main`

### Firebase config still not loading
**Problem**: Still getting MIME type error
**Solution**:
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+Shift+R)
3. Try in incognito/private mode
4. Check GitHub Actions ran successfully

### Secrets not being used
**Problem**: Config.js created but with wrong values
**Solution**:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Verify secret names match exactly (case-sensitive)
3. Update secrets if needed
4. Push a new commit to trigger workflow

---

## Files to Create

For Option 2 (Recommended):

**`.github/workflows/deploy.yml`** - GitHub Actions workflow (provided above)

That's it! Everything else is already in place.

---

## Next Steps

1. Choose your option (1, 2, or 3)
2. Follow the setup steps
3. Test locally first
4. Deploy to GitHub Pages
5. Enjoy your working deck verification system!

---

## Support

- **Firebase Issues**: See [FIREBASE-SETUP.md](./FIREBASE-SETUP.md)
- **Setup Issues**: See [SETUP.md](./SETUP.md)
- **GitHub Pages Help**: [GitHub Pages Documentation](https://docs.github.com/en/pages)
- **GitHub Actions Help**: [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Last Updated**: January 26, 2026  
**Version**: 1.0
