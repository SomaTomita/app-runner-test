import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setTokenGetter } from "./api/client";
import { AuthGuard } from "./components/AuthGuard";
import { UserList } from "./components/UserList";
import { ImageGallery } from "./components/ImageGallery";

function App() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return (
    <AuthGuard>
      <UserList />
      <ImageGallery />
    </AuthGuard>
  );
}

export default App;
