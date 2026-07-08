export default {
  root: "src",
  // Relative base so the build works on GitHub Pages (any repo path)
  // or any other static host without configuration.
  base: "./",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  envDir: "../",
};
