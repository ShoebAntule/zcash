# Git Workflow

Use `main` plus short-lived feature branches.

Examples:

- `feat/noir-detection`
- `feat/noir-connect`
- `feat/zec-test-payment`
- `feat/zsa-poc`
- `fix/<short-description>`

Before merging:

```bash
npm run check
```

`main` must remain buildable. For GitHub collaboration, require the quality workflow to pass and block force-pushes.
