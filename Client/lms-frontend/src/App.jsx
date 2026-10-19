import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./app/router";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
