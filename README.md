# PRAHARI — MPLADS Intelligence Prototype

Functional SIH 2026 prototype for SIH26102.

## What changed
- Civic Intelligence visual system with earthy government/intelligence palette
- Responsive Command Centre focused on "What needs attention?"
- Explainable Project Risk Profile
- Investigation Centre with case queue, evidence review, field-verification workflow and feedback loop
- Citizen Portal with map-first public exploration and project journey
- English/Hindi language switch
- Browser speech / Listen control using Web Speech API
- Mobile/tablet/desktop responsive layouts
- Existing mock data and AI-engine utilities retained where useful

## Demo honesty
This prototype uses mock/synthetic records. It demonstrates the proposed workflow; it does not claim live eSAKSHI/PFMS integration or prove fraud automatically.

## Run locally
```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Demo login
Any non-empty email + password works.

Authority roles:
- District Authority
- State Nodal Authority
- Central / Ministry View
- MP Office

Citizen:
- Select Citizen and continue.

## Main demo path
Command Centre → Priority Case → Risk Profile → Evidence Graph → Investigation Centre → Assessment → Field Verification → Feedback

Built for Smart India Hackathon 2026 · SIH26102
