import  { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import { useSocket } from '../context/SocketProvider'
import peer from "../service/peer";
import {useNavigate} from "react-router-dom"
import {  Button, Card, Row, Col  } from "react-bootstrap";

const Room = () => {
  const socket = useSocket();
  // console.log("socket", socket);
  const navigate = useNavigate();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [mute, setMute] = useState('Mute');
  const [pause, setPause] = useState("Pause");
  const [muteAudio, setMuteAudio] = useState(false);
  const [pauseVideo, setPauseVideo] = useState(false);
  const [establishedConnection, setEstablishedConnection] = useState(false);

  
  const handleJoinedUser = useCallback(({ id }) => {
    console.log(`user joined ${id}`);
    setRemoteSocketId(id);
  }, []);


  const handleUserCall = useCallback(async () => {
    let stream 
    try{
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
    }catch(err){
      console.log(err);
    }
    const offer = await peer.getOffer();
    // console.log("remotesocketId", remoteSocketId);
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);


  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      let stream
      try{
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
      }catch(err){
        console.log(err)
      }
      
      setMyStream(stream);
      console.log(`Incomming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );


  const sendStream = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);


  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("call accepted", from);
      sendStream();
    },
    [sendStream]
  );

  // negotiation 
  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);


  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);


  const handleNegoNeededIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );


  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
    setEstablishedConnection(true);
  }, []);


  useEffect(() => {
    peer.peer.addEventListener("track", async (e) => {
      const remoteStream = e.streams;
      console.log("GOT TRACKED!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);


  const handleLeaveRoom = useCallback(() => {
    socket.emit("leave", remoteSocketId);
    if(myStream){
      myStream.getTracks()[0].stop();
      myStream.getTracks()[1].stop();
    }

    if(remoteStream){
      remoteStream.getTracks()[0].stop();
      remoteStream.getTracks()[1].stop();
    }
    navigate('/');
  }, [myStream, remoteStream, remoteSocketId, socket, navigate])


  useEffect(() => {
    socket.on("user:joined", handleJoinedUser);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeededIncoming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("leave", handleLeaveRoom);

    return () => {
      socket.off("user:joined", handleJoinedUser);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeededIncoming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("leave", handleLeaveRoom);
    };
  }, [
    socket,
    handleJoinedUser,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeededIncoming,
    handleNegoNeedFinal,
    handleLeaveRoom
  ]);


  const handleMute = () => { 
    if(muteAudio){
      setMute("Mute")
      myStream.getTracks()[0].enabled = true;
      console.log("unmuted ", remoteStream.getTracks()[1]);
    }else{
      setMute("UnMute");
      myStream.getTracks()[0].enabled = false;
      console.log("muted ", remoteStream.getTracks()[1].enabled);
    }
    setMuteAudio(!muteAudio)
  }


  const handlePause = async() => {
    if(pauseVideo){
      setPause("Pause")
      myStream.getTracks()[1].enabled = true;
    
      console.log("pause ", remoteStream.getTracks()[1]);
    }else{
        setPause("Play");
        myStream.getTracks()[1].enabled = false;
        
        console.log("Enable ", remoteStream.getTracks()[1].enabled);
    }
    setPauseVideo(!pauseVideo)
  }


  return (
    <>
      <h1 style={{textAlign: "center"}} className="room-heading">Meeting Room</h1>
      <h3 style={{textAlign: "center"}} className="room-connection">
        {remoteSocketId ? "Connected" : "No one is in the room"}
      </h3>

      {myStream &&  !establishedConnection && (
        <Button variant="dark" style={{ marginRight: "15px" }} className="room-send-stream" onClick={sendStream}>
          Send Stream
        </Button>
      )}

      {remoteSocketId && !establishedConnection && (
        <Button variant="dark" style={{ marginRight: "15px" }} className="room-call" onClick={handleUserCall}>
          Call
        </Button>
      )}
      <Row style={{
            justifyContent: "center",
          }} gap={3}>
        {myStream && (
          <Card style={{ width: '380px', height: '400px', backgroundColor : "#9d9d9e", marginRight: "15px"}} >
          <Row style={{
            justifyContent: "center",
          }}>
            <ReactPlayer
              className="room-localPlayer"
              playing
              width={"350px"}
              // muted 
              url={myStream}
            />
            <h4 style={{textAlign: "center"}}>Local</h4>
            </Row>
          </Card>
        )}

        {remoteStream && (
          <Card style={{ width: '400px', backgroundColor : "#9d9d9e"}} >
            <Row style={{
              justifyContent: "center",
            }}>
              <ReactPlayer
                width={"350px"}
                className="room-remote-player"
                playing
                // muted
                url={remoteStream}
              />
              <h4 style={{textAlign: "center"}}>Remote</h4>
            </Row>
          </Card>
        )}
      </Row>

      <Row style={{
            justifyContent: "center",
          }}>
        {
          remoteStream && <Col >

            {
              muteAudio ? <Button style={{ marginRight: "15px", marginTop: "15px" }} variant="danger" onClick={handleMute}>{mute}</Button> : <Button style={{ marginRight: "15px",marginTop: "15px" }} variant="secondary" onClick={handleMute}>{mute}</Button>
            }
            {
              pauseVideo ? <Button style={{ marginRight: "15px", marginTop: "15px" }} variant="danger" onClick={handlePause}>{pause}</Button> : <Button style={{ marginRight: "15px", marginTop: "15px" }} variant="secondary" onClick={handlePause}>{pause}</Button>
            }
            <Button style={{ marginRight: "15px", marginTop: "15px" }} variant="danger" className="leave-button" onClick={handleLeaveRoom}>Leave</Button>
          </Col>
        }
      </Row>
    </>
  );
};

export default Room;
