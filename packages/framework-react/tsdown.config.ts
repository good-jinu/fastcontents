import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	// 'neutral' platform is ideal for libraries
	platform: "neutral",
	// tsdown automatically generates .d.ts files
	dts: true,
	tsconfig: "./tsconfig.json",
	external: ["react", "react-dom"],
	inputOptions: {
		tsconfig: "./tsconfig.json",
	},
	noExternal: ["fastcontents"]
});
