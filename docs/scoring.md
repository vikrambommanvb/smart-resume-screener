# Scoring Engine Specification

## 1. Principles
The scoring engine evaluates the alignment between a candidate's resume and a target job description or role profile using deterministic algorithms. **LLMs never compute or tweak this score.**

## 2. Component Weights and Formulation

The total match score is out of 100 points:

$$\text{Score} = \text{Skills} + \text{Responsibilities} + \text{Experience} + \text{Projects} + \text{Education}$$

```
+------------------------------------+------------+
| Component                          | Max Points |
+------------------------------------+------------+
| 1. Required & Preferred Skills     |     40     |
| 2. Responsibilities Semantic Fit   |     25     |
| 3. Experience & Seniority Level    |     15     |
| 4. Project & Evidence Relevance    |     15     |
| 5. Education & Certifications      |      5     |
+------------------------------------+------------+
| Total                              |    100     |
+------------------------------------+------------+
```

### 2.1 Skills Match (40 pts)
- **Credit mapping:**
  - Matched with verified evidence in projects/experience: **1.0**
  - Matched but only listed in skills section: **0.6**
  - Adjacent / implied via taxonomy graph: **0.5** (or explicit edge weight)
  - Missing: **0.0**
- If preferred skills are present in the JD:
  $$\text{Coverage} = 0.8 \times \text{RequiredCoverage} + 0.2 \times \text{PreferredCoverage}$$
  If no preferred skills are specified, `RequiredCoverage` takes 100% of the weight.
- Skill score = $\text{Coverage} \times 40$.

### 2.2 Responsibilities Fit (25 pts)
- Uses `sentence-transformers/all-MiniLM-L6-v2` embeddings.
- For each responsibility sentence in the JD, compute cosine similarity against all resume bullet chunk embeddings.
- Take the maximum cosine similarity $s$ and apply piecewise linear calibration:
  - $s \le 0.30 \implies 0.0$
  - $s \ge 0.70 \implies 1.0$
  - $0.30 < s < 0.70 \implies \frac{s - 0.30}{0.70 - 0.30}$
- Responsibilities score = $\text{mean}(\text{CalibratedSims}) \times 25$.

### 2.3 Experience Level (15 pts)
- Extracts candidate years of experience from parsed employment date ranges and titles.
- Compares to JD required years:
  - Meets or exceeds required years: 15 pts.
  - Partial experience: linearly scaled down.
- **Fresher Protections:** For entry-level/junior roles requiring 0-1 years of experience, a candidate with academic or internship projects receives the **full 15 points**. A lack of traditional full-time experience is not penalised.

### 2.4 Project and Evidence Relevance (15 pts)
- Evaluates the semantic similarity of detailed project descriptions against the JD domain (10 pts).
- Awards bonus points for demonstrated applied skill usage with verified evidence vs bare keyword mentions (5 pts).

### 2.5 Education and Certifications (5 pts)
- Degree level (B.S., M.S., Ph.D.) and discipline relevance (Computer Science, Data Science, Electrical Engineering, etc.) contribute up to 3 pts.
- Verified certifications matching the role domain contribute up to 2 pts.
- **Fairness Guarantee:** Institution ranking, prestige, country of origin, and GPA are never factored in.

### 2.6 Renormalisation
If a job description does not specify an experience requirement or education requirement, the missing component's weight is redistributed proportionally among the active components, and a notice is included in the breakdown.

### 2.7 Counterfactual Biggest Movers
For each missing required skill, the engine deterministically recalculates what the score would be if that skill were matched with evidence. The top 3 skills yielding the largest $\Delta\text{Score}$ are surfaced as high-impact growth opportunities.

---

## 3. Resume Health Score (100 pts)
Independent of any JD:
- **Content Strength (30 pts):** Action verbs, quantified metrics, bullet length (8-28 words), absence of passive clichés.
- **Structure & Sections (20 pts):** Required sections present, reverse-chronological order, page budget (1 page for <5 yrs).
- **ATS Friendliness (20 pts):** Extractable text layer, single/two-column stream continuity, absence of parsing hazards.
- **Readability & Concision (15 pts):** Sentence clarity, buzzword density, absence of unbulleted text walls.
- **Consistency (10 pts):** Date formats, punctuation uniformity, capitalisation.
- **Contact & Links (5 pts):** Email, phone, and professional profiles present.

