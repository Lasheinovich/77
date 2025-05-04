# Security Patches Documentation

## Applied Patches

| Date | Package | Version Fixed | CVE | Description |
|------|---------|---------------|-----|-------------|
| 2025-05-04 | undici | ^5.28.5 | [CVE-2023-45857](https://github.com/advisories/GHSA-c76h-2ccp-4975) | Fixed Proxy-Authorization header not being cleared on cross-origin redirects |
| 2025-05-04 | esbuild | ^0.25.0 | [CVE-2023-49286](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | Fixed arbitrary code execution vulnerability |

## Implementation Details

These patches were implemented using PNPM overrides in `package.json`:

```json
"pnpm": {
  "overrides": {
    "undici": "^5.28.5",
    "esbuild": "^0.25.0"
  }
}
```

And NPM resolutions for compatibility:

```json
"resolutions": {
  "undici": "^5.28.5",
  "esbuild": "^0.25.0"
}
```

## Remaining Issues

The system is now protected against the reported vulnerabilities. Regular updates should be performed to ensure continued security.
