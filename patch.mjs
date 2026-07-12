import fs from 'fs';
let code = fs.readFileSync('src/App.svelte', 'utf-8');
code = code.replace(
  "let activeSessionId = $state<string | number | null>(initialSessionId);",
  "let activeSessionId = $state<string | number | null>(initialSessionId);\n  let isDataLoaded = $state(false);\n  let dataLoadError = $state<string | null>(null);"
);
code = code.replace(
  "const loadInitialData = async () => {",
  "const loadInitialData = async () => {\n      dataLoadError = null;\n      isDataLoaded = false;"
);
code = code.replace(
  "sessions = dbSess;",
  "sessions = dbSess;\n        isDataLoaded = true;"
);
code = code.replace(
  "console.error('Error in loadInitialData:', err);",
  "console.error('Error in loadInitialData:', err);\n        dataLoadError = err instanceof Error ? err.message : String(err);\n        isDataLoaded = true;"
);
code = code.replace(
  `<p class="text-xs font-bold text-slate-500">세션 정보를 불러오는 중입니다...</p>`,
  `{#if dataLoadError}
              <p class="text-xs font-bold text-red-500">세션 정보를 불러오는데 실패했습니다: {dataLoadError}</p>
            {:else if !isDataLoaded}
              <p class="text-xs font-bold text-slate-500">세션 정보를 불러오는 중입니다...</p>
            {:else}
              <p class="text-xs font-bold text-slate-500">요청하신 세션 정보가 존재하지 않거나 삭제되었습니다.</p>
            {/if}`
);
fs.writeFileSync('src/App.svelte', code);
