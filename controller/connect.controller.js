import User from '../models/user.model.js';
import { getReciverSocketIds, io } from "../socket/socket.js";

export const call = async (req, res) => {
    try {
        const { receiverId, type } = req.params;
        if (!['voice', 'video'].includes(type)) {
            req.flash("error", "Loại cuộc gọi không hợp lệ");
            res.redirect("/");
            return;
        }

        const caller = res.locals.user;

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            req.flash("error", "Người dùng không tồn tại");
            res.redirect("/");
            return;
        }

        const receiverSockets = getReciverSocketIds(receiverId);
        if (receiverSockets.length > 0) {
            receiverSockets.forEach(socketId => {
                io.to(socketId).emit("incomingCall", {
                    callerId: caller._id,
                    callerName: caller.fullName,
                    callType: type
                });
            });

            // Render trang chờ cuộc gọi
            return res.render("./page/call/call", {
                caller: caller,
                receiver: receiver,
                callerId: caller._id.toString(),
                receiverId: receiverId
            });
        } else {
            req.flash("error", "Người nhận không trực tuyến");
            return;
        }
    } catch (error) {
        console.error("Lỗi khi khởi tạo cuộc gọi: ", error);
        req.flash("error", "Không thể thực hiện cuộc gọi");
        return;
    }
};