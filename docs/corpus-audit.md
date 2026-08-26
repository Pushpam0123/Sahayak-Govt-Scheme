# Sahayak Corpus Audit

**Date:** 2026-08-26  
**Auditor:** Sahayak Implementation Team (Phase 0 "Truth")  
**Corpus Manifest:** [`ingest/corpus.yaml`](../ingest/corpus.yaml)

---

## 1. Audit Methodology & Acceptance Criteria

To resolve the Phase 0 fabrication blocker (`generate_mock_guidelines()` inventing HTML whenever a download failed), every scheme in the 20-scheme catalogue was independently audited live against official Indian government portals (`.gov.in`, `.nic.in`, and official state government domains).

### Acceptance Bar:
1. **Live HTTP Confirmation:** HTTP 200 returned from an official government or dedicated scheme portal.
2. **Strict Content Validation:**
   - **PDFs:** Must start with `%PDF` magic bytes and meet the `MIN_PDF_BYTES = 10,000` size floor.
   - **HTML:** Must return `text/html` Content-Type and meet the `MIN_HTML_BYTES = 2,000` size floor.
3. **Provenance & Integrity:** SHA-256 checksum and timestamp recorded in `.meta.json` sidecars upon fetch.
4. **Human Eyeball Inspection:** Verification of the first page / header text to ensure the document is the authentic operational guideline or rules framework for the respective scheme.

---

## 2. Summary of Findings

Of the 20 schemes evaluated:
- **Verified Active Schemes (9):** Live, authentic official guideline PDFs verified, downloaded, and provenanced.
- **Unverified Inactive Schemes (11):** Official government guideline endpoints currently offline, failing DNS resolution, returning 404s, or requiring authenticated portal access. Left out of active manifest indexing.

| Scheme ID | Scheme Name | Verified Status | Format / Size | SHA-256 Checksum |
| :--- | :--- | :---: | :---: | :--- |
| `pm-kisan` | Pradhan Mantri Kisan Samman Nidhi | **VERIFIED** | PDF (824.6 KB, 12 pp) | `ae82cac83f61a5fa5049387a7c13e00c6d55cef0e9163deb5497dc86c86d697f` |
| `pm-fby` | Pradhan Mantri Fasal Bima Yojana | **VERIFIED** | PDF (1.23 MB, 99 pp) | `3c663bae70fa3a02bc4b8549a436ea5df2b0b55fc17d9efe3965fdde58b18685` |
| `pm-jjby` | Pradhan Mantri Jeevan Jyoti Bima Yojana | **VERIFIED** | PDF (111.6 KB, 3 pp) | `a184cbee3339abe0483e8d10a56f71f5d9e6eda6415660844940349e3d216745` |
| `pm-sby` | Pradhan Mantri Suraksha Bima Yojana | **VERIFIED** | PDF (87.6 KB, 3 pp) | `195a99298e85821bd84174c4973ad8f8be2ecf24cfb97f865799c702cae7feb5` |
| `atal-pension-yojana` | Atal Pension Yojana | **VERIFIED** | PDF (71.0 KB, 3 pp) | `69d42fa6fd66ef40ff53752ac3fd8d69b55ddc073a6299edbf2a65871830d88d` |
| `pm-matru-vandana` | Pradhan Mantri Matru Vandana Yojana | **VERIFIED** | PDF (2.72 MB, 119 pp) | `3111323d93100e3890c90281deef0af1b59de69f513781e5e636c3d6f901bcb6` |
| `stand-up-india` | Stand-Up India Scheme | **VERIFIED** | PDF (766.2 KB, 8 pp) | `1b113ee55492d4cdc4053696ec6bfc744516cb0dcca82b16a5522ed256224c48` |
| `mp-ladli-behna` | Mukhyamantri Ladli Behna Yojana | **VERIFIED** | PDF (954.0 KB, 29 pp) | `632b48161db1f6db91050ba21f3e007c10f5f703b66ae31ac99ca83bd7daf945` |
| `ka-gruha-jyothi` | Gruha Jyothi Scheme | **VERIFIED** | PDF (445.6 KB, 1 pp) | `37a21315beebb7dd90c33338e58e906dc93d8ab8509e564402cc5ccfe45a7982` |
| `pm-jay` | Ayushman Bharat PM-JAY | UNVERIFIED | N/A | N/A (portal timed out / no public guideline PDF) |
| `pmay-g` | Pradhan Mantri Awas Yojana - Gramin | UNVERIFIED | N/A | N/A (`pmayg.nic.in` DNS failure / rural endpoints 404) |
| `nsp-post-matric` | NSP Post-Matric Scholarship for SC | UNVERIFIED | N/A | N/A (`scholarships.gov.in` timed out / `dosje.gov.in` 404) |
| `pm-svanidhi` | PM SVANidhi | UNVERIFIED | N/A | N/A (portal returned 15B JS stub; MOHUA PDF 404) |
| `mid-day-meal` | PM POSHAN (Mid-Day Meal) | UNVERIFIED | N/A | N/A (`pmposhan.education.gov.in` returned 404) |
| `ts-rythu-bandhu` | Rythu Bandhu Scheme | UNVERIFIED | N/A | N/A (`rythubandhu.telangana.gov.in` DNS failure) |
| `wb-kanyashree` | Kanyashree Prakalpa | UNVERIFIED | N/A | N/A (`wbkanyashree.gov.in` connection refused) |
| `ap-ysr-cheyutha` | YSR Cheyutha Scheme | UNVERIFIED | N/A | N/A (`ysrcheyutha.ap.gov.in` DNS failure) |
| `odisha-kalia` | KALIA Scheme | UNVERIFIED | N/A | N/A (`kalia.odisha.gov.in` DNS failure) |
| `mh-shravan-bal` | Shravanbal Seva State Pension | UNVERIFIED | N/A | N/A (`sjsa.maharashtra.gov.in` guidelines route 404) |
| `bihar-student-credit-card` | Bihar Student Credit Card | UNVERIFIED | N/A | N/A (`7nischay-yuvaupmission.bihar.gov.in` DNS failure) |

---

## 3. Scheme-by-Scheme Audit Evidence

### 1. `pm-kisan` — Pradhan Mantri Kisan Samman Nidhi
- **Official URL:** `https://pmkisan.gov.in`
- **Verified Source URL:** `https://pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines(English).pdf`
- **Status:** Verified (200 OK, `application/pdf`, 824,649 bytes, 12 pages)
- **SHA-256:** `ae82cac83f61a5fa5049387a7c13e00c6d55cef0e9163deb5497dc86c86d697f`
- **First Page Inspection:** "PRADHAN MANTRI KISAN SAMMAN NIDHI SCHEME (PM-KISAN SCHEME) OPERATIONAL GUIDELINES (REVISED AS ON 29.03.2020) MINISTRY OF AGRICULTURE & FARMERS' WELFARE DEPARTMENT OF AGRICULTURE, COOPERATION & FARMERS WELFARE"

### 2. `pm-fby` — Pradhan Mantri Fasal Bima Yojana
- **Official URL:** `https://pmfby.gov.in`
- **Verified Source URL:** `https://pmfby.gov.in/pdf/Revised_Operational_Guidelines.pdf`
- **Status:** Verified (200 OK, `application/pdf`, 1,233,411 bytes, 99 pages)
- **SHA-256:** `3c663bae70fa3a02bc4b8549a436ea5df2b0b55fc17d9efe3965fdde58b18685`
- **First Page Inspection:** "OPERATIONAL GUIDELINES Pradhan Mantri Fasal Bima Yojana (PMFBY) (Revised) Department of Agriculture, Cooperation and Farmers Welfare Ministry of Agriculture & Farmers Welfare"

### 3. `pm-jjby` — Pradhan Mantri Jeevan Jyoti Bima Yojana
- **Official URL:** `https://www.jansuraksha.gov.in`
- **Verified Source URL:** `https://www.jansuraksha.gov.in/Files/PMJJBY/English/Rules.pdf`
- **Status:** Verified (200 OK, `application/pdf`, 111,635 bytes, 3 pages)
- **SHA-256:** `a184cbee3339abe0483e8d10a56f71f5d9e6eda6415660844940349e3d216745`
- **First Page Inspection:** "REVISED RULES FOR PRADHAN MANTRI JEEVAN JYOTI BIMA YOJANA (w.e.f. 1.6.2022) 1. Details of the scheme: PMJJBY is an insurance scheme offering life insurance cover for death due to any reason."

### 4. `pm-sby` — Pradhan Mantri Suraksha Bima Yojana
- **Official URL:** `https://www.jansuraksha.gov.in`
- **Verified Source URL:** `https://www.jansuraksha.gov.in/Files/PMSBY/English/Rules.pdf`
- **Status:** Verified (200 OK, `application/pdf`, 87,636 bytes, 3 pages)
- **SHA-256:** `195a99298e85821bd84174c4973ad8f8be2ecf24cfb97f865799c702cae7feb5`
- **First Page Inspection:** "RULES FOR THE PRADHAN MANTRI SURAKSHA BIMA YOJANA (With effect from 1.6.2022) DETAILS OF THE SCHEME: PMSBY is an Accident Insurance Scheme offering accidental death and disability cover"

### 5. `atal-pension-yojana` — Atal Pension Yojana
- **Official URL:** `https://www.jansuraksha.gov.in`
- **Verified Source URL:** `https://www.jansuraksha.gov.in/Files/APY/English/Rules.pdf`
- **Status:** Verified (200 OK, `application/pdf`, 71,016 bytes, 3 pages)
- **SHA-256:** `69d42fa6fd66ef40ff53752ac3fd8d69b55ddc073a6299edbf2a65871830d88d`
- **First Page Inspection:** "THE GAZETTE OF INDIA : EXTRAORDINARY [PART I—SEC. 1] ... ATAL PENSION YOJANA (APY)"

### 6. `pm-matru-vandana` — Pradhan Mantri Matru Vandana Yojana
- **Official URL:** `https://pmmvy.wcd.gov.in`
- **Verified Source URL:** `https://pmmvy.wcd.gov.in/Content/assets/PDF/MissionShaktiGuidelines.pdf`
- **Status:** Verified (200 OK, `application/pdf`, 2,722,100 bytes, 119 pages)
- **SHA-256:** `3111323d93100e3890c90281deef0af1b59de69f513781e5e636c3d6f901bcb6`
- **First Page Inspection:** "Government of India, Ministry of Women & Child Development, Mission Shakti Operational Guidelines (Samarthya sub-scheme covering Pradhan Mantri Matru Vandana Yojana)"

### 7. `stand-up-india` — Stand-Up India Scheme
- **Official URL:** `https://www.standupmitra.in`
- **Verified Source URL:** `https://www.standupmitra.in/Default/DownloadFile/Stand%20Up%20India%20-%20Brochure%20-%20English.pdf`
- **Status:** Verified (200 OK, `application/pdf`, 766,171 bytes, 8 pages)
- **SHA-256:** `1b113ee55492d4cdc4053696ec6bfc744516cb0dcca82b16a5522ed256224c48`
- **First Page Inspection:** "Guidelines for Stand Up India Scheme (www.standupmitra.in) - Objectives, Eligibility, Nature of Loan, Margin Money, and Security"

### 8. `mp-ladli-behna` — Mukhyamantri Ladli Behna Yojana (Madhya Pradesh)
- **Official URL:** `https://cmladlibahna.mp.gov.in`
- **Verified Source URL:** `https://cmladlibahna.mp.gov.in/Uploaded%20Document/UpcomingEvents/25072023014055LBY%20sanshodhit%20guideline.pdf`
- **Status:** Verified (200 OK, `application/pdf`, 953,951 bytes, 29 pages)
- **SHA-256:** `632b48161db1f6db91050ba21f3e007c10f5f703b66ae31ac99ca83bd7daf945`
- **First Page Inspection:** "मध्यप्रदेश शासन, महिला एवं बाल विकास विभाग - मुख्यमंत्री लाड़ली बहना योजना 2023 संशोधित दिशा-निर्देश"

### 9. `ka-gruha-jyothi` — Gruha Jyothi Scheme (Karnataka)
- **Official URL:** `https://sevasindhugs.karnataka.gov.in`
- **Verified Source URL:** `https://sevasindhugs.karnataka.gov.in/PDF/Gruha_Jyothi_Kannada.pdf`
- **Status:** Verified (200 OK, `application/pdf`, 445,642 bytes, 1 page)
- **SHA-256:** `37a21315beebb7dd90c33338e58e906dc93d8ab8509e564402cc5ccfe45a7982`
- **First Page Inspection:** "ಸರ್ಕಾರದ ಆದೇಶ ಸಂಖ್ಯೆ : ಎನರ್ಜಿ / 164/ಪಿಎಸ್ಆರ್/2023 ದಿನಾಂಕ: 05.06.2023, ಬೆಂಗಳೂರು “ಗೃಹ ಜ್ಯೋತಿ” ಯೋಜನೆ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು (Government Order & Guidelines on 200 units free power scheme)"

---

## 4. Unverified Schemes Audit Log

10. **`pm-jay` (Ayushman Bharat PM-JAY):** `pmjay.gov.in` timed out / down; `nha.gov.in` portal has no public unauthenticated guideline PDF download route.
11. **`pmay-g` (PMAY - Gramin):** `pmayg.nic.in` failed DNS resolution; `rural.nic.in` failed DNS resolution; `rural.gov.in` endpoint returned 404.
12. **`nsp-post-matric` (NSP Post-Matric SC Scholarship):** `scholarships.gov.in` timed out; `socialjustice.gov.in` timed out; `dosje.gov.in` scheme detail route returned 404.
13. **`pm-svanidhi` (PM SVANidhi):** `pmsvanidhi.mohua.gov.in` ViewFile route returned a 15-byte javascript stub; `mohua.gov.in` static upload links 404.
14. **`mid-day-meal` (PM POSHAN):** `pmposhan.education.gov.in` and ministry links returned 404 / timed out.
15. **`ts-rythu-bandhu` (Rythu Bandhu):** `rythubandhu.telangana.gov.in` failed DNS resolution (domain unreachable).
16. **`wb-kanyashree` (Kanyashree Prakalpa):** `wbkanyashree.gov.in` connection refused.
17. **`ap-ysr-cheyutha` (YSR Cheyutha):** `ysrcheyutha.ap.gov.in` and `navasakam.ap.gov.in` failed DNS resolution.
18. **`odisha-kalia` (KALIA):** `kalia.odisha.gov.in` failed DNS resolution; `agri.odisha.gov.in` does not host the KALIA guideline document.
19. **`mh-shravan-bal` (Shravanbal Seva):** `sjsa.maharashtra.gov.in/en/shravanbal-scheme.html` returned 404.
20. **`bihar-student-credit-card` (Bihar Student Credit Card):** `7nischay-yuvaupmission.bihar.gov.in` failed DNS resolution.
