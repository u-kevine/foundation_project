const notificationService = require('../../services/notification.service');

const notificationHandler = {
  async handleGetNotifications(socket) {
    try {
      const notifications = await notificationService.getUserNotifications(
        socket.user.id,
        20,
        0
      );

      socket.emit('notifications_list', {
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      socket.emit('error', { message: 'Error fetching notifications' });
    }
  },

  async handleMarkNotificationRead(socket, data) {
    try {
      const { notificationId } = data;
      
      await notificationService.markAsRead(notificationId, socket.user.id);
      
      socket.emit('notification_marked_read', {
        success: true,
        notificationId,
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      socket.emit('error', { message: 'Error marking notification as read' });
    }
  },

  async handleMarkAllRead(socket) {
    try {
      await notificationService.markAllAsRead(socket.user.id);
      
      socket.emit('all_notifications_marked_read', {
        success: true,
      });
    } catch (error) {
      console.error('Mark all read error:', error);
      socket.emit('error', { message: 'Error marking all as read' });
    }
  },

  async handleGetUnreadCount(socket) {
    try {
      const count = await notificationService.getUnreadCount(socket.user.id);
      
      socket.emit('unread_count', {
        success: true,
        count,
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      socket.emit('error', { message: 'Error getting unread count' });
    }
  },
};

module.exports = notificationHandler;