import React, { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import SimplePeer from "simple-peer";
import { io } from "socket.io-client";
import { env } from "./enj.js";
function Callscreen() {
  const [stream, setStream] = useState();
  const [callerSignal, setCallerSignal] = useState();
  const [peerConnection, setpeerConnection] = useState()
  const remoteVideoRef = useRef();
  const localVideoRef = useRef();
  const socket = useRef();
  const URL = "http://localhost:3000";

  socket.current = io.connect(env.REACT_APP_API_KEY);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        console.log("local stream", stream.getTracks());

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }).catch(error =>{
        console.log("catch error" , error)
      });

    return () => {};
  }, []);

  socket.current.on("hey", (data) => {
    setCallerSignal(data?.signal);
    acceptCall(data?.signal);
  });

  const startVideoFeed = () => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.current.emit("callUser", { signal: data });
    });

   
    socket.current.on("callAccepted", (signal) => {
      peer.signal(signal?.signal);
    });
  };
  
  const acceptCall = (signal) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.current.emit("acceptCall", { signal: data });
    });
    
    peer.on("stream", async(stream) => {
      remoteVideoRef.current.srcObject = stream;
      const base64Data = await (stream);
     socket.current.emit('callStarted', stream)
    });
    peer.signal(signal);
    setpeerConnection(peer)
  };



  
  const endVideo = () => { 
    
    peerConnection?.destroy();
    remoteVideoRef.current.srcObject = null;
   }

  return (
    <div>
      <div className="App">
        <div className="row">
          <div className="col">Local video feed</div>
          <div className="col">Remote video feed</div>
        </div>
        <div className="row p-1" style={{ backgroundColor: "" }}>
          <div className="col" style={{ backgroundColor: "" }}>
            <div
              className="remote-video"
              style={{
                display: "flex",
                backgroundColor: "black",
                height: "400px",
                borderRadius: "5px",
              }}
            >
              <video
                id="localVideo"
                ref={localVideoRef}
                className="video"
                autoPlay
                style={{ maxWidth: "100%" }}
              ></video>
            </div>
          </div>
          <div className="col" style={{ backgroundColor: "" }}>
            <div
              className="self-video"
              style={{
                display: "flex",
                backgroundColor: "black",
                height: "400px",
                borderRadius: "5px",
              }}
            >
              <video
                id="remoteVideo"
                ref={remoteVideoRef}
                className="video"
                autoPlay
                style={{ maxWidth: "100%" }}
              ></video>
            </div>
          </div>
        </div>
        <div className="row mt-4">
          <div
            className="col"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <div
              className="close-button mx-2"
              style={{ backgroundColor: "white", color: "black" }}
            >
              <i className="bi bi-camera-video-fill"></i>
            </div>
            <div
              className="close-button mx-2"
              style={{ backgroundColor: "white", color: "black" }}
            >
              <i className="bi bi-mic-fill"></i>
            </div>
            <div className="close-button mx-2">
              {/* End call ... */}
              <i className="bi bi-telephone-x-fill"></i>
            </div>
          </div>
        </div>

        <Button className="mx-3" onClick={startVideoFeed}>
          Start stream
        </Button>
        <Button onClick={endVideo} > End stream </Button>
      </div>
    </div>
  );
}

export default Callscreen;
