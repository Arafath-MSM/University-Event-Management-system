const API_BASE_URL = 'http://localhost:8000/';

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    service_type?: string;
    status: string;
  };
  token?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  token?: string;
}

export interface ApiError {
  success: false;
  message: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('eventra_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    try {
      // Try to find JSON in the response (in case there's HTML output before JSON)
      const jsonMatch = responseText.match(/\{.*\}/s);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      
      const data = JSON.parse(jsonText);
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Response parsing error:', error);
      console.error('Response status:', response.status);
      console.error('Response text:', responseText);
      throw new Error('Failed to parse response from server');
    }
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse<LoginResponse>(response);
    
    if (data.success && data.token) {
      localStorage.setItem('eventra_token', data.token);
    }
    
    return data;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await this.handleResponse<RegisterResponse>(response);
    
    if (data.success && data.token) {
      localStorage.setItem('eventra_token', data.token);
    }
    
    return data;
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    return this.handleResponse(response);
  }



  // Venues endpoints
  async getVenues(params?: {
    search?: string;
    type?: string;
    min_capacity?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.min_capacity) queryParams.append('min_capacity', params.min_capacity.toString());

    const response = await fetch(`${API_BASE_URL}/venues/read.php?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async createVenue(venueData: {
    name: string;
    capacity: number;
    location: string;
    type: string;
    restrictions?: string;
    images?: string[];
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/venues/create.php`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(venueData),
    });

    return this.handleResponse(response);
  }

  // Bookings endpoints
  async getBookings(params?: {
    user_id?: number;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    const response = await fetch(`${API_BASE_URL}/bookings/read.php?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async createBooking(bookingData: {
    venue_id: number;
    event_title: string;
    description?: string;
    date: string;
    time: string;
    participants: number;
    facilities?: string[];
  }): Promise<any> {
    try {
      console.log('Sending booking request to:', `${API_BASE_URL}/bookings/create.php`);
      console.log('Request headers:', this.getAuthHeaders());
      console.log('Request body:', bookingData);
      
      const response = await fetch(`${API_BASE_URL}/bookings/create.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(bookingData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in createBooking:', error);
      throw error;
    }
  }

  async cancelBooking(bookingId: number): Promise<any> {
    try {
      console.log('Cancelling booking:', bookingId);
      
      const response = await fetch(`${API_BASE_URL}/bookings/cancel.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ booking_id: bookingId }),
      });

      console.log('Cancel response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in cancelBooking:', error);
      throw error;
    }
  }

  // Users endpoints
  async getUsers(params?: {
    role?: string;
    search?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/users/read.php?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  // Logout
  logout(): void {
    localStorage.removeItem('eventra_token');
    localStorage.removeItem('eventra_user');
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = localStorage.getItem('eventra_token');
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify.php`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  // Reports & Analytics endpoints
  async getEventStatistics(params?: {
    start_date?: string;
    end_date?: string;
    event_type?: string;
    venue_id?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.event_type) queryParams.append('event_type', params.event_type);
      if (params?.venue_id) queryParams.append('venue_id', params.venue_id);

      const response = await fetch(`${API_BASE_URL}/reports/event-statistics.php?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in getEventStatistics:', error);
      throw error;
    }
  }

  async getEventReports(params?: {
    start_date?: string;
    end_date?: string;
    event_type?: string;
    venue_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.event_type) queryParams.append('event_type', params.event_type);
      if (params?.venue_id) queryParams.append('venue_id', params.venue_id);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());

      const response = await fetch(`${API_BASE_URL}/reports/event-reports.php?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in getEventReports:', error);
      throw error;
    }
  }

  async getVenueAnalytics(params?: {
    start_date?: string;
    end_date?: string;
    venue_id?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.venue_id) queryParams.append('venue_id', params.venue_id);

      const response = await fetch(`${API_BASE_URL}/reports/venue-analytics.php?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
      } catch (error) {
        console.error('Error in getVenueAnalytics:', error);
        throw error;
      }
  }

  async getUserAnalytics(params?: {
    start_date?: string;
    end_date?: string;
    user_role?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);
      if (params?.user_role) queryParams.append('user_role', params.user_role);

      const response = await fetch(`${API_BASE_URL}/reports/user-analytics.php?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in getUserAnalytics:', error);
      throw error;
    }
  }

  // Notifications endpoints
  async getNotifications(params?: {
    status?: string;
    type?: string;
    limit?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/notifications/read.php?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async markNotificationAsRead(notificationId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-read.php`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notification_id: notificationId }),
    });

    return this.handleResponse(response);
  }

  async markAllNotificationsAsRead(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-read.php`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mark_all: true }),
    });

    return this.handleResponse(response);
  }

  // Booking approval endpoints
  async approveBooking(bookingId: number): Promise<any> {
    try {
      console.log('Approving booking:', bookingId);
      
      const response = await fetch(`${API_BASE_URL}/bookings/approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          booking_id: bookingId, 
          action: 'approve' 
        }),
      });

      console.log('Approve response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in approveBooking:', error);
      throw error;
    }
  }

  async rejectBooking(bookingId: number): Promise<any> {
    try {
      console.log('Rejecting booking:', bookingId);
      
      const response = await fetch(`${API_BASE_URL}/bookings/approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          booking_id: bookingId, 
          action: 'reject' 
        }),
      });

      console.log('Reject response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in rejectBooking:', error);
      throw error;
    }
  }

  // Event Plans endpoints
  async getEventPlans(params?: {
    user_id?: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.search) queryParams.append('search', params.search);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/read.php?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in getEventPlans:', error);
      throw error;
    }
  }

  async getEventPlanApprovalDocuments(eventPlanId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/event-plans/get-approval-documents.php?event_plan_id=${eventPlanId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in getEventPlanApprovalDocuments:', error);
      throw error;
    }
  }

  async createEventPlan(eventPlanData: {
    title: string;
    type: string;
    organizer: string;
    date: string;
    time?: string;
    participants: number;
    facilities?: string[];
    documents?: string[];
    approval_documents?: {
      vc_approval?: string;
      administration_approval?: string;
      warden_approval?: string;
      student_union_approval?: string;
    };
    remarks?: string;
  }): Promise<any> {
    try {
      console.log('Sending event plan request to:', `${API_BASE_URL}/event-plans/create.php`);
      console.log('Request headers:', this.getAuthHeaders());
      console.log('Request body:', eventPlanData);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/create.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(eventPlanData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in createEventPlan:', error);
      throw error;
    }
  }

  async sendEventPlanLetters(eventPlanId: number): Promise<any> {
    try {
      console.log('Sending letters for event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/send-letters.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ event_plan_id: eventPlanId }),
      });

      console.log('Send letters response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in sendEventPlanLetters:', error);
      throw error;
    }
  }

  async approveEventPlan(eventPlanId: number, data: {
    comment?: string;
    signature_data?: any;
  }): Promise<any> {
    try {
      console.log('Approving event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/super-admin-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'approve',
          ...data
        }),
      });

      console.log('Approve event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in approveEventPlan:', error);
      throw error;
    }
  }

  async rejectEventPlan(eventPlanId: number, data: {
    comment?: string;
  }): Promise<any> {
    try {
      console.log('Rejecting event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/super-admin-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'reject',
          ...data
        }),
      });

      console.log('Reject event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in rejectEventPlan:', error);
      throw error;
    }
  }

  // Authority-specific event plan approval methods
  async approveEventPlanAsWarden(eventPlanId: number, data: {
    comment?: string;
    signed_document?: string;
  }): Promise<any> {
    try {
      console.log('Warden approving event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/warden-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'approve',
          ...data
        }),
      });

      console.log('Warden approve event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in approveEventPlanAsWarden:', error);
      throw error;
    }
  }

  async approveEventPlanAsViceChancellor(eventPlanId: number, data: {
    comment?: string;
    signed_document?: string;
  }): Promise<any> {
    try {
      console.log('Vice Chancellor approving event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/vice-chancellor-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'approve',
          ...data
        }),
      });

      console.log('Vice Chancellor approve event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in approveEventPlanAsViceChancellor:', error);
      throw error;
    }
  }

  async rejectEventPlanAsViceChancellor(eventPlanId: number, data: {
    comment?: string;
  }): Promise<any> {
    try {
      console.log('Vice Chancellor rejecting event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/vice-chancellor-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'reject',
          ...data
        }),
      });

      console.log('Vice Chancellor reject event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in rejectEventPlanAsViceChancellor:', error);
      throw error;
    }
  }

  async rejectEventPlanAsWarden(eventPlanId: number, data: {
    comment?: string;
  }): Promise<any> {
    try {
      console.log('Warden rejecting event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/warden-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'reject',
          ...data
        }),
      });

      console.log('Warden reject event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in rejectEventPlanAsWarden:', error);
      throw error;
    }
  }

  async approveEventPlanAsStudentUnion(eventPlanId: number, data: {
    comment?: string;
    signature_data?: any;
  }): Promise<any> {
    try {
      console.log('Student Union approving event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/student-union-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'approve',
          ...data
        }),
      });

      console.log('Student Union approve event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in approveEventPlanAsStudentUnion:', error);
      throw error;
    }
  }

  async rejectEventPlanAsStudentUnion(eventPlanId: number, data: {
    comment?: string;
  }): Promise<any> {
    try {
      console.log('Student Union rejecting event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/student-union-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'reject',
          ...data
        }),
      });

      console.log('Student Union reject event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in rejectEventPlanAsStudentUnion:', error);
      throw error;
    }
  }

  async approveEventPlanAsAdministration(eventPlanId: number, data: {
    comment?: string;
    signature_data?: any;
  }): Promise<any> {
    try {
      console.log('Administration approving event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/administration-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'approve',
          ...data
        }),
      });

      console.log('Administration approve event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in approveEventPlanAsAdministration:', error);
      throw error;
    }
  }

  async rejectEventPlanAsAdministration(eventPlanId: number, data: {
    comment?: string;
  }): Promise<any> {
    try {
      console.log('Administration rejecting event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/administration-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'reject',
          ...data
        }),
      });

      console.log('Administration reject event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in rejectEventPlanAsAdministration:', error);
      throw error;
    }
  }

  // Service Provider endpoints
  async approveEventPlanAsServiceProvider(eventPlanId: number, data: {
    comment?: string;
    signature_data?: any;
  }): Promise<any> {
    try {
      console.log('Service Provider approving event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/service-provider-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'approve',
          ...data
        }),
      });

      console.log('Service Provider approve event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in approveEventPlanAsServiceProvider:', error);
      throw error;
    }
  }

  async rejectEventPlanAsServiceProvider(eventPlanId: number, data: {
    comment?: string;
  }): Promise<any> {
    try {
      console.log('Service Provider rejecting event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/service-provider-approve.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId, 
          action: 'reject',
          ...data
        }),
      });

      console.log('Service Provider reject event plan response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in rejectEventPlanAsServiceProvider:', error);
      throw error;
    }
  }

  // Forward to Service Provider
  async forwardToServiceProvider(eventPlanId: number): Promise<any> {
    try {
      console.log('Forwarding event plan to Service Provider:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/forward-to-service-provider.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          event_plan_id: eventPlanId
        }),
      });

      console.log('Forward to Service Provider response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in forwardToServiceProvider:', error);
      throw error;
    }
  }

    // Send Signed Letters to User
  async sendSignedLettersToUser(eventPlanId: number, data: {
    userEmail: string;
    eventTitle: string;
    requesterName: string;
  }): Promise<any> {
    try {
      console.log('Sending signed letters to user:', eventPlanId, data.userEmail);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/send-signed-letters.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          eventPlanId: eventPlanId,
          userEmail: data.userEmail,
          eventTitle: data.eventTitle,
          requesterName: data.requesterName
        }),
      });
  
      console.log('Send signed letters response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in sendSignedLettersToUser:', error);
      throw error;
    }
  }

  // Upload Signed Letter
  async uploadSignedLetter(eventPlanId: number, letterType: string, fromRole: string, file: File): Promise<any> {
    try {
      console.log('Uploading signed letter:', eventPlanId, letterType, fromRole, file.name);
      
      const formData = new FormData();
      formData.append('eventPlanId', eventPlanId.toString());
      formData.append('letterType', letterType);
      formData.append('fromRole', fromRole);
      formData.append('signedLetter', file);

      const response = await fetch(`${API_BASE_URL}/event-plans/upload-signed-letter.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('eventra_token')}`
        },
        body: formData,
      });

      console.log('Upload signed letter response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in uploadSignedLetter:', error);
      throw error;
    }
  }

  // Get Authority Signed Letters
  async getAuthorityLetters(eventPlanId: number): Promise<any> {
    try {
      console.log('Fetching authority letters for event plan:', eventPlanId);
      
      const response = await fetch(`${API_BASE_URL}/event-plans/get-authority-letters.php?eventPlanId=${eventPlanId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
  
      console.log('Get authority letters response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in getAuthorityLetters:', error);
      throw error;
    }
  }

  // Signed Letters endpoints
  async getSignedLetters(params?: {
    booking_id?: number;
    event_plan_id?: number;
    from_role?: string;
    status?: string;
    letter_type?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.booking_id) queryParams.append('booking_id', params.booking_id.toString());
    if (params?.event_plan_id) queryParams.append('event_plan_id', params.event_plan_id.toString());
    if (params?.from_role) queryParams.append('from_role', params.from_role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.letter_type) queryParams.append('letter_type', params.letter_type);

    const response = await fetch(`${API_BASE_URL}/signed-letters/read.php?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  // Get System Logs
  async getSystemLogs(params?: {
    limit?: number;
    type?: string;
    user_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
      if (params?.start_date) queryParams.append('start_date', params.start_date);
      if (params?.end_date) queryParams.append('end_date', params.end_date);

      const response = await fetch(`${API_BASE_URL}/system-logs/get-system-logs.php?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error in getSystemLogs:', error);
      throw error;
    }
  }

  // Password Reset endpoints
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  async validateResetToken(token: string): Promise<{
    success: boolean;
    message: string;
    data?: {
      user_id: number;
      user_name: string;
      user_email: string;
      expires_at: string;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/auth/validate-reset-token.php?token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse<{
      success: boolean;
      message: string;
      data?: {
        user_id: number;
        user_name: string;
        user_email: string;
        expires_at: string;
      };
    }>(response);
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password,
        confirm_password: confirmPassword,
      }),
    });

    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  // Get current user from localStorage
  getCurrentUser(): any {
    const userStr = localStorage.getItem('eventra_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const apiService = new ApiService();
export default apiService; 