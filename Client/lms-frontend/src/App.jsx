import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./app/router";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./context/AuthContext";
import { LoadingProvider } from "./context/LoadingContext";
import { GlobalLoadingIndicator } from "./components/ui/GlobalLoadingIndicator";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoadingProvider>
          <ToastProvider>
            <GlobalLoadingIndicator />
            <AppRouter />
          </ToastProvider>
        </LoadingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
