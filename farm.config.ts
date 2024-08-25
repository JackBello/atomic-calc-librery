import { defineConfig } from "@farmfe/core";
import postcss from "@farmfe/js-plugin-postcss";

export default defineConfig({
  compilation: {
    presetEnv: false,
  },
  plugins: [postcss()],
});
