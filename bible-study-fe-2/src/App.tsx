import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import BibleStudyMain from "./pages/BibleStudyMain";
import Insights from "./pages/Insights";
import { BibleView } from "./pages/BibleView";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "/bible", element: <BibleView /> },
      { path: "/biblestudy", element: <BibleStudyMain /> },
      { path: "/insights", element: <Insights /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
