# IG Engine Cockpit — Production Dashboard

Production control, observability, research engine, and analytics cockpit built specifically for the **Instagram Reels Automation Engine** (`@lifefuel.global`).

## Architecture & Subsystems
- **Google Drive**: Master source library (read-only service account).
- **GitHub Actions**: Autonomous cloud worker schedules (`importer.yml`, `publisher.yml`, `maintenance.yml`, `keepalive.yml`).
- **Hugging Face Storage**: Native bucket buffer (`isubhanmalik/Bucket`) serving direct public MP4 streams.
- **Supabase**: PostgreSQL database storing queues, runs, settings, and publish intents.
- **Meta / Instagram**: Instagram Graph API v21.0 creator account container publishing & metrics.

## Features
- **Mission Command Center**: Live KPIs, rolling buffer gauge, daily Meta publishing quota, next post countdown, direct worker dispatches, and recent activity.
- **Queue Management**: Video list, status filters, search, custom caption editor with character and hashtag counter, and timezone-aware rescheduling.
- **Visual Calendar**: Monthly & weekly grid of scheduled and published Reels, with daily posting slot manager (09:00, 15:00, 20:00 UTC).
- **Published Archive**: Archive of published Reels with direct Instagram links and live Meta metrics (views, reach, likes, comments, saves, shares).
- **Analytics**: Performance over time, plays & reach curves, posting-time performance breakdown, and consistency tracking.
- **Experiment Lab**: Research Engine with Posting-Time Experimentation, variant comparison, transparent sample sizes, and empirical insights.
- **Health Matrix**: Live diagnostics for all 5 subsystems + Human Attention Required alerts.
- **Settings & Advanced Mode**: Core automation parameters, caption templates, recovery tools, and confirmation guards.
- **First-Class Themes**: Complete Dark Mode and Light Mode support with manual toggle and system preference sync.
- **Security**: Passcode gate (`lifefuel2026`) and zero secret credentials exposed to the browser client.

## Vercel Deployment Instructions
1. Import this repository (`Subhan-Builds/IG-ENGINE-COCKPIT`) on Vercel.
2. In the Vercel project settings under **Environment Variables**, add the variables specified in `.env.example`.
3. Click **Deploy**.
