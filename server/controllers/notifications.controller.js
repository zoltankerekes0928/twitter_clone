import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notification = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "userName profileImg",
    });

    await Notification.updateMany({ to: userId }, { read: true });

    return res.status(200).json(notification);
  } catch (err) {
    return res.status(500).json({ err: "Internal server error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });
    return res.status(200).json({ message: "Notification deleted" });
  } catch (err) {
    return res.status(500).json({ err: "Internal server error" });
  }
};

export const deleteOneNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ err: "Notification not found" });
    }

    if (notification.to.toString() !== userId.toString()) {
      return res
        .status(404)
        .json({ message: "You are not authorized to delete this item." });
    }

    await Notification.findByIdAndDelete(notificationId);

    return res.status(200).json({ message: "Notification deleleted" });
  } catch (err) {
    return res.status(500).json("Internal server error");
  }
};
