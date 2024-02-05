import React, { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import SimplePeer from "simple-peer";
import { io } from "socket.io-client";
import { env } from "./enj.js";
function Callscreen() {
  const [stream, setStream] = useState();
  const [callerSignal, setCallerSignal] = useState();
  const [peerConnection, setpeerConnection] = useState();
  const remoteVideoRef = useRef();
  const localVideoRef = useRef();
  const socket = useRef();
  const URL = "http://localhost:3000";

  socket.current = io.connect(env.REACT_APP_API_KEY);


  useEffect(() => {    // in useEffect we are getting the media stream of local video feed
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (localVideoRef.current) { // checking if localVideRef component is mounted  
          localVideoRef.current.srcObject = stream; // assigning the stream to localVideoRef
        }
      })
      .catch((error) => {
        console.log("catch error", error);
      });

    return () => {};
  }, []);

  // notifies the user if they are getting the call
  socket.current.on("incomingCall", (data) => {
    setCallerSignal(data?.signal);
    acceptCall(data?.signal);
  });

  //  this function creates the localDescription and sets to peerConnection and signla the
  const startVideoFeed = () => {
    const peer = new SimplePeer({
      initiator: true, // identifies that this user(local) is calling
      trickle: false, // not creating multipl signals
      stream: stream, // adding stream with session description protocol(sdp)
    });

    peer.on("signal", (data) => {
      // successfully signals the event with ICE candidates
      socket.current.emit("callUser", { signal: data }); // websockets to call the remote user
    });

    socket.current.on("callAccepted", (signal) => {
      peer.signal(signal?.signal);
    });
  };

  // In recevier side, the create the peer after getting the call request
  const acceptCall = (signal) => {
    const peer = new SimplePeer({
      initiator: false, // identifies that this user(remote) is not calling instead receving
      trickle: false, //  not emitting multiple singal
      stream: stream, // adding the local stream(remote) to the peer connection
    });
    peer.on("signal", (data) => {
      // peer connection establiehes the connection
      socket.current.emit("acceptCall", { signal: data });
    });

    peer.on("stream", async (stream) => {
      // getting the stream along with peer connection
      remoteVideoRef.current.srcObject = stream; //  assigning the audio, video stream to the React DOM
      socket.current.emit("callStarted", stream); // socket triggered that teh call started
    });
    peer.signal(signal);
    setpeerConnection(peer);
  };

  // destroying the peer connection
  const endVideo = () => {
    peerConnection?.destroy();  // closing the connection istance
    remoteVideoRef.current.srcObject = null; // disblaing the streams
  };

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
        <Button onClick={endVideo}> End stream </Button>
      </div>
    </div>
  );
}

export default Callscreen;
