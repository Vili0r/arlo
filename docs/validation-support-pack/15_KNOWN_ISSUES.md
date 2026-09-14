# 15. Known Issues & Anomalies Log

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-15  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  

---

## 1. Transparency Policy

In regulated life sciences, concealing known bugs or anomalies violates regulatory transparency expectations. Arlo actively documents known software anomalies, evaluates their risk to device quality and patient safety, and provides verified operational workarounds until remediated in a scheduled patch release.

---

## 2. Active Known Anomalies Registry (v1.0.0)

| Issue ID | Description & Affected Workflow | Severity | Patient/QMS Risk | Operational Workaround | Remediation Status |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **ISSUE-01** | Exporting very large datasets (>10,000 complaints) in a single synchronous request may encounter browser gateway timeout (HTTP 504). | Low | Negligible | Filter complaint exports by date range (e.g. quarterly or monthly bundles) rather than full multi-year single downloads. | Asynchronous streaming export scheduled for v1.1.0. |
| **ISSUE-02** | Rapid simultaneous toggle of investigation checklist items may trigger optimistic UI flicker before server state reconciles. | Very Low | Negligible | Wait 500ms between checking consecutive multi-step tasks. Database transactional integrity is fully maintained. | UI debounce optimization scheduled for v1.0.1. |
| **ISSUE-03** | Dark mode contrast on specific secondary badges in legacy Safari browsers (<v16.4) exhibits muted saturation. | Minimal | None | Use modern Chromium, Firefox, or Safari 17+. Data display is unaffected. | CSS color variable patch in v1.0.1. |

---

## 3. Critical Safety Statement

As of release `v1.0.0`, there are **ZERO (0)** known critical defects, zero data integrity vulnerabilities, zero cross-tenant access flaws, and zero electronic signature bypass conditions.
