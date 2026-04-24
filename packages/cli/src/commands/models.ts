import {
  DEFAULT_BLIND_EVAL_MODELS,
  DEFAULT_MODELS,
  MODEL_CATALOG,
} from "../utils/default-models";
import { style } from "../utils/visual-system";

const st = style();

export interface ModelsCommandOptions {
  json?: boolean;
}

export function modelsCommand(options: ModelsCommandOptions = {}): void {
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          defaults: DEFAULT_MODELS,
          blindEvalDefaults: DEFAULT_BLIND_EVAL_MODELS,
          catalog: MODEL_CATALOG,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(st.bold("\nDefault models (debate / council / benchmark):"));
  for (const id of DEFAULT_MODELS) {
    console.log(st.brand(`  • ${id}`));
  }

  console.log(st.bold("\nDefault models (blind eval):"));
  for (const id of DEFAULT_BLIND_EVAL_MODELS) {
    console.log(st.brand(`  • ${id}`));
  }

  console.log(st.bold("\nCatalog:"));
  const byProvider = new Map<string, typeof MODEL_CATALOG[number][]>();
  for (const entry of MODEL_CATALOG) {
    const list = byProvider.get(entry.provider) ?? [];
    list.push(entry);
    byProvider.set(entry.provider, list);
  }
  for (const [provider, entries] of byProvider) {
    console.log(st.dim(`\n  ${provider}`));
    for (const entry of entries) {
      console.log(`    ${entry.id.padEnd(32)} ${st.dim(entry.tier)}`);
    }
  }

  console.log("");
  console.log(
    st.dim(
      "  Override per command with -m / --models, e.g. consilium debate 'x' -m gpt-4o claude-sonnet-4-20250514",
    ),
  );
  console.log(
    st.dim(
      "  Raw list (for scripting): consilium models --json | jq '.defaults'",
    ),
  );
  console.log("");
}
