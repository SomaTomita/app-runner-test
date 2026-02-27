import { useImageStore } from "../stores/useImageStore";

const styles = {
  section: { marginTop: "2rem" } as const,
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  } as const,
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "1rem",
  } as const,
  card: {
    border: "1px solid #ddd",
    borderRadius: "4px",
    overflow: "hidden",
  } as const,
  image: { width: "100%", height: "150px", objectFit: "cover" } as const,
  cardBody: { padding: "0.5rem" } as const,
  name: {
    margin: 0,
    fontSize: "0.85rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } as const,
  size: {
    margin: "0.25rem 0 0",
    fontSize: "0.75rem",
    color: "#666",
  } as const,
  error: { color: "red" } as const,
  empty: { color: "#666" } as const,
};

export function ImageGallery() {
  const images = useImageStore((s) => s.images);
  const loading = useImageStore((s) => s.loading);
  const error = useImageStore((s) => s.error);
  const fetchImages = useImageStore((s) => s.fetchImages);

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <h2>Images</h2>
        <button onClick={fetchImages} disabled={loading}>
          {loading ? "Loading..." : "Load Images"}
        </button>
      </div>

      {error ? <p style={styles.error}>{error}</p> : null}

      {images.length > 0 ? (
        <div style={styles.grid}>
          {images.map((image) => (
            <div key={image.key} style={styles.card}>
              <img
                src={image.url}
                alt={image.name}
                style={styles.image}
              />
              <div style={styles.cardBody}>
                <p style={styles.name}>{image.name}</p>
                {image.size ? (
                  <p style={styles.size}>
                    {(image.size / 1024).toFixed(1)} KB
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && images.length === 0 ? (
        <p style={styles.empty}>
          No images loaded. Click "Load Images" to fetch from storage.
        </p>
      ) : null}
    </section>
  );
}

export default ImageGallery;
