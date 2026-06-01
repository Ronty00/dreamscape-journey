# Dreamscape Journey

A breathtaking, highly cinematic single-page fantasy experience where a user enters their name and is taken on a deeply personal animated journey through magical worlds.

Built with **Next.js 16**, **Three.js / React Three Fiber**, **Framer Motion**, and procedural Web Audio.

> "Wait... this is a website?! It feels like a fantasy game."

---

## ✨ Live Demo

Once deployed, your link will go here.

---

## Features

- **Cinematic name transformation** — Letters explode into glowing particles and form a portal.
- **5+ Distinct Magical Worlds** — Sky Kingdom, Crystal Caverns, Ocean of Stars, Mirror Lake, Enchanted Grove, and the final World Tree.
- **Deep Personalization** — Every quote, guardian, dream title, and echo is uniquely generated from the user's name.
- **Meaningful Archetypal Guardians** — Each with Message, Lesson, and Shadow.
- **Smooth Cinematic Transitions** — Deliberate, film-like world changes.
- **Procedural Fantasy Music** — Evolving ambient soundscape using Web Audio API.
- **Fully Interactive** — Mouse/touch parallax, reactive particles, and meaningful interactions.

---

## 🚀 Deploy to Vercel (Recommended)

This is a **heavy Three.js project**. Follow these steps carefully to avoid build errors on Vercel.

### 1. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### 2. Important Vercel Settings (Required)

After importing the project, **before clicking Deploy**, go to:

**Settings → General → Build & Development Settings**

- **Build Command**: `npm run build`

Then go to **Environment Variables** and add this:

| Name            | Value                        |
|-----------------|------------------------------|
| `NODE_OPTIONS`  | `--max-old-space-size=4096`  |

This increases memory during build (prevents "Call retries were exceeded" errors).

### 3. Deploy

Click **Deploy**. The first build may take 2-3 minutes.

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

- Next.js 16 (App Router)
- Three.js + @react-three/fiber + drei
- Framer Motion
- TypeScript + Tailwind CSS
- Web Audio API (procedural music)

---

## Notes for Hosting

- This experience is **heavily client-side** (Three.js + Web Audio). It works great on Vercel.
- No environment variables or backend required.
- Works on desktop and mobile (best experience on desktop with sound).

---

## Credits

Created as an ambitious interactive fantasy experience.  
If you deploy your own version, feel free to customize the worlds, quotes, or add new guardians.

Enjoy the journey. 🌌✨