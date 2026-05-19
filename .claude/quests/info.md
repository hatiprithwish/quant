# 5/3/1 Planasy — Trajectory Intelligence Feature

### Product Requirements Document · v1.0 · May 2026

|              |                              |
| ------------ | ---------------------------- |
| **Version**  | v1.0 — Initial Release       |
| **Status**   | Draft — Ready for Review     |
| **Date**     | May 2026                     |
| **Audience** | Product, Engineering, Design |

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [The Vision Vault](#2-the-vision-vault)
3. [The Scoring Engine](#3-the-scoring-engine)
4. [Feature Specifications](#4-feature-specifications)
5. [Data Model](#5-data-model)
6. [Scope & Phasing](#6-scope--phasing)
7. [Out of Scope (v1)](#7-out-of-scope-v1)
8. [Open Questions](#8-open-questions)

---

## 1. Product Overview

### 1.1 Executive Summary

The **5/3/1 Planasy Trajectory Intelligence Feature** is a life-tracking system built on a single, powerful premise: a big, audacious vision of your future is nothing more than a fantasy — until you reverse engineer it into a daily decision-making framework. This feature transforms that framework into a living, scoring, self-correcting engine that answers one question at every moment:

> **📍 The Core Question**
> Based on your actual decisions and behaviors this week, is your life trajectory pointing toward your 5-year vision — or quietly drifting away from it?

Most life planning tools let users write goals. This feature does something fundamentally different — it scores present behavior against a future self, operates as a dual-decision framework for daily life, and makes the cost of trajectory drift visible before it becomes irreversible.

---

### 1.2 The 5/3/1 Planasy Framework — Foundation

The feature is built on the five-phase reverse engineering methodology:

| Phase   | Time Horizon | Name              | Core Purpose                                                        |
| ------- | ------------ | ----------------- | ------------------------------------------------------------------- |
| Phase 1 | 5 Years      | The Horizon       | Define the ultimate optimized lifestyle and Escape Number           |
| Phase 2 | 3 Years      | The Momentum Mark | Structural tipping point — halfway to the 5-year vision             |
| Phase 3 | 1 Year       | The Foundation    | Foundational blocks — proof of concept, first customers, skills     |
| Phase 4 | 90 Days      | The Critical Path | Single macro-problem to solve; shortest path to next milestone      |
| Phase 5 | 7 Days       | The Daily Grind   | Explicit actions for the week + what must be eliminated immediately |

---

### 1.3 Problem Statement

Users can write beautiful life plans. The problem is they have no mechanism that:

- Holds them accountable to those plans beyond a mood-driven revisit
- Prevents impulsive goal changes during low-motivation periods
- Translates macro vision into a daily, scoreable behavior signal
- Shows them mathematically where their current trajectory actually lands them — not where they hope it lands them

> **⚠️ The Core Problem**
> Without a trajectory scoring engine, users confuse activity with alignment. They feel busy but drift. The 5/3/1 Trajectory Feature closes that gap.

---

### 1.4 Goals & Success Metrics

| Goal                             | Success Metric                                                     | Target                |
| -------------------------------- | ------------------------------------------------------------------ | --------------------- |
| Accurate trajectory measurement  | Weekly score correlation with quarterly milestone completion       | > 0.75 correlation    |
| Prevent impulsive goal changes   | Reduction in mid-cycle goal edits after XP penalty launch          | > 40% reduction       |
| Drive weekly engagement          | Weekly check-in completion rate                                    | > 65% of active users |
| Retention through accountability | 30-day retention of users who complete their first quarterly score | > 70%                 |
| Decision framework adoption      | Decision Evaluator tool usage per active user per week             | > 3 uses/week         |

---

## 2. The Vision Vault

The Vision Vault is the **single source of truth** for the entire feature. Every score, every drift calculation, and every decision evaluation is measured against what lives here. It is entered once per phase and enforced with strict edit controls.

---

### 2.1 Structure of the Vault

The Vault holds five nested layers, each feeding into the next:

| Layer            | Time Horizon | Mutability                                            | Key Input Fields                                                                                                    |
| ---------------- | ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 5-Year Vision    | 60 months    | Editable once/year                                    | Lifestyle blueprint, location, work type, relationships, Escape Number (exact pre-tax figure for financial freedom) |
| 3-Year Milestone | 36 months    | Editable every 6 months                               | Halfway targets, business traction markers, recurring cash flow targets, customer base goals                        |
| 1-Year Runway    | 12 months    | Editable once/quarter                                 | Launches, skill acquisition goals, proof of concept targets, business registration, first paying customers          |
| Quarterly Plan   | 90 days      | Editable at start of each quarter; locked mid-quarter | Single macro-milestone, macro-problem to solve (problemology), Critical Path definition                             |
| Weekly Plan      | 7 days       | Fully editable every Monday                           | Explicit action list, elimination list (what to stop), self-reported confidence score (1–10)                        |

---

### 2.2 The Escape Number

The Escape Number is a first-class data field inside the 5-Year Vision layer. It is defined as: **the exact pre-tax mathematical figure the user needs to earn and invest into a passive income system to make work entirely optional.**

- Stored as a hard numeric value — not a range, not a vague target
- Displayed persistently throughout the app as a motivational anchor
- Used by the Compound Projector to calculate whether current financial behaviors reach this number within 5 years
- If the Escape Number is changed, a large XP penalty applies (same as 5-year vision edit penalty)

---

### 2.3 Goal Stability Mechanic — Lock-In System

One of the most critical behavioral design decisions in the product: **goal volatility kills trajectory.** Users in low-motivation states tend to revise goals downward. The Lock-In System makes changing higher-level goals feel costly — because it is.

#### 2.3.1 Edit Windows & XP Penalties

| Layer            | Allowed Edit Window             | Mid-Cycle Edit Penalty | Cooling-Off Period             |
| ---------------- | ------------------------------- | ---------------------- | ------------------------------ |
| 5-Year Vision    | Once per calendar year          | −500 XP                | 30 hours before change commits |
| 3-Year Milestone | Every 6 months                  | −300 XP                | 30 hours before change commits |
| 1-Year Runway    | Once per quarter                | −150 XP                | 30 hours before change commits |
| Quarterly Plan   | Start of each 90-day block only | −50 XP                 | 30 hours before change commits |
| Weekly Plan      | Every Monday (fully fluid)      | No penalty             | No cooling-off period          |

#### 2.3.2 The 30-Hour Cooling-Off Period

When a user requests a goal edit on any layer above the weekly plan, the system does not commit the change immediately. Instead:

1. User submits a change request with a required reason field ("Why is this goal changing?")
2. System flags it as "Pending Change" and displays a 30-hour countdown timer
3. The XP deduction is shown prominently — the user sees exactly what they will lose
4. During the 30-hour window, the user can cancel the change at any time with no penalty
5. After 30 hours, if not cancelled, the change commits and the XP is deducted

> **💡 Design Rationale**
> The 30-hour window separates genuine life pivots from emotional reactions. If a user still wants the change after sleeping on it twice, it was probably real. If they cancel, they saved themselves the XP hit — and likely their trajectory.

#### 2.3.3 Pivot vs. Panic Classification

The reason field in the change request is not cosmetic. It feeds into the Goal Stability Score (used in the yearly scoring engine). Reasons are tagged as:

- **Legitimate Pivot:** New market information, major life event, health change, relocation — system applies reduced weight penalty to Goal Stability Score
- **Emotional Revision:** Short-term motivation dip, comparison to others, boredom — full weight applied to Goal Stability Score, notification sent reminding user of original commitment

---

## 3. The Scoring Engine

The Scoring Engine is the mathematical core of the feature. It operates as a **four-tier, nested, compounding system** where each lower layer directly influences the one above it. The engine does not reward activity — it rewards **aligned activity**. Gaming one layer without real progress in another is caught by the drift calculation.

> **🔑 Core Design Principle**
> The engine measures INPUTS and DECISIONS — not just outputs. Because inputs over the next 90 days are the only things actually controllable. The outputs 5 years from now are just math.

---

### 3.1 Weekly Score (0–100)

The most granular and behavior-driven layer. Resets every Monday. Fast feedback loop. Calculated from four weighted inputs:

| Input Component          | Weight | Measurement Method                                                                                 |
| ------------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| Task Completion Rate     | 40%    | Tasks completed ÷ tasks planned that week (weighted by task phase-relevance tag — see Section 3.5) |
| Elimination Score        | 25%    | Bad habits or distractions user committed to stopping — binary yes/no per item, averaged           |
| Decision Alignment Score | 25%    | Choices that week evaluated against quarterly target — self-reported + system-prompted check-ins   |
| Self-Reported Confidence | 10%    | User rates their week 1–10 on Monday check-in; low weight intentionally — behavior data dominates  |

**Confidence Score Cross-Validation:** If self-reported confidence is ≥ 8 but task completion is ≤ 30%, the system flags an inconsistency and notifies the user. Inflated confidence scores that repeatedly contradict behavioral data are down-weighted automatically in subsequent weeks.

---

### 3.2 Quarterly Score (0–100)

A rolling aggregate across 13 weeks, but not a simple average. Two major mechanisms differentiate it:

#### 3.2.1 Recency Weighting

Recent weeks reflect current trajectory more accurately than historical weeks. The weighting is:

| Week Range            | Weight Multiplier | Rationale                                            |
| --------------------- | ----------------- | ---------------------------------------------------- |
| Week 13 (most recent) | 2.0×              | Current trajectory signal — highest predictive value |
| Weeks 10–12           | 1.5×              | Near-term behavior — strong signal                   |
| Weeks 5–9             | 1.0×              | Mid-quarter — baseline weight                        |
| Weeks 1–4             | 0.75×             | Early quarter — lowest weight, often setup phase     |

#### 3.2.2 Consistency Multiplier

A user with weekly scores of 85, 83, 87, 84 is fundamentally different from one with scores of 40, 95, 30, 90 — even if the averages are similar. **Volatility is a risk signal.** Consistent execution earns a bonus:

- Low variance across 13 weekly scores → +10–15% quarterly score bonus
- High variance (boom/bust pattern) → no bonus; may apply slight suppression
- Variance calculated as standard deviation of weekly scores across the quarter

#### 3.2.3 Milestone Completion Factor

Weekly scores alone are insufficient — a user could score well behaviorally but never actually ship anything. The quarterly score therefore also measures **actual milestone completion** independent of weekly behavior:

> **Quarterly Score Formula**
> `Quarterly Score = (Recency-Weighted Weekly Aggregate × Consistency Multiplier × 60%) + (Milestone Completion % × 40%)`

This forces honesty. Consistently good weekly scores do not save a user who never completes their quarterly milestone. The milestone factor is binary per milestone and averaged across all milestones defined at the start of the quarter.

---

### 3.3 Yearly Score (0–100)

The most strategic scoring layer. Aggregates four quarters but also introduces two additional measurement factors that cannot be gamed by good weekly scores:

| Component                          | Weight               | What It Measures                                                                                                            |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Quarterly Score Aggregate          | 60%                  | Recency-weighted average of all 4 quarterly scores — Q4 weighted highest, Q1 lowest                                         |
| Milestone Completion               | 40%                  | Did the user hit their stated 1-year runway targets? Measured as % of annual milestones completed                           |
| Financial / Output Metric Progress | Within milestone %   | Escape Number approach rate, revenue targets, skill acquisition markers — embedded within milestone completion measurement  |
| Goal Stability Penalty             | Suppression modifier | Applied as a score suppressor — frequent goal changes during the year reduce the final yearly score regardless of execution |

#### 3.3.1 Quarterly Recency Weighting (within Yearly Score)

- Q4 (most recent): 2.0× weight
- Q3: 1.5× weight
- Q2: 1.0× weight
- Q1: 0.75× weight

---

### 3.4 Five-Year Score (0–100)

The macro layer. Updated annually. Measures **drift accumulation** — how far the user's actual trajectory has deviated from the reverse-engineered path over time. This is the ultimate signal of whether the entire system is working.

| Component              | Weight | What It Measures                                                                                                         |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| Yearly Score Aggregate | 50%    | Recency-weighted average across all yearly scores in the 5-year window                                                   |
| Escape Number Progress | 30%    | Mathematical proximity to the defined Escape Number — tracks passive income, investment, and financial milestone markers |
| Goal Stability Score   | 20%    | Cumulative score reflecting how many times goals were changed across all layers, weighted by XP penalty severity         |

---

### 3.5 Task Weighting & Phase-Relevance Tags

To prevent gaming via trivial task completion, every task carries a **phase-relevance tag** that determines its weight in the scoring engine. A task tagged to the current quarterly Critical Path counts more than a low-leverage daily administrative task.

| Tag Level                 | Example Task                                  | Score Weight Multiplier |
| ------------------------- | --------------------------------------------- | ----------------------- |
| Critical Path (Quarterly) | Launch landing page for first paying customer | 2.0×                    |
| Foundation (Annual)       | Complete backend API for core product feature | 1.5×                    |
| Skill Acquisition         | Complete 10-hour coding course module         | 1.25×                   |
| Supporting / Admin        | Organize business expense spreadsheet         | 0.75×                   |
| Elimination Task          | Zero doom-scrolling sessions logged this day  | 1.0× (binary)           |

---

### 3.6 The Drift Variable — Threading All Layers

The single most important calculation in the engine. The **Drift Score** flows upward through all four score layers and represents the gap between:

- **Current Trajectory:** Where you will mathematically land based on present behavior rate
- **Vision Trajectory:** Where the 5-year vision says you should be at this point in time

> **⚡ Drift Score Impact**
> If Drift Score is large, it suppresses scores at every level regardless of how good individual weekly inputs look. A user cannot feel good about their scores while quietly drifting away from their 5-year vision. Drift Score is the engine's honesty mechanism.

Drift Score is expressed as a single number (0–100, where 0 = fully on track, 100 = maximum drift) and is displayed persistently as a health indicator across all dashboards.

---

### 3.7 Engineering Challenges & Design Decisions

#### 3.7.1 Normalization

Tasks vary enormously in size and importance. The phase-relevance tagging system (Section 3.5) addresses this but implementation requires:

- Tag assignment at task creation time — user-selected, not auto-inferred
- Tag validation: if >80% of weekly tasks are tagged "Critical Path," the system prompts user to reconsider — over-tagging is a signal of label gaming
- Weekly score cannot exceed 85 if fewer than 2 Critical Path tasks are included — incentivizes high-leverage work

#### 3.7.2 Sparse Data Problem

Early weeks and early quarters have too little data for accurate scoring. Mitigation:

- Weeks 1–2 of a new quarter: scores displayed with a "Confidence: Low" indicator
- Minimum 3 weeks of data required before quarterly score is considered reliable
- Score displayed as a range (e.g., 62–78) with narrowing confidence interval as data accumulates

#### 3.7.3 Subjectivity Calibration

Self-reported inputs (confidence, elimination score, decision alignment) require guardrails:

- Confidence cross-validation: if self-reported ≥ 8 but task completion ≤ 30%, flag inconsistency
- Elimination score requires at least one time-based behavioral data point to validate (e.g., screen time reduction, logged session counts)
- Decision alignment is cross-validated against weekly plan tags — if user marks 9/10 alignment but completed zero Critical Path tasks, inconsistency flagged

#### 3.7.4 Build Order Recommendation

> **🏗️ Recommended Build Sequence**
> Build the Weekly Score engine first. Get that calculation tight, transparent, and trustworthy. Then build the Quarterly layer on top. Then Yearly. Do not architect all five layers simultaneously — compounding logic only works if the base layer is solid and validated against real user behavior.

---

## 4. Feature Specifications

### 4.1 The Vision Vault (Input Layer)

The structured onboarding and ongoing input system for all five planning layers.

**User Flow:**

1. User enters the Vault for the first time via guided onboarding — prompted to fill phases from 5-Year down to Weekly
2. Each phase has a structured form with specific required fields and optional narrative sections
3. 5-Year Vision requires the Escape Number as a mandatory numeric field before the Vault is considered complete
4. Vault shows completion percentage — all five layers must be complete before scoring activates
5. Weekly plan is the only layer re-filled every week — prompted every Monday morning

---

### 4.2 The Trajectory Score Dashboard

The central screen of the feature. Displays all three live scores and their relationships.

**Dashboard Components:**

- **Weekly Score Ring:** Large circular progress indicator, 0–100, color-coded (green ≥ 70, amber 40–69, red < 40)
- **Quarterly Score Bar:** Progress bar with current score, consistency indicator, and milestone completion %
- **Yearly Score:** Compact card showing year-to-date score and quarterly breakdown
- **Drift Score Banner:** Always-visible persistent indicator showing overall trajectory health — suppresses complacency
- **Escape Number Tracker:** Shows current proximity to the Escape Number as a % and projected arrival date
- **Score Relationship Visualization:** A simple flow diagram showing how weekly → quarterly → yearly → 5-year scores connect and influence each other

---

### 4.3 The Drift Detector

Proactive alerting system that surfaces trajectory misalignment **before** it becomes irreversible. The most underrated feature in the product.

**Drift Alerts:**

- Triggered when behavioral data suggests the user will miss a stated milestone at current rate
- **Example alert:** "Your Escape Number requires a 30% savings rate. You've logged 8% for 6 consecutive weeks. At this rate, you reach financial freedom in 19 years, not 5."
- Alert shows two timelines: current trajectory vs. required trajectory — gap expressed in years, not just percentages
- Drift alerts trigger at: 2 consecutive bad weeks, 1 bad month, or any quarterly score < 45
- Alert is not dismissable without user acknowledging the specific gap — forces confrontation with the data

---

### 4.4 The Milestone Timeline (Visual)

A living Gantt-style view across all 5 phases, color-coded by trajectory confidence.

- 🟢 **Green:** On track — current trajectory reaches this milestone on time
- 🟡 **Amber:** Drifting — current trajectory reaches milestone 10–30% late
- 🔴 **Red:** Misaligned — current trajectory misses milestone by > 30% or is moving away from it

Each milestone card shows:

- Original target date
- Projected arrival date (updated weekly based on behavior data)
- Gap in days/weeks between original and projected
- The specific behavioral change required to close the gap

---

### 4.5 The Weekly Check-In Ritual

A short, structured prompt delivered every Monday. Maximum 10 minutes. Five questions that feed directly into the scoring engine:

| #   | Question                                                                  | Maps To                                    |
| --- | ------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | What did you do this week toward your quarterly milestone?                | Task completion + Decision Alignment Score |
| 2   | What did you stop doing this week that was on your elimination list?      | Elimination Score                          |
| 3   | What is your single macro-problem right now?                              | Quarterly Critical Path refinement         |
| 4   | Did you make any decisions this week that opposed your stated trajectory? | Decision Alignment Score                   |
| 5   | Confidence score for the week (1–10)                                      | Self-Reported Confidence (10% weight)      |

Check-in completion is gated — weekly score cannot be calculated without it. If check-in is missed by Wednesday, the system applies a 0 for self-reported confidence and flags the week as incomplete.

---

### 4.6 The Decision Evaluator

A quick "should I do this?" tool that operationalizes the **dual-decision framework** from the Planasy methodology. Any decision the user is facing can be run through this tool.

**User Flow:**

1. User inputs a decision or opportunity in plain text (e.g., "Should I take a freelance project for 3 weeks?")
2. System checks it against current weekly and quarterly targets
3. Returns a Red / Amber / Green evaluation with specific reasoning
4. Evaluation is logged — Decision Evaluator history feeds into the Decision Alignment Score
5. User can override the evaluation — but overrides are tracked and visible in the weekly check-in

> **Example Output**
>
> Decision: "Take a 3-week freelance project at ₹80K"
> Quarterly Target: Launch MVP and acquire first paying customer by Day 75
>
> 🔴 **MISALIGNED** — This consumes 3 weeks (23% of your quarter) on non-trajectory work. At current pace, you will miss your MVP launch window. Recommend declining unless this IS your first paying customer.

---

### 4.7 The Compound Projector

Side-by-side timeline visualization — the most motivating feature in the product.

- **Timeline A — Current Trajectory:** Where you land mathematically if present behavior continues unchanged
- **Timeline B — Full Execution:** Where you land if you execute your weekly plan fully every week from now

The gap between the two timelines — expressed in years, months, and Escape Number proximity — is displayed prominently. This gap is the primary motivational lever of the product. A user who sees they are 4 years behind their vision on current trajectory has a concrete, mathematical reason to close that gap this week.

---

### 4.8 The XP System

XP is the gamification layer that makes consistency and goal stability feel tangible and rewarding.

**XP Earned:**

| Action                                           | XP                      |
| ------------------------------------------------ | ----------------------- |
| Completing weekly check-in                       | +20 XP                  |
| Weekly score ≥ 70                                | +30 XP bonus            |
| Weekly score ≥ 90                                | +60 XP bonus            |
| Completing a quarterly milestone                 | +200 XP                 |
| Completing a 1-year runway goal                  | +500 XP                 |
| Streak bonus — 4 consecutive weeks of score ≥ 70 | +100 XP                 |
| Not changing any goals in a full quarter         | +150 XP stability bonus |

**XP Deducted:**

| Action                                       | XP      |
| -------------------------------------------- | ------- |
| Changing quarterly goal mid-quarter          | −50 XP  |
| Changing 1-year goal mid-year                | −150 XP |
| Changing 3-year milestone outside window     | −300 XP |
| Changing 5-year vision outside annual window | −500 XP |
| Missing weekly check-in                      | −10 XP  |

**XP Visibility:** XP balance is displayed on the user profile and on the goal edit screen — prominently, before the user commits a change. The penalty amount is shown as a red counter before confirmation, making the cost visceral and not abstract.

---

## 5. Data Model

| Entity            | Key Fields                                                                                                                                   | Notes                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| User              | user_id, xp_balance, created_at, onboarding_complete                                                                                         | Root entity                                           |
| VaultLayer        | layer_id, user_id, phase (5yr/3yr/1yr/quarterly/weekly), content_json, version, last_edited_at, edit_count                                   | One active record per phase; version history retained |
| GoalChangeRequest | request_id, user_id, layer_id, reason, reason_tag (pivot/panic), requested_at, commits_at, status, xp_penalty                                | 30-hour cooling-off tracked here                      |
| WeeklyCheckIn     | checkin_id, user_id, week_start, task_completion_rate, elimination_score, decision_alignment, confidence_score, weekly_score, completed_at   | Source of weekly score calculation                    |
| Task              | task_id, user_id, week_start, description, phase_tag, weight_multiplier, completed, completed_at                                             | Phase-relevance tag drives score weight               |
| Milestone         | milestone_id, user_id, phase, description, target_date, projected_date, completion_status                                                    | Updated weekly by projection engine                   |
| DecisionLog       | decision_id, user_id, input_text, evaluation_result (red/amber/green), reasoning, overridden, created_at                                     | Feeds into Decision Alignment Score                   |
| ScoreHistory      | score_id, user_id, period_type (weekly/quarterly/yearly), period_start, weekly_score, quarterly_score, yearly_score, drift_score, created_at | Immutable audit trail for all scores                  |
| XPTransaction     | txn_id, user_id, amount, type (earned/deducted), reason, created_at                                                                          | Full ledger of all XP events                          |

---

## 6. Scope & Phasing

### 6.1 Phase 1 — MVP (Weeks 1–8)

Get the base scoring engine live and validated against real user behavior before building the broader feature set.

- **Vision Vault:** All five layers, mandatory Escape Number, basic edit controls
- **Weekly Check-In:** Five-question ritual, score calculation, Monday prompt
- **Weekly Score Engine:** All four components, phase-relevance tagging, confidence cross-validation
- **Basic Dashboard:** Weekly score display, simple milestone list, XP balance
- **Goal Lock-In + XP Penalties:** Cooling-off period, penalty display, change request flow

### 6.2 Phase 2 — Trajectory Layer (Weeks 9–16)

- **Quarterly Score Engine:** Recency weighting, consistency multiplier, milestone completion factor
- **Drift Detector:** Alert triggers, two-timeline display, gap calculation
- **Milestone Timeline:** Visual Gantt view, color-coded trajectory confidence
- **Compound Projector:** Side-by-side current vs. full-execution timelines

### 6.3 Phase 3 — Intelligence Layer (Weeks 17–24)

- **Decision Evaluator:** Input tool, red/amber/green output, decision log, override tracking
- **Yearly Score Engine:** All components, goal stability penalty, annual milestone tracking
- **5-Year Score:** Drift accumulation, Escape Number progress, long-term trajectory
- **Full XP System:** All earn/deduct events, streak bonuses, stability bonus
- **Pivot vs. Panic Classification:** Reason tagging, suppression logic on Goal Stability Score

---

## 7. Out of Scope (v1)

- Social / community features — comparing scores with others
- AI-generated goal suggestions or auto-filled Vault content
- Calendar integrations (task sync with Google Calendar, Notion, etc.)
- Coach or accountability partner assignment
- Financial account integrations for automated Escape Number tracking
- Mobile push notifications (deferred to post-MVP based on platform prioritization)

---

## 8. Open Questions

| #   | Question                                                                                                                               | Owner       | Priority |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------- |
| 1   | What is the exact formula for Pivot vs. Panic classification — rule-based or ML-assisted?                                              | Product     | High     |
| 2   | How do we handle the sparse data problem in Week 1–2 UX — show estimated range or hide score?                                          | Design      | High     |
| 3   | Should the Drift Score be visible at all times (persistent header) or only surfaced on alert?                                          | Design      | Medium   |
| 4   | What happens to the quarterly score if the user does not complete their weekly check-in? Zero that week or interpolate?                | Engineering | High     |
| 5   | Should XP have any redemption mechanism (unlocking features, cosmetic rewards) or purely be a loss-aversion signal?                    | Product     | Medium   |
| 6   | How do we define and measure the "Elimination Score" accurately without integrating with device screen time APIs?                      | Engineering | High     |
| 7   | What is the minimum viable Escape Number input — just a number, or with supporting assumptions (savings rate, investment return rate)? | Product     | Medium   |

---

_End of Document — 5/3/1 Planasy Trajectory Intelligence PRD v1.0_
