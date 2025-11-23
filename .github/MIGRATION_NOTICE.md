# ⚠️ MIGRATION NOTICE: Base44 → Native Stack

## 🎯 Project Direction

**ALL future development must work towards eliminating Base44 dependency.**

This project is undergoing a **complete migration from Base44 BaaS to native Node.js/PostgreSQL stack**.

---

## 📋 Migration Status

🚧 **Status:** IN PROGRESS
📅 **Started:** 2025-11-23
📊 **Progress:** See [MIGRATION.md](../MIGRATION.md)

---

## 🚫 What NOT to Do

❌ **DO NOT** add new Base44 dependencies
❌ **DO NOT** create new Base44 functions
❌ **DO NOT** extend Base44 integrations
❌ **DO NOT** rely on Base44-specific features

---

## ✅ What TO Do

✅ **DO** use native Node.js/Express patterns
✅ **DO** write database-agnostic code
✅ **DO** use standard REST APIs
✅ **DO** implement JWT authentication
✅ **DO** refer to [MIGRATION.md](../MIGRATION.md) for guidelines

---

## 📖 For New Contributors

Before working on this project, please:

1. **Read** [MIGRATION.md](../MIGRATION.md) - Full migration plan
2. **Understand** we are moving AWAY from Base44
3. **Check** migration progress before adding features
4. **Ask** if unsure whether to use Base44 or native approach

---

## 🔄 Migration Phases

Current phase and next steps are tracked in [MIGRATION.md](../MIGRATION.md)

---

## 📞 Questions?

For migration-related questions:
- Check [MIGRATION.md](../MIGRATION.md)
- Open an issue with `[MIGRATION]` tag
- Contact the development team

---

**Last Updated:** 2025-11-23
