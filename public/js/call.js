// Mocking peer connections
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

// Lấy media từ camera/mic
navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localVideo.srcObject = stream;
        // Kết nối video từ đối tác vào remoteVideo
        // Giả lập: remoteVideo.srcObject = stream;
    })
    .catch((err) => {
        console.error('Không thể truy cập camera/mic:', err);
    });

function muteMic() {
    const enabled = localVideo.srcObject.getAudioTracks()[0].enabled;
    localVideo.srcObject.getAudioTracks()[0].enabled = !enabled;
    alert(enabled ? 'Mic đã tắt' : 'Mic đã bật');
}
function endCall() {
    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());  // Dừng camera/mic
    }

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    alert('Cuộc gọi đã kết thúc');
    window.close();
}

function toggleVideo() {
    const enabled = localVideo.srcObject.getVideoTracks()[0].enabled;
    localVideo.srcObject.getVideoTracks()[0].enabled = !enabled;
    alert(enabled ? 'Video đã tắt' : 'Video đã bật');
}



document.addEventListener("DOMContentLoaded", () => {
    const callerId = document.body.getAttribute("data-caller-id");
    const receiverId = document.body.getAttribute("data-receiver-id");

    const socket = io('http://localhost:5000', {
        query: { userId: callerId }
    });

    let localStream, peerConnection;
    const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

    async function setupWebRTC() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            document.getElementById("localVideo").srcObject = localStream;

            peerConnection = new RTCPeerConnection({ iceServers });

            peerConnection.oniceconnectionstatechange = () => {
                console.log("ICE Connection State:", peerConnection.iceConnectionState);
            };

            localStream.getTracks().forEach(track =>
                peerConnection.addTrack(track, localStream)
            );

            // peerConnection.ontrack = (event) => {
            //     const remoteVideo = document.getElementById("remoteVideo");
            //     if (!remoteVideo.srcObject) {
            //         remoteVideo.srcObject = new MediaStream();
            //     }
            //     remoteVideo.srcObject.addTrack(event.track);
            // };
            peerConnection.ontrack = (event) => {
                const remoteVideo = document.getElementById("remoteVideo");
                if (!remoteVideo.srcObject) {
                    remoteVideo.srcObject = new MediaStream();
                }
                const remoteStream = remoteVideo.srcObject;
                remoteStream.addTrack(event.track); // Đảm bảo MediaStream được cập nhật
            };


            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("sendIceCandidate", {
                        targetId: receiverId,
                        candidate: event.candidate
                    });
                }
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.emit("sendOffer", {
                callerId,
                receiverId,
                offer
            });
        } catch (error) {
            console.error("WebRTC setup error:", error);
        }
    }

    socket.on("receiveOffer", async ({ callerId, offer }) => {
        peerConnection = new RTCPeerConnection({ iceServers });  // Thêm dòng này nếu chưa có
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("sendAnswer", {
            receiverId: callerId,
            callerId: receiverId,
            answer
        });
    });


    socket.on("receiveAnswer", ({ answer }) => {
        if (!peerConnection) {
            console.error("peer bị thiếu khi nhận answer");
            return;
        }
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("receiveIceCandidate", ({ candidate }) => {
        if (!peerConnection) {
            console.error("peer bị thiếu khi nhận ice candidate");
            return;
        }
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });


    if (callerId) {
        setupWebRTC();
    }
});