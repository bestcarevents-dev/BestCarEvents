import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export interface Notification {
  id?: string;
  type: 'event_request' | 'car_request' | 'auction_request' | 'hotel_request' | 'club_request' | 'service_request' | 'partner_request' | 'newsletter_request' | 'payment' | 'partner_ad_edit';
  title: string;
  message: string;
  status?: 'unread' | 'read';
  data?: any;
  createdAt?: any;
  userId?: string;
  userEmail?: string;
  relatedId?: string; // ID of the related document (e.g., car ID, event ID)
}

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'> & { status?: 'unread' | 'read' }) {
  try {
    const notificationData = {
      ...notification,
      createdAt: serverTimestamp(),
      status: notification.status || 'unread'
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log('Notification created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error to avoid disrupting main functionality
    return null;
  }
}

export async function getUnreadNotifications() {
  try {
    const q = query(collection(db, 'notifications'), where('status', '==', 'unread'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      status: 'read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const unreadNotifications = await getUnreadNotifications();
    const updatePromises = unreadNotifications.map(notification => 
      updateDoc(doc(db, 'notifications', notification.id!), {
        status: 'read'
      })
    );
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Helper functions for specific notification types
export async function createEventRequestNotification(eventData: any) {
  return createNotification({
    type: 'event_request',
    title: 'New Event Request',
    message: `New event "${eventData.eventName}" submitted by ${eventData.organizerName}`,
    data: eventData,
    userId: eventData.userId,
    userEmail: eventData.organizerContact,
    relatedId: eventData.id
  });
}

export async function createCarRequestNotification(carData: any) {
  return createNotification({
    type: 'car_request',
    title: 'New Car Listing Request',
    message: `New car "${carData.make} ${carData.model} ${carData.year}" submitted by ${carData.sellerName}`,
    data: carData,
    userId: carData.userId,
    userEmail: carData.sellerContact,
    relatedId: carData.id
  });
}

export async function createAuctionRequestNotification(auctionData: any) {
  return createNotification({
    type: 'auction_request',
    title: 'New Auction Request',
    message: `New auction "${auctionData.auctionTitle}" submitted by ${auctionData.organizerName}`,
    data: auctionData,
    userId: auctionData.userId,
    userEmail: auctionData.organizerContact,
    relatedId: auctionData.id
  });
}

export async function createHotelRequestNotification(hotelData: any) {
  return createNotification({
    type: 'hotel_request',
    title: 'New Hotel Submission',
    message: `New hotel "${hotelData.hotelName}" submitted by ${hotelData.contactPerson}`,
    data: hotelData,
    userId: hotelData.userId,
    userEmail: hotelData.contactEmail,
    relatedId: hotelData.id
  });
}

export async function createClubRequestNotification(clubData: any) {
  return createNotification({
    type: 'club_request',
    title: 'New Club Registration',
    message: `New club "${clubData.clubName}" submitted by ${clubData.contactName}`,
    data: clubData,
    userId: clubData.userId,
    userEmail: clubData.contactEmail,
    relatedId: clubData.id
  });
}

export async function createServiceRequestNotification(serviceData: any) {
  return createNotification({
    type: 'service_request',
    title: 'New Service Request',
    message: `New service "${serviceData.serviceName}" submitted by ${serviceData.contactInfo}`,
    data: serviceData,
    userId: serviceData.userId,
    userEmail: serviceData.contactInfo,
    relatedId: serviceData.id
  });
}

export async function createPartnerRequestNotification(partnerData: any) {
  return createNotification({
    type: 'partner_request',
    title: 'New Partner Application',
    message: `New partner application from ${partnerData.businessName}`,
    data: partnerData,
    userId: partnerData.userId,
    userEmail: partnerData.contactEmail,
    relatedId: partnerData.id
  });
}

export async function createNewsletterRequestNotification(newsletterData: any) {
  return createNotification({
    type: 'newsletter_request',
    title: 'New Newsletter Request',
    message: `New newsletter "${newsletterData.title}" submitted by ${newsletterData.uploadedByUser}`,
    data: newsletterData,
    userId: newsletterData.userId,
    userEmail: newsletterData.uploadedByUserEmail,
    relatedId: newsletterData.id
  });
}

export async function createPaymentNotification(paymentData: any) {
  return createNotification({
    type: 'payment',
    title: 'Payment Completed',
    message: `Payment of ${paymentData.amount} for ${paymentData.description} completed by ${paymentData.customerEmail}`,
    data: paymentData,
    userEmail: paymentData.customerEmail,
    relatedId: paymentData.paymentId
  });
} 

export async function createPartnerAdEditNotification(payload: { adId: string; userId?: string; userEmail?: string; adSummary?: any }) {
  return createNotification({
    type: 'partner_ad_edit',
    title: 'Partner Ad Updated',
    message: `Ad ${payload.adId} was updated`,
    data: payload.adSummary || null,
    userId: payload.userId,
    userEmail: payload.userEmail,
    relatedId: payload.adId,
  });
}