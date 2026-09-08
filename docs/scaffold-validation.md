# Scaffold Validation

The scaffold was generated without installing packages in the build environment because external package installation was unavailable/restricted during artifact generation.

Run locally:

```bash
npm install
npm run check:prereqs
npm run check
```

The GitHub Actions workflow will run the same quality gate after `package-lock.json` is committed.
