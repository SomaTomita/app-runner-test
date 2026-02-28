import { useImageStore } from "../stores/useImageStore";

export function ImageGallery() {
  const images = useImageStore((s) => s.images);
  const loading = useImageStore((s) => s.loading);
  const error = useImageStore((s) => s.error);
  const fetchImages = useImageStore((s) => s.fetchImages);

  return (
    <section className="mt-8 animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
          Images
        </h2>
        <button
          onClick={fetchImages}
          disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-primary-700 active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load Images"}
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm text-danger-600 dark:text-danger-400"
        >
          {error}
        </div>
      ) : null}

      {images.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.key}
              className="group overflow-hidden rounded-lg border border-surface-200 bg-white shadow-sm transition-shadow duration-150 hover:shadow-md dark:border-surface-700 dark:bg-surface-900"
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface-100 dark:bg-surface-800">
                <img
                  src={image.url}
                  alt={image.name}
                  width={400}
                  height={300}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                />
              </div>
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
                  {image.name}
                </p>
                {image.size ? (
                  <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                    {(image.size / 1024).toFixed(1)} KB
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-surface-300 py-12 dark:border-surface-700">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            No images loaded. Click &quot;Load Images&quot; to fetch from
            storage.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default ImageGallery;
