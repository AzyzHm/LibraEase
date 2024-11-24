import { useState, useEffect } from "react"
import HomePage from "./pages/HomePage/HomePage"
import { useSelector } from "react-redux";
import { RootState } from "./redux/ReduxStore";
import { BrowserRouter,Route,Routes } from "react-router-dom";
import LayoutPage from "./pages/LayoutPage/LayoutPage";
function App() {

  
  const loggedInUser = useSelector((state:RootState) => state.authentication.loggedInUser);

  useEffect(() => {
    console.log(loggedInUser);
  }, [loggedInUser])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LayoutPage />}>
          <Route path="" element={<HomePage />} />
          <Route path="/catalog" element={<>Catalog</>} />
          <Route path="/resource/:barcode" element={<>Resource</>} />
          <Route path="/profile/:userId" element={<>User Profile</>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App