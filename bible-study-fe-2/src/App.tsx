import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./pages/Layout";
import BibleStudyMain from "./pages/BibleStudyMain";
import Insights from "./pages/Insights";
import { BibleView } from "./pages/BibleView";
import HomePage from "./pages/HomePage";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Replace with actual auth logic

  const router = createBrowserRouter(
    isLoggedIn
      ? [
          {
            path: "/",
            element: <Layout />,
            children: [
              { index: true, element: <BibleView /> },
              { path: "biblestudy", element: <BibleStudyMain /> },
              { path: "insights", element: <Insights /> },
            ],
          },
        ]
      : [
          {
            path: "/",
            element: <HomePage />,
          },
        ]
  );

  return <RouterProvider router={router} />;
}
