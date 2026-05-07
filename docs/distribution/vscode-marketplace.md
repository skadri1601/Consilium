# Submitting to VS Code Marketplace + OpenVSX (Cursor)

The VS Code extension lives at `apps/vscode-extension/` and ships
to two registries:

| Registry                  | Used by                         | Tool   |
| ------------------------- | ------------------------------- | ------ |
| Visual Studio Marketplace | VS Code                         | `vsce` |
| Open VSX                  | Cursor, VSCodium, Gitpod, Theia | `ovsx` |

Cursor mirrors Open VSX, so a single Open VSX publish reaches every
Cursor user without an additional submission.

## One-time setup

### 1. Create a Marketplace publisher account

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with the Microsoft account that owns `myconsilium`
3. Create a publisher with id `myconsilium` (must match `package.json` `publisher`)
4. Generate a Personal Access Token (PAT):
   - Azure DevOps → User Settings → Personal Access Tokens
   - Scope: **Marketplace > Manage**
   - Expiry: 1 year (note the renewal)
5. Save the PAT in 1Password / GH secret as `VSCE_PAT`

### 2. Create an Open VSX publisher account

1. Go to https://open-vsx.org
2. Sign in with the GitHub account that owns the repo
3. Open Profile → Settings → Access Tokens
4. Generate a token; save as `OVSX_PAT`
5. Create the publisher namespace `myconsilium`:
   ```bash
   ovsx create-namespace myconsilium -p $OVSX_PAT
   ```

### 3. Build the marketplace icon (one-time, then on rebrand)

Per `apps/vscode-extension/media/README.md`, export `consilium-icon.svg` to a 128×128 PNG at `apps/vscode-extension/media/consilium-icon.png`.

## Per-release runbook

```bash
cd apps/vscode-extension

# 1. Bump version in package.json + CHANGELOG.md

# 2. Build + sanity-check
pnpm install
pnpm build
pnpm package    # produces consilium-vscode-<version>.vsix

# 3. Smoke test the .vsix in a clean VS Code:
#    Code → Extensions sidebar → "..." menu → Install from VSIX...
#    Verify: activity bar icon, sign-in flow, debate panel renders,
#            right-click "Debate selected code" works on a sample.

# 4. Publish to Marketplace
VSCE_PAT=<token> pnpm publish:vscode

# 5. Publish to Open VSX (for Cursor / Codium / VSCodium)
OVSX_PAT=<token> pnpm publish:openvsx

# 6. Tag the release
git tag vscode-v$(node -p "require('./package.json').version")
git push --tags
```

## CI release workflow (recommended)

Once smoke-tested manually, automate via `.github/workflows/release-vscode.yml`:

```yaml
on:
  push:
    tags:
      - "vscode-v*"

jobs:
  publish:
    runs-on: blacksmith-4vcpu-ubuntu-2404
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter consilium-vscode build
      - run: pnpm --filter consilium-vscode package
      - name: Publish to VS Code Marketplace
        run: pnpm --filter consilium-vscode publish:vscode
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
      - name: Publish to Open VSX
        run: pnpm --filter consilium-vscode publish:openvsx
        env:
          OVSX_PAT: ${{ secrets.OVSX_PAT }}
      - name: Upload .vsix to GitHub release
        uses: softprops/action-gh-release@v2
        with:
          files: apps/vscode-extension/*.vsix
```

## Marketplace listing copy

The README at `apps/vscode-extension/README.md` is what the
Marketplace renders as the listing page. It already has:

- Tagline ("Run multi-AI debates across OpenAI, Anthropic, Google, Groq, xAI, Moonshot, and OpenRouter")
- Feature bullets
- Install instructions
- Configuration table
- Privacy notes
- Cross-links to the CLI / SDK / repo

Update it whenever the feature surface changes.

## Tracking adoption

After publishing, monitor:

- **VS Code Marketplace**: install count, rating, version splits via
  https://marketplace.visualstudio.com/manage/publishers/myconsilium
- **Open VSX**: install count via
  https://open-vsx.org/extension/myconsilium/consilium-vscode
- **PostHog event**: extension activation pings the API with
  `debateSource: "vscode"` - funnel by source in the dashboard

## When to bump the version

| Change                                | Bump  |
| ------------------------------------- | ----- |
| New command / contributes.menu entry  | minor |
| Bug fix that doesn't change UX        | patch |
| Settings schema change                | minor |
| Breaking change to extension behavior | major |
| Marketplace icon / README copy only   | patch |

The Marketplace caches metadata aggressively; non-code changes (icon, README) need a patch bump to force a refresh.
