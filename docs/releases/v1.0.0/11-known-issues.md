# 11. Known Issues & Anomalies Log

**Release Version:** v1.0.0  
**Status:** Transparent Disclosure  

---

| Issue ID | Description | Severity | Risk to Quality/Safety | Operational Workaround |
| :--- | :--- | :---: | :---: | :--- |
| **ISSUE-01** | Exporting very large datasets (>10,000 complaints) in a single request may timeout. | Low | Negligible | Filter complaint exports by monthly or quarterly date range. |
| **ISSUE-02** | Rapid simultaneous toggle of investigation checklist items may cause minor UI flicker before server state reconciles. | Very Low | Negligible | Wait 500ms between checking consecutive multi-step tasks. Transactional integrity is fully preserved. |
