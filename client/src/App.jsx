import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container } from "react-bootstrap";
import NavBar from "./components/NavBar";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Home from "./pages/Home";
import Room from "./pages/Room";
import SocketProvider from "./context/SocketProvider";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <>
    <SocketProvider>
        <NavBar />
        <Container>
          <Routes>
            <Route path="/" element={user ? <Home /> : <Login />} />
            <Route path="/register" element={user ? <Home /> : <Register />} />
            <Route path="/login" element={user ? <Home /> : <Login />} />
            <Route path='/home' element= {user ? <Home /> : <Login />}/>
            <Route path='/room/:roomId' element={user ? <Room /> : <Login />}/>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
        </SocketProvider>
    </>
  );
}

export default App;
