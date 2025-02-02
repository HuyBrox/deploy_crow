
document.addEventListener('DOMContentLoaded', () => {
    const id = document.querySelector('.userId').value;
    if (!id) return;

    const socket = io('http://localhost:5000', {
        query: { userId: id }
    });

    socket.on('incomingCall', ({ callerId, callerName, callType }) => {
        const acceptCall = confirm(`${callerName} đang gọi ${callType === 'video' ? 'video' : 'voice'}. Bạn có muốn trả lời không?`);

        if (acceptCall) {
            window.location.href = `/call/${callerId}/type/${callType}`;
            socket.emit('respondToCall', {
                callerId,
                receiverId: id,
                accepted: true
            });
        } else {
            socket.emit('respondToCall', {
                callerId,
                receiverId: id,
                accepted: false
            });
        }
    });

    socket.on('callResponse', ({ receiverId, accepted }) => {
        if (!accepted) {
            alert('Cuộc gọi đã bị từ chối');
            window.location.href = '/';
        }
    });
});
// Trong client
let socket;

function initSocket(userId) {
    // Đóng kết nối cũ nếu tồn tại
    if (socket) {
        socket.disconnect();
    }

    socket = io('http://localhost:5000', {
        query: { userId: userId }
    });

    // Các event listener khác
}

// Khi load trang
initSocket(userId);

// Khi đóng tab
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.disconnect();
    }
});