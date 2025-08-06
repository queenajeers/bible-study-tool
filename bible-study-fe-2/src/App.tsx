import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./pages/Layout";
import BibleStudyMain from "./pages/BibleStudyMain";
import Insights from "./pages/Insights";
import { BibleView } from "./pages/BibleView";
import HomePage from "./pages/HomePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/app",
    element: <Layout />,
    children: [
      { index: true, element: <BibleView /> },
      { path: "biblestudy", element: <BibleStudyMain /> },
      { path: "insights", element: <Insights /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
