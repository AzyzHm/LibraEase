import { useState, useEffect } from "react"
import HomePage from "./pages/HomePage/HomePage"
import { useSelector } from "react-redux";
import { RootState } from "./redux/ReduxStore";
function App() {

  
  const loggedInUser = useSelector((state:RootState) => state.authentication.loggedInUser);

  useEffect(() => {
    console.log(loggedInUser);
  }, [loggedInUser])

  return (
    <div>
      <HomePage  />
    </div>
  )
}

export default App