const nextConfig = {
  async headers() {
    return [
      // El service worker nunca debe quedarse en caché: así una versión nueva se aplica en cuanto se despliega.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Content-Type", value: "application/javascript; charset=utf-8" }] },
    ];
  },
};
export default nextConfig;
