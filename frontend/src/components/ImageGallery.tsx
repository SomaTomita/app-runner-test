import { useImageStore } from "../stores/useImageStore";

export function ImageGallery() {
  const { images, loading, error, fetchImages } = useImageStore();

  return (
    <section style={{ marginTop: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2>Images</h2>
        <button onClick={fetchImages} disabled={loading}>
          {loading ? "Loading..." : "Load Images"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {images.map((item) => (
            <div
              key={item.meta.key}
              style={{
                border: "1px solid #ddd",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {item.url && (
                <img
                  src={item.url}
                  alt={item.meta.name}
                  style={{ width: "100%", height: "150px", objectFit: "cover" }}
                />
              )}
              <div style={{ padding: "0.5rem" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.meta.name}
                </p>
                {item.meta.size && (
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.75rem",
                      color: "#666",
                    }}
                  >
                    {(item.meta.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && images.length === 0 && (
        <p style={{ color: "#666" }}>
          No images loaded. Click "Load Images" to fetch from storage.
        </p>
      )}
    </section>
  );
}
