# NeuroKinetics

Camera-based upper limb motor recovery monitor for stroke survivors. The patient opens the app, selects an exercise, and watches a demonstration video. Then they turn on the camera and perform the movement. MediaPipe tracks 21 hand landmarks in real time, computes kinematic features from every frame, and produces a session score. Over time those sessions build a recovery trajectory.

No wearable sensors. No specialist equipment. Just a phone or laptop camera.

Built by Samuel Oluwakoya. This is the fifth and most technically complex tool in a series of ML-based rehabilitation systems Samuel has built since developing foot drop. The first tool was a drop foot management app (fdmapp.streamlit.app), and each subsequent build has tried to solve a more specific and harder problem. NeuroKinetics tries to answer a question patients ask constantly but have no way of measuring: is my hand getting better?

---

## The gap this addresses

A 2024 systematic review in IEEE Access identified a specific gap: no published study has applied longitudinal machine learning to home-based kinematic sessions across multiple weeks. Every study using MediaPipe or similar tools for stroke upper limb assessment was a single-session lab experiment with 7 to 45 patients. None of them deployed something a patient could use at home every day, track across sessions, and receive a weekly summary from.

A University of British Columbia team published a proof-of-principle study in November 2025 confirming that MediaPipe Pose Landmarker, using just one standard camera, can track upper limb movements in actual stroke patients and extract clinically meaningful kinematic measures. Their conclusion was that it was ready to complement standardized clinical assessments.

NeuroKinetics takes the next step. It deploys that approach longitudinally, at home, with session-level trend classification and weekly reporting to the physiotherapist.

---

## What it measures

MediaPipe Hand Landmarker produces 21 hand landmarks per frame. From those landmarks the system computes:

- Range of motion for each finger joint (thumb, index, middle, ring, little)
- Wrist flexion angle
- Peak hand opening speed
- Movement smoothness derived from jerk (rate of change of acceleration)
- Tremor index
- Bilateral symmetry (when both hands are visible)
- Landmark tracking confidence

These features are combined into a session score and compared to previous sessions to classify the trend as Improving, Stable, or Declining.

An FMA-UE proxy score is also estimated on a 0 to 66 scale following the methodology of Lin et al. (ICORR 2021), which demonstrated automated Fugl-Meyer scoring from pose keypoints. This is explicitly labelled as a proxy, not a clinical assessment.

---

## The exercises

Four exercises are included, each with a demonstration video and step-by-step cues:

Hand Open and Close — measures finger ROM, smoothness, and speed. The foundational exercise for post-stroke hand rehabilitation.

Wrist Rotation — measures wrist flexion and extension, smoothness. Important for daily living tasks like turning a door handle or pouring from a bottle.

Finger Tapping — measures speed, tremor, and coordination. Finger tapping rate is a well-established clinical marker of motor recovery.

Reach and Return — measures reach speed and path efficiency. Proximal control and reach quality reflect broader upper limb recovery.

---

## Weekly reports

Every Friday the system generates a summary report showing sessions completed that week, average FMA proxy score, ROM trend, smoothness trend, and overall trajectory classification. The report is addressed to the patient's physiotherapist and can be downloaded as a text file or printed directly from the app.

---

## Privacy

All video processing happens inside the browser using the MediaPipe JavaScript library. No video is ever sent to any server. The only data that leaves the device are the computed kinematic scores, which are stored in the browser's localStorage. There is no central database.

---

## Tech stack

- Next.js 14 with App Router
- TypeScript
- MediaPipe Tasks Vision 0.10.14 (runs entirely in the browser via WebAssembly)
- Recharts (progress charts)
- CSS Modules (styling)
- localStorage (session persistence, no database needed)
- Vercel (deployment, free tier)

The MediaPipe component is loaded with dynamic import and ssr: false, which prevents it from running during server-side rendering. This is the correct pattern for any browser-dependent library in Next.js and the main reason the app builds and deploys on Vercel without errors.

---

## Project structure

```
neurokinetics/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx
│   ├── login/
│   │   ├── page.tsx
│   │   └── page.module.css
│   ├── session/
│   │   ├── page.tsx        Exercise session with demo video and live camera
│   │   └── page.module.css
│   └── dashboard/
│       ├── page.tsx        Progress charts and weekly report
│       └── page.module.css
├── components/
│   ├── Camera.tsx          MediaPipe camera component
│   └── Camera.module.css
├── hooks/
│   └── useHandTracker.ts   All landmark extraction and feature computation
├── lib/
│   ├── store.ts            localStorage read/write
│   └── analysis.ts         Trend classification and FMA proxy scoring
├── public/
│   └── videos/             Exercise demonstration MP4 files
│       ├── hand_open_close.mp4
│       ├── hand_rotate.mp4
│       ├── hand_tapping.mp4
│       └── hand_reach.mp4
├── next.config.js
├── package.json
└── tsconfig.json

## Research papers that informed this build

Kraeutner et al. (2025). Using MediaPipe to track upper-limb reaching movements after stroke: a proof-of-principle study. Journal of NeuroEngineering and Rehabilitation. This is the most directly relevant validation study. Seven stroke patients, five sessions each, MediaPipe Pose Landmarker, one standard camera. Concluded that it can track upper limb movements and quantify kinematics in people with motor impairment after stroke.

Wagh, Scott, Kraeutner (2024). Quantifying Similarities Between MediaPipe and a Known Standard to Address Issues in Tracking 2D Upper Limb Trajectories. JMIR Formative Research. Validated MediaPipe 2D accuracy against a touchscreen gold standard for upper limb trajectories.

Latreche et al. (2023). Reliability and validity analysis of MediaPipe-based measurement system for some human rehabilitation motions. Measurement. Confirmed MediaPipe ROM measurements are valid compared to a universal goniometer for telerehabilitation.

Khan et al. (2024). Deep Learning for Quantified Gait Analysis: A Systematic Literature Review. IEEE Access. Identified the gap this platform addresses: no published study applies longitudinal ML to home-based kinematic sessions.

Lin et al. (2021). Automated FMA-UE scoring from pose keypoints. ICORR. The methodology behind the FMA-UE proxy score estimation.

---

## Where this fits in the wider project

1. Foot Drop Management App — fdmapp.streamlit.app, first published tool
2. Stroke Recovery Progress Tracker — daily ML-based monitoring
3. Stroke Recovery Monitor v2 — family dashboard and email alerts
4. AFO Clinical Management Platform — dual-dashboard prescription system for physiotherapists and patients
5. NeuroKinetics (this tool) — camera-based upper limb kinematic tracking

---

## Academic citation

Samuel Oluwakoya (2026). NeuroKinetics: Camera-Assisted Upper Limb Motor Recovery Monitoring for Home Stroke Rehabilitation Using MediaPipe and Longitudinal Kinematic Classification. GitHub. https://github.com/samueloluwakoya/neurokinetics

---

## Disclaimer

NeuroKinetics is a research tool. FMA-UE proxy scores are estimated from camera-based kinematics and are not equivalent to clinician-administered Fugl-Meyer assessments. This is not a certified medical device. Always follow the guidance of your rehabilitation team.

---

Samuel Oluwakoya — Computer science graduate, foot drop patient, AI health researcher.
