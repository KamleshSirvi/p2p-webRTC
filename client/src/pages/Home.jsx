import { useState, useCallback, useEffect } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
import {  Button, Form, Row, Col, Stack } from "react-bootstrap";

const Home = () => {
  const [room, setRoom] = useState("");
  const navigate = useNavigate();
  const socket = useSocket();

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { room });
    },
    [room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <Form onSubmit={handleSubmit}>
        <Row
          style={{
            height: "100vh",
            justifyContent: "center",
            paddingTop: "10%",
          }}
        >
          <Col xs={6}>
            <Stack gap={3}>
              <h2>Enter Unique Room Code</h2>

              <Form.Control
                type="text"
                placeholder="Enter Room code"
                onChange={(e) => setRoom(e.target.value)}
                name="room"
                value={room}
              />
              <Button variant="primary" type="submit">Join</Button>
            </Stack>
          </Col>
        </Row>
      </Form>
  );
};

export default Home;
