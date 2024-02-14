#!/usr/bin/env bun

import { $ } from "bun";
import { parseArgs } from "util";
import { mkdir } from "node:fs/promises";

const { positionals } = parseArgs({
  args: Bun.argv,
  allowPositionals: true,
  strict: true,
});
const name = positionals[2] ?? "my-blog";

/**
 * Astro
 */

await $`bunx create-astro@latest --template minimal --install --no-git --skip-houston --typescript strict -y ${name}`;

$.cwd(name);

await $`bunx astro add react -y`;
await $`bunx astro add tailwind -y`;
await $`bunx astro add vercel -y`;
await $`yes | bunx astro add auth-astro -y`;

/**
 * Shadcn-ui
 */

const tsconfig = (await new Response(
  Bun.file(`${name}/tsconfig.json`)
).json()) as any;
tsconfig.compilerOptions.baseUrl = ".";
tsconfig.compilerOptions.paths = {
  "@/*": ["./src/*"],
};
await Bun.write(`${name}/tsconfig.json`, JSON.stringify(tsconfig, null, "\t"));

await Bun.write(
  `${name}/components.json`,
  JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema.json",
      style: "default",
      rsc: false,
      tsx: true,
      tailwind: {
        config: "tailwind.config.mjs",
        css: "./src/styles/globals.css",
        baseColor: "slate",
        cssVariables: false,
        prefix: "",
      },
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
      },
    },
    null,
    "\t"
  )
);

await $`bun add class-variance-authority clsx lucide-react tailwind-merge tailwindcss-animate`;

await Bun.write(
  `${name}/tailwind.config.mjs`,
  `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`
);

await Bun.write(
  `${name}/src/lib/utils.ts`,
  `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
);

await Bun.write(
  `${name}/src/styles/globals.css`,
  `@tailwind base;
@tailwind components;
@tailwind utilities;
`
);

await Bun.write(
  `${name}/astro.config.mjs`,
  (
    await Bun.file(`${name}/astro.config.mjs`).text()
  ).replace("tailwind()", "tailwind({ applyBaseStyles: false })")
);

/**
 * Robots
 */

await Bun.write(
  `${name}/public/robots.txt`,
  `User-agent: *
Disallow: /`
);

/**
 * Secret Folder
 */

await mkdir(`${name}/public/${crypto.randomUUID()}`);

/**
 * Auth Astro Integration
 */

await Bun.write(
  `${name}/auth.config.ts`,
  `import Google from "@auth/core/providers/google";
import { defineConfig } from "auth-astro";

export default defineConfig({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
});
`
);

const authSecret = (await $`openssl rand -hex 32`.text()).trimEnd();
await Bun.write(
  `${name}/.env`,
  `AUTH_SECRET=${authSecret}
GOOGLE_CLIENT_ID=REPLACE_ME
GOOGLE_CLIENT_SECRET=REPLACE_ME`
);

/**
 * Private Layout
 */

await Bun.write(`${name}/src/users.json`, JSON.stringify([]));

await Bun.write(
  `${name}/src/lib/server.ts`,
  `import { getSession } from "auth-astro/server";
  import users from "../users.json";
  
  export async function getHasPermission(request: Request) {
    const session = await getSession(request);
    const email = session?.user?.email;
    if (!email) return false;
    return (users as string[]).includes(email);
  }
`
);

await Bun.write(
  `${name}/src/components/auth.ts`,
  `export { SignIn, SignOut } from "auth-astro/components";
export { signIn, signOut } from "auth-astro/client";
`
);

await Bun.write(
  `${name}/src/layouts/private-page.astro`,
  `---
  import { getHasPermission } from "../lib/server";
  
  interface Props {
    title: string;
  }
  
  const { title } = Astro.props;
  
  const hasPermission = await getHasPermission(Astro.request);
  ---
  
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <meta name="viewport" content="width=device-width" />
      <meta name="generator" content={Astro.generator} />
      <meta name="robots" content="noindex,follow" />
      <title>{title}</title>
    </head>
    <body>
      {hasPermission && <slot />}
    </body>
  </html>
`
);

await Bun.write(
  `${name}/src/pages/index.astro`,
  `---
import Layout from "../layouts/private-page.astro";
---

<Layout title="Home">Hello World!</Layout>
`
);

/**
 * Add deploy script
 */

await $`bun install --global vercel`;
const pkg = (await new Response(
  Bun.file(`${name}/package.json`)
).json()) as any;
pkg.scripts = { ...pkg.scripts, deploy: "vercel --prod" };
await Bun.write(`${name}/package.json`, JSON.stringify(pkg, null, "\t"));

/**
 * Git
 */

await $`git init -b main`;
await $`git add .`;
await $`git commit -m "initial commit"`;
