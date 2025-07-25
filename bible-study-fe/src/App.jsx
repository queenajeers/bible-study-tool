import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import BibleStudyMain from "./pages/BibleStudyMain";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Insights from "./pages/Insights";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "/biblestudy", element: <BibleStudyMain /> },
      { path: "/insights", element: <Insights /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
