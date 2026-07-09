# Publishing — macOS, Windows, Linux

This is a NativePHP (Electron) app, packaged by **electron-builder**. You build
**one platform at a time** on (or matching) that platform:

```bash
php artisan native:build mac      # → .dmg  (+ .zip for auto-update)
php artisan native:build win      # → NSIS  setup .exe
php artisan native:build linux    # → .AppImage  and  .deb
```

> Cross-compiling isn't supported (except Windows-from-Linux via wine). Build
> macOS on a Mac, Windows on Windows (or CI), Linux on Linux.

There are **two distribution models**. NativePHP officially supports **direct
distribution** (signed/notarized installers you host yourself, with the built-in
auto-updater). The **app stores** are *possible* but are a **manual
electron-builder override that NativePHP does not wire up or support** — see the
per-store sections.

---

## 1. Direct distribution (recommended default)

This is the path NativePHP is built for and the fastest to ship on all three OSes.

### macOS — notarized `.dmg`
Requires an **Apple Developer Program** membership ($99/yr) and a *Developer ID
Application* certificate. Set these in `.env` (they're stripped from the build):

```
NATIVEPHP_APPLE_ID="you@example.com"
NATIVEPHP_APPLE_ID_PASS="app-specific-password"   # appleid.apple.com → App-Specific Passwords
NATIVEPHP_APPLE_TEAM_ID="XXXXXXXXXX"
```

`native:build mac` signs with the hardened runtime and notarizes via Apple's
`notarytool` automatically. Without notarization the app shows *"is damaged and
can't be opened"* on other Macs.

### Windows — signed `.exe`
Recommended: **Azure Trusted Signing** (cloud, no local cert). In `.env`:

```
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
NATIVEPHP_AZURE_PUBLISHER_NAME="Your Name / Company"
NATIVEPHP_AZURE_ENDPOINT="https://wus2.codesigning.azure.net/"
NATIVEPHP_AZURE_CERTIFICATE_PROFILE_NAME=...
NATIVEPHP_AZURE_CODE_SIGNING_ACCOUNT_NAME=...
```

(Or a traditional code-signing certificate via `signtool`.) Unsigned installers
trigger SmartScreen warnings.

### Linux — `.AppImage` + `.deb`
No signing required. Ship the AppImage (runs anywhere) and/or the `.deb`.

---

## 2. Microsoft Store — **feasible** (MSIX)

Verdict: **doable.** Package as an **MSIX full-trust "packaged desktop app"**
(Desktop Bridge). Full-trust means it runs *outside* the UWP sandbox with normal
Win32 rights — so the **bundled PHP binary, the queue-worker child process, and
raw UDP on port 4370 all keep working**.

Because NativePHP's build config only targets NSIS, this is a **manual override**:

1. **Partner Center account** — *Individual* is **free** (as of 2025; ID + selfie
   verification) or *Company* (~$99 one-time). Reserve the app name; note the
   assigned **Package Identity Name / Publisher (`CN=…`) / PublisherDisplayName**.
2. On a Windows 10/11 machine with the Windows SDK, produce an **MSIX**: either
   `electron-builder` with `win.target: "appx"` + an `appx` config block, or
   Electron Forge's MSIX maker with a hand-authored `Package.appxmanifest`.
   (This requires overriding NativePHP's bundled electron-builder config.)
3. In the manifest: `<Application EntryPoint="Windows.FullTrustApplication">` and
   declare `runFullTrust`; add `internetClientServer` + `privateNetworkClientServer`.
4. Set Identity Name / Publisher / PublisherDisplayName to **exactly** match
   Partner Center.
5. **Disable the auto-updater** for the Store build (the Store updates you).
6. Dev-sign locally, `Add-AppxPackage`, and **smoke-test**: app launches, spawns
   PHP, and reaches a device on UDP 4370.
7. Run **WACK** (Windows App Certification Kit) and fix findings.
8. Create the submission, upload the `.msix` (the Store re-signs), justify
   `runFullTrust` as an Electron/Desktop-Bridge app, and submit. Budget extra
   review time for the restricted capability.

---

## 3. Mac App Store — **hard, but possible** (not recommended first)

Verdict: **possible but a lot of manual, unsupported work.** The two things people
fear are actually fine:

- The **App Sandbox does NOT block spawning the bundled PHP binary** — non-`.app`
  child processes automatically inherit the parent's sandbox (confirmed by Apple
  DTS). NativePHP's spawn-PHP model is mechanically allowed.
- A **bundled interpreter running bundled code is not a §2.5.2 violation** (the
  rule targets code *downloaded at runtime*; iSH/Pyto/BeeWare ship interpreters).

What makes it hard (all **manual overrides NativePHP doesn't provide**):

- Add `com.apple.security.app-sandbox`, `network.client`, `network.server` to a
  new `build/entitlements.mas.plist`.
- Add `build/entitlements.mas.inherit.plist` containing **exactly**
  `app-sandbox` + `inherit` (any extra key aborts the PHP child).
- Add a login-helper entitlements file; **code-sign every** bundled binary and
  PHP extension `.so/.dylib` with the hardened runtime.
- **Relocate all writable paths** (SQLite DB, storage, cache, logs, sessions)
  into the sandbox container — the bundle is read-only.
- **Remove the NativePHP auto-updater** (downloading build artifacts violates
  §2.5.2 / MAS update policy — updates come only through the Store).
- Provision *Mac App Distribution* + *Mac Installer Distribution* certs, build the
  `pkg` via the `mas` target (not `dmg`), and submit.

**Recommendation:** ship the **notarized `.dmg`** (section 1) for Mac unless the
App Store is a hard requirement. It's the supported path and avoids all of the
above.

---

## 4. What's yours vs. mine

I can set up build config, entitlements, and CI. I **cannot** (these are yours):

- Create the **Apple Developer** / **Microsoft Partner Center** accounts or pay
  memberships.
- Hold or use your **signing certificates / Apple ID credentials**.
- **Submit** builds to either store.

Tell me which target you want to pursue first and I'll wire up the concrete build
configuration and a CI workflow for it.
