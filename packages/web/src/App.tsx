import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./layouts/root-layout";
import { HomePage } from "./pages/home";
import { DictationPage } from "./pages/dictation";
import { PhotoUploadPage } from "./pages/upload";
import { CorrectionPage } from "./pages/correction";
import { MistakeBookPage } from "./pages/mistakes";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "dictation", element: <DictationPage /> },
      { path: "upload", element: <PhotoUploadPage /> },
      { path: "correction", element: <CorrectionPage /> },
      { path: "mistakes", element: <MistakeBookPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
