# 🤝 Contributing to VibeAI FoldSpace

Thank you for your interest in contributing to VibeAI FoldSpace! This document explains how to report bugs, request features, and contribute to the project.

---

## 🐛 Reporting Bugs

Found a bug? We want to know about it!

### Before Submitting

1. **Check existing issues**: Search [GitHub Issues](https://github.com/hugonomy/vibeai-foldspace/issues) to see if it's already reported
2. **Verify it's a bug**: Make sure it's not a configuration issue or browser incompatibility
3. **Test on latest version**: Update to the latest version and see if the bug persists

### How to Report

**Submit a bug report**: [Create New Issue](https://github.com/hugonomy/vibeai-foldspace/issues/new)

**Include the following information**:

#### Required Information

- **Browser**: Chrome / Edge / Brave (include version)
- **Operating System**: Windows / Mac / Linux (include version)
- **Extension Version**: Check `chrome://extensions/` for VibeAI version
- **Platform**: ChatGPT / Claude / Gemini / Copilot (where bug occurred)

#### Bug Details

- **Clear title**: Summarize the bug in one sentence
  - ✅ Good: "HUD doesn't appear on Claude.ai after page refresh"
  - ❌ Bad: "It's broken"

- **Steps to reproduce**:
  ```
  1. Go to chatgpt.com
  2. Click the lexicon toggle button
  3. Refresh the page
  4. Notice HUD is missing
  ```

- **Expected behavior**: What should happen?
- **Actual behavior**: What actually happens?
- **Screenshots**: If applicable, add screenshots to help explain
- **Console logs**:
  - Press `F12` to open Developer Tools
  - Go to **Console** tab
  - Copy any red error messages
  - Paste in issue report

#### Example Bug Report

```markdown
**Bug**: HUD opacity slider doesn't persist after page refresh

**Browser**: Chrome 120.0.6099.109
**OS**: Windows 11
**Extension**: v2.14.1
**Platform**: ChatGPT

**Steps to reproduce**:
1. Open ChatGPT
2. Drag opacity slider to 80%
3. Refresh the page
4. Opacity resets to default

**Expected**: Opacity should remain at 80%
**Actual**: Opacity resets to ~40%

**Console errors**: None

**Screenshot**: [Attached]
```

---

## 💡 Requesting Features

Have an idea to make VibeAI better?

### How to Request

**Submit a feature request**: [Create New Issue](https://github.com/hugonomy/vibeai-foldspace/issues/new)

**Include**:

1. **Clear title**: "Feature Request: [Your idea]"
2. **Problem statement**: What problem does this solve?
3. **Proposed solution**: How would this feature work?
4. **Alternatives considered**: Any other solutions you thought about?
5. **Use case**: When would you use this feature?

#### Example Feature Request

```markdown
**Feature Request**: Add keyboard shortcut to toggle HUD visibility

**Problem**:
I frequently need to take screenshots without the HUD visible, but clicking the minimize button is slow.

**Proposed Solution**:
Add a keyboard shortcut (e.g., Ctrl+Shift+H) to instantly show/hide the HUD.

**Alternatives**:
- Right-click menu on extension icon
- Browser toolbar button

**Use Case**:
Taking clean screenshots of AI conversations for documentation.
```

---

## 🔧 Contributing Code

**Note**: VibeAI FoldSpace is currently under patent-pending protection. Code contributions that modify the HugoScore algorithm or core emotional analysis logic cannot be accepted.

### What Can Be Contributed

✅ **Bug fixes** (UI, rendering, compatibility issues)
✅ **Platform support** (new AI chat platforms)
✅ **Documentation improvements**
✅ **Translation/localization**
✅ **Accessibility enhancements**
✅ **Performance optimizations**

❌ **Cannot accept**:
- Changes to HugoScore algorithm
- Modifications to emotional tone logic
- Reimplementations of core IP

### Contribution Process

1. **Fork the repository**
   ```bash
   git clone https://github.com/hugonomy/vibeai-foldspace.git
   cd vibeai-foldspace
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b fix/my-bug-fix
   ```

3. **Make your changes**
   - Follow existing code style
   - Test on all 4 platforms (ChatGPT, Claude, Gemini, Copilot)
   - Verify no performance regressions

4. **Test the build**
   ```bash
   npm run build
   ```

5. **Commit your changes**
   ```bash
   git commit -m "Fix: HUD opacity persistence issue"
   ```

6. **Push to your fork**
   ```bash
   git push origin fix/my-bug-fix
   ```

7. **Open a Pull Request**
   - Go to the [main repository](https://github.com/hugonomy/vibeai-foldspace)
   - Click **Pull Requests** → **New Pull Request**
   - Select your fork and branch
   - Describe your changes

### Code Style Guidelines

- **JavaScript**: Follow ESLint rules (`.eslintrc.json`)
- **Comments**: Explain *why*, not *what*
- **Naming**: Use descriptive variable names
- **Functions**: Keep functions small and focused
- **No dependencies**: Avoid adding npm packages to runtime code

---

## 📖 Improving Documentation

Documentation contributions are always welcome!

### How to Help

- **Fix typos**: Submit PRs for typo fixes in README, guides, etc.
- **Add examples**: Show how to use VibeAI in different scenarios
- **Create tutorials**: Write guides for specific use cases
- **Improve clarity**: Simplify complex explanations

### Documentation Files

- [README.md](./README.md) - Main project overview
- [INSTALLATION.md](./INSTALLATION.md) - Installation instructions
- [ABOUT.md](./ABOUT.md) - Project background and vision
- [CONTRIBUTING.md](./CONTRIBUTING.md) - This file
- [docs/privacy.html](./docs/privacy.html) - Privacy policy

---

## 🌐 Localization

Interested in translating VibeAI to other languages?

### Translation Targets

- HUD interface labels
- Lexicon tooltips (Youth/Professional)
- Installation guide
- README documentation

**Contact**: Email hugonomysystems@gmail.com to coordinate translation efforts.

---

## ✅ Code of Conduct

### Expected Behavior

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy toward others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban from contributing
3. Permanent ban from the project

Report violations to: hugonomysystems@gmail.com

---

## 🔒 Security Issues

**Do not open public issues for security vulnerabilities.**

If you discover a security issue:

1. **Email**: hugonomysystems@gmail.com
2. **Subject**: "Security: [Brief description]"
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue before public disclosure.

---

## 📧 Questions?

Not sure if your issue is a bug, feature request, or something else?

- **Email**: hugonomysystems@gmail.com
- **GitHub Discussions**: [Start a discussion](https://github.com/hugonomy/vibeai-foldspace/discussions)
- **Substack**: [glyphweaveralpha.substack.com](https://glyphweaveralpha.substack.com)

---

## 🙏 Thank You

Every contribution helps make VibeAI FoldSpace better for everyone. Whether it's a bug report, feature idea, or code contribution, we appreciate your support!

**Together, we're building emotional infrastructure for the AI age.** 🌌
