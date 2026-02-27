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
      <Suspense fallback={<p>Loading...</p>}>
        <ImageGallery />
      </Suspense>
    </AuthGuard>
  );
}

export default App;
