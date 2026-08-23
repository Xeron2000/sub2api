# shadcn preset proof

Init command (as per §4):
```
pnpm dlx shadcn@latest init --preset b4YsqxoEWf --base radix --template vite
```

- Answer `frontend` to project name prompt (clean-room, parent dir /home/xeron/Coding/sub2api)
- Resulting style: `radix-lyra` (preset b4YsqxoEWf resolves to radix-lyra + taupe + inverted menu)
- Verification: `components.json` style=radix-lyra baseColor=taupe menuColor=inverted
- If preset unavailable, strict blocking per grill decision: this run succeeded (preset reachable)
