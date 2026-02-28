import { lazy, Suspense, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setTokenGetter } from "./api/client";
import { AuthGuard } from "./components/AuthGuard";
import { UserList } from "./components/UserList";

const ImageGallery = lazy(() => import("./components/ImageGallery"));

function App() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return (
    <AuthGuard>
      <UserList />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Loading...
            </p>
          </div>
        }
      >
        <ImageGallery />
      </Suspense>
    </AuthGuard>
  );
}

export default App;
