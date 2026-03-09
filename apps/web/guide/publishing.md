# Publishing

When you are ready to ship your extension, Epos exports your project as a normal Manifest V3 extension bundle.

You do not publish the project folder itself, and you do not publish the Epos development environment. You publish the exported result.

## Before You Export

At minimum, check these fields in `epos.json`:

- `name`
- `version`
- `description`
- `icon`

Those are the fields most visible to users and store reviewers.

You should also review:

- `permissions`
- `optionalPermissions`
- `hostPermissions`
- `optionalHostPermissions`

Make sure they match what your extension actually does.

## Exporting

Open your project in [app.epos.dev](https://app.epos.dev) and use the **Export** button.

Epos generates an export bundle for your project and downloads it as a ZIP file.

## What the Export Contains

The exported bundle is a standard browser extension package. It includes:

- a generated `manifest.json`,
- your project sources and assets,
- the Epos runtime files needed to run the project,
- a prepared `icon.png`.

In other words, the export is self-contained. It does not depend on the `app.epos.dev` tab staying open, and it does not bundle unrelated projects.

## What Gets Generated

During export, Epos turns your `epos.json` into a real extension manifest.

That means fields like these affect the final package:

- `targets`
- `permissions`
- `hostPermissions`
- `action`
- `popup`
- `manifest`

If the exported extension behaves unexpectedly, the first place to check is usually your `epos.json`.

## Test the Export

Before submitting to a store, it is a good idea to test the exported package as a standalone extension.

A simple workflow is:

1. Export the ZIP.
2. Unpack it locally.
3. Load it as an unpacked extension in Chrome.
4. Test the popup, background behavior, content scripts, and permissions.

This helps catch configuration mistakes before review.

## Chrome Web Store Notes

When submitting to the Chrome Web Store, you will usually need:

- the exported ZIP,
- a clear description,
- screenshots,
- permission justifications for sensitive permissions,
- a version number that is correct for the release.

If your extension requests broad host access or sensitive permissions, expect closer review.

## A Good Habit

Treat export as a release boundary.

During development, Epos can smooth over a lot of workflow details. The exported extension is the real product. Test that version directly before you publish.
