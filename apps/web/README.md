# @market-health-map/web

The Next.js 16 app people use: the full-screen facilities map, the facility detail panel with its in-browser AI summary, and Google sign-in for @plei.com accounts. It is a PWA (Serwist) and is deployed to Vercel with this folder as the root directory.

## Layout

| Folder | What lives there |
| --- | --- |
| `src/app` | Next.js routes only. Pages render one screen. `api/v1/[[...route]]` mounts the server's API, and `api/auth` is Auth.js. |
| `src/presentation/screens` | One screen per page: `FacilitiesMapScreen`, `SignInScreen`, `OfflineScreen` |
| `src/presentation/components` | Reusable UI, one folder per component (`NameComponent.tsx`, `.rules.ts`, `.types.ts`, `__tests__/`) |
| `src/application/test` | Test helpers: `renderWithMessages`, `EN_MESSAGES` and fixtures such as `FACILITY_DETAIL` |
| `src/application/constants` | Constants shared by the UI, such as the Pleiful brand colors for TypeScript consumers such as MapLibre |
| `src/presentation/hooks` | Hooks grouped by subject: `use-facility/` (`useFacilityListAll`, `useFacilityDetails`), `use-app/` (`useAppSessionHeatmap`) and `use-map/` (`usePleiLogoImages`) |
| `src/infrastructure` | The fetch `apiClient`, the WebLLM summary engine, Auth.js, request locale |
| `src/proxy.ts` | Sends signed-out page requests to `/sign-in` |

## Commands

Run these from the repo root:

```bash
pnpm dev
pnpm --filter @market-health-map/web test
pnpm --filter @market-health-map/web build
```

`dev` and `build` use webpack (Serwist needs it) and copy the MapLibre worker into `public/maplibre/` first.

See [docs/architecture.md](../../docs/architecture.md) for how the pieces fit together.
