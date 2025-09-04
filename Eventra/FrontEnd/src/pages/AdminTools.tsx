import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import NotificationPopup from '../components/NotificationPopup';
import { useLocation } from 'react-router-dom';
import apiService from '../services/api';
import { toast } from 'sonner';
import { 
  Users, 
  MapPin, 
  CheckCircle, 
  X, 
  Edit, 
  Trash, 
  Search,
  Filter,
  Eye,
  Download,
  UserPlus,
  Bell,
  RefreshCw
} from 'lucide-react';

/**
 * Admin Tools - Super Admin Dashboard
 * 
 * Event Planning Workflow:
 * 1. Event Plan submitted → automatically goes to Service Provider dashboard
 * 2. Super Admin clicks "Notify Service Provider" → sends reminder notification
 * 3. Service Provider approves/rejects → status updates, notification sent
 * 4. Super Admin reviews all approvals (VC, Warden, Admin, SU, Service Provider)
 * 5. Super Admin makes FINAL decision to approve/reject the event
 * 
 * Key Changes:
 * - Event plans automatically go to Service Provider dashboard when submitted
 * - "Notify Service Provider" button just sends reminder notifications
 * - Event plans remain visible in approval queue throughout the process
 * - Service Provider approval does NOT automatically approve the event
 * - Super Admin must review ALL approvals before making final decision
 * - Real-time notifications for service provider responses
 * - Clear approval status display in View Details modal
 */

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'service-provider' | 'super-admin' | 'vice-chancellor' | 'administration' | 'student-union' | 'warden';
  status: 'active' | 'inactive';
  joinDate: string;
}

interface PendingApproval {
  id: string;
  type: 'booking' | 'event-plan';
  title: string;
  requester: string;
  requestedBy: string;
  venue: string;
  date: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected' | 'submitted';
  approvalLetters?: {
    vc: string;
    warden: string;
    serviceProvider: string;
    administration: string;
  };
  authorityApprovals?: {
    vc: boolean;
    warden: boolean;
    administration: boolean;
    student_union: boolean;
  };
  signedLetters?: {
    vc?: string;
    warden?: string;
    administration?: string;
    student_union?: string;
  };
  serviceProviderStatus?: 'pending' | 'approved' | 'rejected' | 'notified';
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'booking_action_confirmation' | 'letter_sent' | 'letter_received' | 'service_provider_notified' | 'service_provider_approved' | 'service_provider_rejected' | 'final_approval' | 'system';
  status: 'unread' | 'read';
  related_booking_id?: number;
  related_venue_id?: number;
  booking_title?: string;
  venue_name?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

const AdminTools: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'logs' | 'notifications'>('users');
  const [approvalQueueTab, setApprovalQueueTab] = useState<'venue-booking' | 'event-planning'>('venue-booking');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectionApproval, setSelectedRejectionApproval] = useState<PendingApproval | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [rejectionEmail, setRejectionEmail] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedApproveApproval, setSelectedApproveApproval] = useState<PendingApproval | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalEmail, setApprovalEmail] = useState('');
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedViewApproval, setSelectedViewApproval] = useState<PendingApproval | null>(null);
  const [forwardedLetters, setForwardedLetters] = useState<{[key: string]: boolean}>({});
  const [signedLetters, setSignedLetters] = useState<{ [key: string]: string | { fileName: string; filePath: string; uploaded: boolean } }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [isLoadingSystemLogs, setIsLoadingSystemLogs] = useState(false);
  const [systemLogsFilters, setSystemLogsFilters] = useState({
    type: '',
    user_id: null as number | null,
    start_date: '',
    end_date: ''
  });
  const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [selectedFilePreview, setSelectedFilePreview] = useState<{
    roleName: string;
    fileName: string;
    eventTitle: string;
    requester: string;
    recipient: string;
    authorityLetter?: any;
  } | null>(null);
  const [authorityLetters, setAuthorityLetters] = useState<any[]>([]);
  const [isLoadingAuthorityLetters, setIsLoadingAuthorityLetters] = useState(false);



  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student' as User['role'],
    status: 'active' as User['status']
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'approvals' || tab === 'users' || tab === 'logs' || tab === 'notifications') {
      setActiveTab(tab as 'users' | 'approvals' | 'logs' | 'notifications');
    }
    
    // Fetch data when component mounts
    fetchAdminData();
  }, [location.search]);

  // Periodically refresh data to get real-time updates from Service Provider
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAdminData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Fetch system logs when filters change
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchSystemLogs();
    }
  }, [systemLogsFilters, activeTab]);

  const fetchSystemLogs = async () => {
    try {
      setIsLoadingSystemLogs(true);
      const params: any = { limit: 100 };
      
      if (systemLogsFilters.type) params.type = systemLogsFilters.type;
      if (systemLogsFilters.user_id) params.user_id = systemLogsFilters.user_id;
      if (systemLogsFilters.start_date) params.start_date = systemLogsFilters.start_date;
      if (systemLogsFilters.end_date) params.end_date = systemLogsFilters.end_date;
      
      const response = await apiService.getSystemLogs(params);
      
      if (response.success) {
        setSystemLogs(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching system logs:', error);
    } finally {
      setIsLoadingSystemLogs(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // Fetch notifications
      const notificationsResponse = await apiService.getNotifications({
        limit: 50
      });
      
      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data || []);
      }

      // Fetch users
      const usersResponse = await apiService.getUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.data || []);
      }

      // Fetch system logs
      await fetchSystemLogs();
      
      // Fetch pending bookings as pending approvals
      const pendingBookingsResponse = await apiService.getBookings({
        status: 'pending'
      });
      
      // Fetch all relevant event plans to get accurate status information
      const [pendingEventPlansResponse, forwardedEventPlansResponse, approvedEventPlansResponse, rejectedEventPlansResponse] = await Promise.all([
        apiService.getEventPlans({ status: 'submitted' }),
        apiService.getEventPlans({ status: 'forwarded_to_service_provider' }),
        apiService.getEventPlans({ status: 'approved' }),
        apiService.getEventPlans({ status: 'rejected' })
      ]);
      
      let allEventPlans: any[] = [];
      
      if (pendingEventPlansResponse.success) {
        allEventPlans = [...(pendingEventPlansResponse.data || [])];
      }
      
      if (forwardedEventPlansResponse.success) {
        allEventPlans = [...allEventPlans, ...(forwardedEventPlansResponse.data || [])];
      }
      
      if (approvedEventPlansResponse.success) {
        allEventPlans = [...allEventPlans, ...(approvedEventPlansResponse.data || [])];
      }
      
      if (rejectedEventPlansResponse.success) {
        allEventPlans = [...allEventPlans, ...(rejectedEventPlansResponse.data || [])];
      }
      
      const allPendingApprovals: PendingApproval[] = [];
      
      // Process bookings
      if (pendingBookingsResponse.success) {
        const bookings = pendingBookingsResponse.data || [];
        const bookingApprovals = bookings.map((booking: any) => ({
          id: booking.id.toString(),
          type: 'booking' as const,
          title: booking.event_title,
          requester: booking.user_name || booking.user?.name || 'Unknown User',
          // requestedBy: booking.user_email || booking.user?.email || 'unknown@email.com',
          venue: booking.venue_name || booking.venue?.name || 'Unknown Venue',
          date: booking.date,
          details: booking.description || 'No description provided',
          status: booking.status,
          approvalLetters: {
            vc: 'VC_Approval_Letter.pdf',
            warden: 'Warden_Approval_Letter.pdf',
            serviceProvider: 'Service_Provider_Approval_Letter.pdf',
            administration: 'Administration_Approval_Letter.pdf'
          }
        }));
        allPendingApprovals.push(...bookingApprovals);
      }
      
      // Process event plans and check for signed letters
      if (allEventPlans.length > 0) {
        for (const eventPlan of allEventPlans) {
          // Check for signed letters from each authority
          const signedLettersResponse = await apiService.getSignedLetters({
            event_plan_id: eventPlan.id
          });
          
          let authorityApprovals = {
            vc: false,
            warden: false,
            administration: false,
            student_union: false
          };
          
          let signedLetters = {
            vc: undefined,
            warden: undefined,
            administration: undefined,
            student_union: undefined
          };
          
          let serviceProviderStatus: 'pending' | 'approved' | 'rejected' | undefined = undefined;
          
          if (signedLettersResponse.success && signedLettersResponse.data) {
            const letters = signedLettersResponse.data;
            
            // Check for each authority's approval
            letters.forEach((letter: any) => {
              if (letter.from_role === 'vice-chancellor' && letter.letter_type === 'approval') {
                authorityApprovals.vc = true;
                signedLetters.vc = letter.letter_content;
              } else if (letter.from_role === 'warden' && letter.letter_type === 'approval') {
                authorityApprovals.warden = true;
                signedLetters.warden = letter.letter_content;
              } else if (letter.from_role === 'administration' && letter.letter_type === 'approval') {
                authorityApprovals.administration = true;
                signedLetters.administration = letter.letter_content;
              } else if (letter.from_role === 'student-union' && letter.letter_type === 'approval') {
                authorityApprovals.student_union = true;
                signedLetters.student_union = letter.letter_content;
              } else if (letter.from_role === 'service-provider') {
                // Check Service Provider status from signed letters (but event plan status takes priority)
                if (letter.letter_type === 'approval' && !serviceProviderStatus) {
                  serviceProviderStatus = 'approved';
                } else if (letter.letter_type === 'rejection' && !serviceProviderStatus) {
                  serviceProviderStatus = 'rejected';
                }
              }
            });
          }
          
          // Check event plan status for service provider response
          if (eventPlan.status === 'approved' && !serviceProviderStatus) {
            serviceProviderStatus = 'approved';
          } else if (eventPlan.status === 'rejected' && !serviceProviderStatus) {
            serviceProviderStatus = 'rejected';
          } else if (eventPlan.status === 'forwarded_to_service_provider' && !serviceProviderStatus) {
            serviceProviderStatus = 'pending';
          }
          
          console.log(`🔍 Event Plan ${eventPlan.id} Service Provider Status:`, {
            eventPlanStatus: eventPlan.status,
            finalServiceProviderStatus: serviceProviderStatus,
            hasSignedLetters: signedLettersResponse.success && signedLettersResponse.data ? signedLettersResponse.data.length : 0
          });
          
          const eventPlanApproval = {
            id: eventPlan.id.toString(),
            type: 'event-plan' as const,
            title: eventPlan.title,
            requester: eventPlan.user_name || eventPlan.user?.name || 'Unknown User',
            requestedBy: eventPlan.user_email || eventPlan.user?.email || 'unknown@email.com',
            venue: eventPlan.venue_name || 'TBD',
            date: eventPlan.date,
            details: eventPlan.remarks || eventPlan.description || 'No description provided',
            status: eventPlan.status,
            approvalLetters: {
              vc: 'VC_Approval_Letter.pdf',
              warden: 'Warden_Approval_Letter.pdf',
              serviceProvider: 'Service_Provider_Approval_Letter.pdf',
              administration: 'Administration_Approval_Letter.pdf'
            },
            authorityApprovals,
            signedLetters,
            serviceProviderStatus
          };
          
          allPendingApprovals.push(eventPlanApproval);
        }
      }
      
      console.log('🔍 Final AdminTools Data:', {
        totalEventPlans: allEventPlans.length,
        pendingApprovals: allPendingApprovals.length,
        serviceProviderStatuses: allPendingApprovals
          .filter(a => a.type === 'event-plan')
          .map(a => ({ id: a.id, title: a.title, serviceProviderStatus: a.serviceProviderStatus }))
      });
      
      setPendingApprovals(allPendingApprovals);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleApproval = (approvalId: string, action: 'approve' | 'reject') => {
    const approval = pendingApprovals.find(a => a.id === approvalId);
    if (!approval) return;

    // For event plans, check if this is a final approval or just status update
    if (approval.type === 'event-plan') {
      // Check if all authorities have approved
      const allAuthoritiesApproved = approval.authorityApprovals ? 
        approval.authorityApprovals.vc && 
        approval.authorityApprovals.warden && 
        approval.authorityApprovals.administration && 
        approval.authorityApprovals.student_union : false;

      // Check if service provider has approved
      const serviceProviderApproved = approval.serviceProviderStatus === 'approved';

      if (action === 'approve' && (!allAuthoritiesApproved || !serviceProviderApproved)) {
        // This is not a final approval - show error
        toast.error('Cannot approve event plan. All authorities and service provider must approve first.');
        return;
      }
    }

    if (action === 'reject') {
      setSelectedRejectionApproval(approval);
      setRejectionEmail(approval.requestedBy);
      setShowRejectModal(true);
    } else {
      setSelectedApproveApproval(approval);
      setApprovalEmail(approval.requestedBy);
      setShowApproveModal(true);
    }
  };

  const handleRejectWithComment = async () => {
    if (!rejectionComment.trim()) {
      alert('Please provide a rejection comment.');
      return;
    }

    if (selectedRejectionApproval) {
      try {
        let response;
        
        if (selectedRejectionApproval.type === 'event-plan') {
          // Call the API to reject the event plan
          response = await apiService.rejectEventPlan(parseInt(selectedRejectionApproval.id), {
            comment: rejectionComment
          });
        } else {
          // Call the API to reject the booking
          response = await apiService.rejectBooking(parseInt(selectedRejectionApproval.id));
        }
        
        if (response.success) {
          // Update the approval status locally
          setPendingApprovals(pendingApprovals.map(approval => 
            approval.id === selectedRejectionApproval.id 
              ? { ...approval, status: 'rejected' }
              : approval
          ));

          // Show success message
          const message = selectedRejectionApproval.type === 'event-plan' 
            ? 'Event plan rejected successfully. User has been notified.'
            : 'Booking rejected successfully. User has been notified.';
          alert(message);

          // Refresh the data
          fetchAdminData();
        } else {
          alert(`Failed to reject ${selectedRejectionApproval.type === 'event-plan' ? 'event plan' : 'booking'}: ${response.message}`);
        }
      } catch (error) {
        console.error('Error rejecting request:', error);
        alert(`Failed to reject ${selectedRejectionApproval.type === 'event-plan' ? 'event plan' : 'booking'}. Please try again.`);
      }

      // Reset modal state
      setShowRejectModal(false);
      setSelectedRejectionApproval(null);
      setRejectionComment('');
      setRejectionEmail('');
    }
  };

  const handleApproveWithComment = async () => {
    if (selectedApproveApproval) {
      try {
        let response;
        
        if (selectedApproveApproval.type === 'event-plan') {
          // Check if all authorities have approved
          const authorityApprovals = selectedApproveApproval.authorityApprovals;
          if (!authorityApprovals || !(authorityApprovals.vc && authorityApprovals.warden && authorityApprovals.administration && authorityApprovals.student_union)) {
            const missingAuthorities = [];
            if (!authorityApprovals?.vc) missingAuthorities.push('Vice Chancellor');
            if (!authorityApprovals?.warden) missingAuthorities.push('Warden');
            if (!authorityApprovals?.administration) missingAuthorities.push('Administration');
            if (!authorityApprovals?.student_union) missingAuthorities.push('Student Union');
            
            alert(`Cannot approve event plan. Missing approvals from: ${missingAuthorities.join(', ')}`);
            return;
          }
          
          // Call the API to approve the event plan
          response = await apiService.approveEventPlan(parseInt(selectedApproveApproval.id), {
            comment: approvalComment
          });
        } else {
          // Call the API to approve the booking
          response = await apiService.approveBooking(parseInt(selectedApproveApproval.id));
        }
        
        if (response.success) {
          // Update the approval status locally
          setPendingApprovals(pendingApprovals.map(approval => 
            approval.id === selectedApproveApproval.id 
              ? { ...approval, status: 'approved' }
              : approval
          ));

          // Show success message
          const message = selectedApproveApproval.type === 'event-plan' 
            ? 'Event planning approved successfully. User has been notified.'
            : 'Booking approved successfully. User has been notified.';
          alert(message);

          // Refresh the data
          fetchAdminData();
        } else {
          alert(`Failed to approve ${selectedApproveApproval.type === 'event-plan' ? 'event plan' : 'booking'}: ${response.message}`);
        }
      } catch (error) {
        console.error('Error approving request:', error);
        alert(`Failed to approve ${selectedApproveApproval.type === 'event-plan' ? 'event plan' : 'booking'}. Please try again.`);
      }

      // Reset modal state
      setShowApproveModal(false);
      setSelectedApproveApproval(null);
      setApprovalComment('');
      setApprovalEmail('');
    }
  };

  const handleViewDetails = async (approval: PendingApproval) => {
    setSelectedViewApproval(approval);
    setShowViewDetailsModal(true);
    
    // Fetch authority signed letters for this event plan
    if (approval.type === 'event-plan') {
      try {
        setIsLoadingAuthorityLetters(true);
        const response = await apiService.getAuthorityLetters(parseInt(approval.id));
        if (response.success) {
          setAuthorityLetters(response.data || []);
        } else {
          console.error('Failed to fetch authority letters:', response.message);
          setAuthorityLetters([]);
        }
      } catch (error) {
        console.error('Error fetching authority letters:', error);
        setAuthorityLetters([]);
      } finally {
        setIsLoadingAuthorityLetters(false);
      }
    }
  };

  const handleForwardLetter = (letterType: string) => {
    if (selectedViewApproval) {
      setForwardedLetters(prev => ({
        ...prev,
        [`${selectedViewApproval.id}-${letterType}`]: true
      }));
      
      // Simulate forwarding to respective dashboard
      const dashboardMap: {[key: string]: string} = {
        vc: 'Vice Chancellor',
        warden: 'Warden',
        serviceProvider: 'Service Provider',
        administration: 'University Administration'
      };
      
      console.log(`Letter forwarded to ${dashboardMap[letterType]} dashboard`);
      alert(`Letter forwarded to ${dashboardMap[letterType]} dashboard`);
    }
  };

  const handleUploadSignedLetter = async (letterType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && selectedViewApproval) {
        try {
          console.log('🚀 Starting upload for:', letterType, 'File:', file.name);
          
          // Map letterType to fromRole for the backend
          const roleMapping: { [key: string]: string } = {
            'vc': 'vice-chancellor',
            'warden': 'warden',
            'serviceProvider': 'service-provider',
            'administration': 'administration'
          };
          
          const fromRole = roleMapping[letterType];
          if (!fromRole) {
            toast.error('Invalid letter type');
            return;
          }

          console.log('📤 Calling API with:', {
            eventPlanId: selectedViewApproval.id,
            letterType: 'approval',
            fromRole: fromRole,
            fileName: file.name
          });

          // Upload the file to the backend
          const response = await apiService.uploadSignedLetter(
            parseInt(selectedViewApproval.id),
            'approval',
            fromRole,
            file
          );

          console.log('📥 API Response:', response);

          if (response.success) {
            // Update the frontend state with the uploaded file info
            setSignedLetters(prev => ({
              ...prev,
              [`${selectedViewApproval.id}-${letterType}`]: {
                fileName: file.name,
                filePath: response.file_path,
                uploaded: true
              }
            }));
            toast.success(`Signed letter uploaded for ${letterType.toUpperCase()}`);
            console.log('✅ Upload successful, state updated');
          } else {
            toast.error(`Failed to upload: ${response.message}`);
            console.error('❌ Upload failed:', response.message);
          }
        } catch (error) {
          console.error('💥 Upload error:', error);
          toast.error('Failed to upload signed letter');
        }
      }
    };
    input.click();
  };

  const handleRemoveSignedLetter = (letterType: string) => {
    if (selectedViewApproval) {
      setSignedLetters(prev => {
        const newLetters = { ...prev };
        delete newLetters[`${selectedViewApproval.id}-${letterType}`];
        return newLetters;
      });
      toast.success(`Signed letter removed for ${letterType.toUpperCase()}`);
    }
  };

  // Helper function to get display text for signed letters
  const getSignedLetterDisplayText = (letterType: string): string => {
    const key = `${selectedViewApproval?.id}-${letterType}`;
    const letter = signedLetters[key];
    
    if (typeof letter === 'string') {
      return letter; // Legacy format
    } else if (letter && typeof letter === 'object' && 'fileName' in letter) {
      return letter.fileName; // New format
    }
    return '';
  };

  // Helper function to check if a letter is uploaded
  const isLetterUploaded = (letterType: string): boolean => {
    const key = `${selectedViewApproval?.id}-${letterType}`;
    const letter = signedLetters[key];
    
    if (typeof letter === 'string') {
      return letter.length > 0; // Legacy format
    } else if (letter && typeof letter === 'object' && 'uploaded' in letter) {
      return letter.uploaded; // New format
    }
    return false;
  };

  const handleViewAuthorityLetter = (role: string) => {
    if (selectedViewApproval) {
      // Find the authority letter for this role
      const authorityLetter = authorityLetters.find(letter => letter.role === role);
      
      console.log('🔍 Viewing authority letter for role:', role);
      console.log('📄 Authority letter data:', authorityLetter);
      
      if (authorityLetter && (authorityLetter.signature_data || authorityLetter.letter_content)) {
        console.log('✅ Found letter content:', {
          signature_data: authorityLetter.signature_data ? 'Available' : 'Not available',
          letter_content: authorityLetter.letter_content ? 'Available' : 'Not available'
        });
        
        // Set the file preview data and show modal
        setSelectedFilePreview({
          roleName: authorityLetter.role_display_name,
          fileName: `${authorityLetter.role_display_name} Approval Letter`,
          eventTitle: selectedViewApproval.title,
          requester: selectedViewApproval.requester,
          recipient: selectedViewApproval.requestedBy,
          authorityLetter: authorityLetter
        });
        setShowFilePreviewModal(true);
        
      } else {
        const roleDisplayNames = {
          'vice-chancellor': 'Vice Chancellor',
          'warden': 'Warden', 
          'administration': 'Administration',
          'student-union': 'Student Union'
        };
        console.log('❌ No letter content available for role:', role);
        toast.error(`No ${roleDisplayNames[role as keyof typeof roleDisplayNames] || role} letter content available`);
      }
    } else {
      toast.error('No event plan selected');
    }
  };

  // Function to validate and clean base64 PDF data
  const getValidPdfDataUrl = (base64Content: string): string | null => {
    try {
      // Check if it's already a valid data URL
      if (base64Content.startsWith('data:application/pdf;base64,')) {
        return base64Content;
      }
      
      // If it's just base64 content, convert to data URL
      if (base64Content && !base64Content.includes('data:')) {
        return `data:application/pdf;base64,${base64Content}`;
      }
      
      return null;
    } catch (error) {
      console.error('Error processing PDF data:', error);
      return null;
    }
  };



  const handleSendToUser = async () => {
    if (selectedViewApproval) {
      try {
        console.log('🚀 Starting send process for event plan:', selectedViewApproval.id);
        
        // Check if all 4 signed letters are uploaded
        const uploadedCount = [isLetterUploaded('vc'), isLetterUploaded('warden'), isLetterUploaded('serviceProvider'), isLetterUploaded('administration')].filter(Boolean).length;
        
        console.log('📊 Upload count check:', {
          vc: isLetterUploaded('vc'),
          warden: isLetterUploaded('warden'),
          serviceProvider: isLetterUploaded('serviceProvider'),
          administration: isLetterUploaded('administration'),
          total: uploadedCount
        });
        
        if (uploadedCount === 4) {
          console.log('✅ All letters uploaded, calling API...');
          
          // Call the backend API to send signed letters to user
          const response = await apiService.sendSignedLettersToUser(parseInt(selectedViewApproval.id), {
            userEmail: selectedViewApproval.requestedBy,
            eventTitle: selectedViewApproval.title,
            requesterName: selectedViewApproval.requester
          });
          
          console.log('📥 Send API Response:', response);
          
          if (response.success) {
            // Get the uploaded signed letters for display
            const vcLetter = signedLetters[`${selectedViewApproval.id}-vc`];
            const wardenLetter = signedLetters[`${selectedViewApproval.id}-warden`];
            const serviceProviderLetter = signedLetters[`${selectedViewApproval.id}-serviceProvider`];
            const administrationLetter = signedLetters[`${selectedViewApproval.id}-administration`];
            
            // Create notification for super-admin
            const newNotification: Notification = {
              id: Date.now(),
              title: 'Signed Letters Sent to User',
              message: `All 4 signed letters for event plan '${selectedViewApproval.title}' have been sent to ${selectedViewApproval.requestedBy}`,
              type: 'letter_sent',
              status: 'unread',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            
            toast.success(`All signed letters have been sent to ${selectedViewApproval.requestedBy}`);
        console.log(`Signed letters sent to user: ${selectedViewApproval.requestedBy}`);
            
            // Show success message with details
            alert(`✅ Signed Letters Successfully Sent!\n\nEvent: ${selectedViewApproval.title}\nRecipient: ${selectedViewApproval.requestedBy}\n\nLetters Sent:\n• VC Approval: ${vcLetter}\n• Warden Approval: ${wardenLetter}\n• Service Provider Approval: ${serviceProviderLetter}\n• Administration Approval: ${administrationLetter}\n\nEmail has been sent to the user with all signed letters attached.\n\nEmail Details:\n• Subject: Event Plan Approved - Signed Letters: ${selectedViewApproval.title}\n• Recipient: ${selectedViewApproval.requestedBy}\n• Status: ${response.email_details?.status || 'Sent'}\n• Delivery: ${response.email_details?.delivery_confirmation || 'Confirmed'}`);
      } else {
            toast.error(response.message || 'Failed to send signed letters to user');
          }
        } else {
          toast.error(`Please upload all 4 signed letters (VC, Warden, Service Provider, Administration) before sending to user`);
        }
      } catch (error) {
        console.error('Error sending signed letters to user:', error);
        toast.error('Error sending signed letters to user. Please try again.');
      }
    }
  };

  const handleForwardToServiceProvider = async () => {
    if (selectedViewApproval) {
      try {
        // Call the backend API to forward to service provider
        const response = await apiService.forwardToServiceProvider(parseInt(selectedViewApproval.id));
        
        if (response.success) {
          // Update the service provider status to pending
          setPendingApprovals(prev => 
            prev.map(approval => 
              approval.id === selectedViewApproval.id 
                ? { ...approval, serviceProviderStatus: 'pending' }
                : approval
            )
          );
          
          // Update the selected approval
          setSelectedViewApproval(prev => 
            prev ? { ...prev, serviceProviderStatus: 'pending' } : null
          );
          
          // Log the action
          console.log(`Event planning request forwarded to Service Provider Dashboard`);
          console.log(`Event: ${selectedViewApproval.title}`);
          console.log(`Services: ${selectedViewApproval.approvalLetters ? Object.keys(selectedViewApproval.approvalLetters).join(', ') : 'N/A'}`);
          
          // Create notification for super-admin
          const newNotification: Notification = {
            id: Date.now(),
            title: 'Event Plan Forwarded to Service Provider',
            message: `Event plan '${selectedViewApproval.title}' has been forwarded to Service Provider Dashboard for service approval.`,
            type: 'service_provider_notified',
            status: 'unread',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          
          toast.success(`Event planning request forwarded to Service Provider Dashboard for service approval`);
        } else {
          toast.error(response.message || 'Failed to forward event plan to Service Provider');
        }
      } catch (error) {
        console.error('Error forwarding to service provider:', error);
        toast.error('Error forwarding event plan to Service Provider. Please try again.');
      }
    }
  };

  // Handle service provider response (called when service provider approves/rejects)
  // This function would normally be called by your backend when service provider responds
  const handleServiceProviderResponse = async (eventPlanId: string, response: 'approved' | 'rejected', comment?: string) => {
    try {
      // Update the service provider status locally
      setPendingApprovals(prev => 
        prev.map(approval => 
          approval.id === eventPlanId 
            ? { ...approval, serviceProviderStatus: response }
            : approval
        )
      );
      
      // Update the selected approval if it's the same one
      if (selectedViewApproval && selectedViewApproval.id === eventPlanId) {
        setSelectedViewApproval(prev => 
          prev ? { ...prev, serviceProviderStatus: response } : null
        );
      }
      
      // Create notification for super-admin about service provider decision
      const eventPlan = pendingApprovals.find(a => a.id === eventPlanId);
      const newNotification: Notification = {
        id: Date.now(),
        title: `Service Provider ${response === 'approved' ? 'Approved' : 'Rejected'} Event Plan`,
        message: `Event plan '${eventPlan?.title || 'Unknown'}' has been ${response} by Service Provider. ${comment ? `Comment: ${comment}` : ''}`,
        type: response === 'approved' ? 'service_provider_approved' : 'service_provider_rejected',
        status: 'unread',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      toast.success(`Service Provider has ${response} the event plan. Check notifications for details.`);
      
      // Refresh data to get latest status
      fetchAdminData();
    } catch (error) {
      console.error('Error handling service provider response:', error);
      toast.error('Error updating service provider status. Please refresh the page.');
    }
  };

  // For testing purposes - simulate service provider response
  // In real implementation, this would come from your backend when service provider acts
  const simulateServiceProviderResponse = (eventPlanId: string, response: 'approved' | 'rejected') => {
    handleServiceProviderResponse(eventPlanId, response, `Simulated ${response} response for testing`);
  };

  const handleServiceProviderNotification = (eventName: string, serviceProvider: string, comment: string, type: 'approval' | 'rejection') => {
    const newNotification: Notification = {
      id: Date.now(),
      title: `${type === 'approval' ? 'Approval' : 'Rejection'} from ${serviceProvider}`,
      message: `${eventName}: ${comment}`,
      type: type === 'approval' ? 'booking_approved' : 'booking_rejected',
      status: 'unread',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    console.log(`Service provider notification received: ${type} for ${eventName} from ${serviceProvider}`);
  };

  const handleAuthorityNotification = (eventName: string, authority: string, comment: string, type: 'approval' | 'rejection') => {
    const newNotification: Notification = {
      id: Date.now(),
      title: `${type === 'approval' ? 'Approval' : 'Rejection'} from ${authority}`,
      message: `${eventName}: ${comment}`,
      type: type === 'approval' ? 'booking_approved' : 'booking_rejected',
      status: 'unread',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    console.log(`Authority notification received: ${type} for ${eventName} from ${authority}`);
  };

  const handleSendLetters = async (eventPlanId: string) => {
    try {
      const response = await apiService.sendEventPlanLetters(parseInt(eventPlanId));
      
      if (response.success) {
        alert('Letters sent successfully to all authorities!');
        // Refresh the data
        fetchAdminData();
      } else {
        alert('Failed to send letters. Please try again.');
      }
    } catch (error) {
      console.error('Error sending letters:', error);
      alert('Error sending letters. Please try again.');
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
            ? { ...notification, status: 'read' }
          : notification
      )
    );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...editingUser, ...newUser }
          : user
      ));
    } else {
      // Add new user
      const user: User = {
        id: Date.now().toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        joinDate: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, user]);
    }
    
    setShowUserForm(false);
    setEditingUser(null);
    setNewUser({ name: '', email: '', role: 'student', status: 'active' });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super-admin':
        return 'bg-red-100 text-red-800';
      case 'faculty':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      case 'service-provider':
        return 'bg-orange-100 text-orange-800';
      case 'vice-chancellor':
        return 'bg-indigo-100 text-indigo-800';
      case 'administration':
        return 'bg-teal-100 text-teal-800';
      case 'student-union':
        return 'bg-pink-100 text-pink-800';
      case 'warden':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Custom notification bell component for admin tools
  const AdminToolsNotificationBell = () => {
    const [notificationCount, setNotificationCount] = useState(0);
    const [isLoadingBell, setIsLoadingBell] = useState(false);

    useEffect(() => {
      fetchNotificationCount();
    }, []);

    const fetchNotificationCount = async () => {
      setIsLoadingBell(true);
      try {
        const response = await apiService.getNotifications({
          status: 'unread'
        });
        
        if (response.success) {
          const count = response.data?.length || 0;
          console.log('Setting notification count:', count);
          setNotificationCount(count);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      } finally {
        setIsLoadingBell(false);
      }
    };

    return (
      <div className="relative">
        <button 
          onClick={() => setIsNotificationPopupOpen(true)}
          className="p-2 text-white hover:text-blue-200 hover:bg-black rounded-lg relative"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg z-10">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
          {isLoadingBell && (
            <div className="absolute -top-1 -right-1 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </button>
      </div>
    );
  };

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* User Management Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <button
          onClick={() => setShowUserForm(true)}
          className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl flex items-center hover:bg-white/20 transition-colors border border-white/20"
        >
          <UserPlus size={20} className="mr-2" />
          Add New User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-xl pl-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-xl py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Roles</option>
              <optgroup label="Public Roles">
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </optgroup>
              <optgroup label="Authority Roles">
                <option value="super-admin">Super Admin</option>
                <option value="service-provider">Service Provider</option>
                <option value="vice-chancellor">Vice Chancellor</option>
                <option value="administration">Administration of UWU</option>
                <option value="student-union">Student Union</option>
                <option value="warden">Warden</option>
              </optgroup>
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
              }}
              className="bg-white/10 backdrop-blur-sm text-white w-full px-4 py-2 rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/60 backdrop-blur-sm">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-white">User</th>
                <th className="text-left py-3 px-6 font-medium text-white">Role</th>
                <th className="text-left py-3 px-6 font-medium text-white">Status</th>
                <th className="text-left py-3 px-6 font-medium text-white">Join Date</th>
                <th className="text-left py-3 px-6 font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-white">{user.name}</div>
                      <div className="text-sm text-white/70">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    
                      user.role === 'super-admin' ? 'bg-red-900/60 text-red-200 border-red-500/30' :
                      user.role === 'faculty' ? 'bg-blue-900/60 text-blue-200 border-blue-500/30' :
                      user.role === 'student' ? 'bg-green-900/60 text-green-200 border-green-500/30' :
                      user.role === 'service-provider' ? 'bg-orange-900/60 text-orange-200 border-orange-500/30' :
                      user.role === 'vice-chancellor' ? 'bg-indigo-900/60 text-indigo-200 border-indigo-500/30' :
                      user.role === 'administration' ? 'bg-teal-900/60 text-teal-200 border-teal-500/30' :
                      user.role === 'student-union' ? 'bg-pink-900/60 text-pink-200 border-pink-500/30' :
                      user.role === 'warden' ? 'bg-yellow-900/60 text-yellow-200 border-yellow-500/30' :
                      'bg-gray-900/60 text-gray-200 border-gray-500/30'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${user.status === 'active' ? 'bg-green-900/60 text-green-200 border-green-500/30' : user.status === 'inactive' ? 'bg-red-900/60 text-red-200 border-red-500/30' : 'bg-yellow-900/60 text-yellow-200 border-yellow-500/30'}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-white/70">
                    {user.joinDate}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-400 hover:text-blue-200 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`${user.status === 'active' ? 'text-red-400 hover:text-red-200' : 'text-green-400 hover:text-green-200'} transition-colors`}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-200 transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderApprovalsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Approval Queue</h2>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b border-white/20">
        <button
          onClick={() => setApprovalQueueTab('venue-booking')}
          className={`px-4 py-2 font-medium transition-colors ${
            approvalQueueTab === 'venue-booking'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Approval Queue of Venue Booking
        </button>
        <button
          onClick={() => setApprovalQueueTab('event-planning')}
          className={`px-4 py-2 font-medium transition-colors ${
            approvalQueueTab === 'event-planning'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Approval Queue of Event Planning
        </button>
      </div>
      
      <div className="space-y-4">
        {pendingApprovals
          .filter(approval => {
            const isCorrectType = (approvalQueueTab === 'venue-booking' && approval.type === 'booking') ||
                                 (approvalQueueTab === 'event-planning' && approval.type === 'event-plan');
            
            // For bookings, check for 'pending' status
            // For event plans, show all statuses (submitted, pending service provider, etc.)
            const isCorrectStatus = approval.type === 'booking' ? 
              approval.status === 'pending' : 
              true; // Show all event plans regardless of status
            
            return isCorrectType && isCorrectStatus;
          })
          .map((approval) => {
            // Check if all authorities have approved for event plans
            const allAuthoritiesApproved = approval.type === 'event-plan' && approval.authorityApprovals ? 
              approval.authorityApprovals.vc && 
              approval.authorityApprovals.warden && 
              approval.authorityApprovals.administration && 
              approval.authorityApprovals.student_union : true;

            return (
              <div key={approval.id} className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${approval.type === 'booking' ? 'bg-blue-900/60 text-blue-200 border-blue-500/30' : 'bg-purple-900/60 text-purple-200 border-purple-500/30'}`}>{approval.type === 'booking' ? 'Booking Request' : 'Event Plan'}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${approval.status === 'pending' ? 'bg-yellow-900/60 text-yellow-200 border-yellow-500/30' : approval.status === 'approved' ? 'bg-green-900/60 text-green-200 border-green-500/30' : 'bg-red-900/60 text-red-200 border-red-500/30'}`}>{approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{approval.title}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80 mb-3">
                      <div><span className="font-medium">Requester:</span> {approval.requester}</div>
                      <div><span className="font-medium">Email:</span> {approval.requestedBy}</div>
                      <div><span className="font-medium">Venue:</span> {approval.venue}</div>
                      <div><span className="font-medium">Date:</span> {approval.date}</div>
                    </div>
                    
                    {/* Authority Approval Status for Event Plans */}
                    {approval.type === 'event-plan' && approval.authorityApprovals && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-white mb-2">Authority Approvals:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${approval.authorityApprovals.vc ? 'bg-green-900/60 text-green-200' : 'bg-gray-700/60 text-gray-300'}`}>
                            <span className={`w-2 h-2 rounded-full ${approval.authorityApprovals.vc ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                            <span className="text-xs">VC</span>
                          </div>
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${approval.authorityApprovals.warden ? 'bg-green-900/60 text-green-200' : 'bg-gray-700/60 text-gray-300'}`}>
                            <span className={`w-2 h-2 rounded-full ${approval.authorityApprovals.warden ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                            <span className="text-xs">Warden</span>
                          </div>
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${approval.authorityApprovals.administration ? 'bg-green-900/60 text-green-200' : 'bg-gray-700/60 text-gray-300'}`}>
                            <span className={`w-2 h-2 rounded-full ${approval.authorityApprovals.administration ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                            <span className="text-xs">University Administration</span>
                          </div>
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${approval.authorityApprovals.student_union ? 'bg-green-900/60 text-green-200' : 'bg-gray-700/60 text-gray-300'}`}>
                            <span className={`w-2 h-2 rounded-full ${approval.authorityApprovals.student_union ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                            <span className="text-xs">SU</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Service Provider Status for Event Plans */}
                    {approval.type === 'event-plan' && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-white mb-2">Service Provider Status:</h4>
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                          approval.serviceProviderStatus === 'approved' ? 'bg-green-900/60 text-green-200' :
                          approval.serviceProviderStatus === 'rejected' ? 'bg-red-900/60 text-red-200' :
                          approval.serviceProviderStatus === 'notified' ? 'bg-blue-900/60 text-blue-200' :
                          approval.serviceProviderStatus === 'pending' ? 'bg-yellow-900/60 text-yellow-200' :
                          'bg-gray-700/60 text-gray-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            approval.serviceProviderStatus === 'approved' ? 'bg-green-400' :
                            approval.serviceProviderStatus === 'rejected' ? 'bg-red-400' :
                            approval.serviceProviderStatus === 'notified' ? 'bg-blue-400' :
                            approval.serviceProviderStatus === 'pending' ? 'bg-yellow-400' :
                            'bg-gray-400'
                          }`}></span>
                          <span className="text-xs">
                            Service Provider: {approval.serviceProviderStatus === 'approved' ? 'Approved' : 
                                             approval.serviceProviderStatus === 'rejected' ? 'Rejected' : 
                                             approval.serviceProviderStatus === 'notified' ? 'Notified' :
                                             approval.serviceProviderStatus === 'pending' ? 'Pending' :
                                             'Not Started'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-white/90 mb-4">{approval.details}</p>
                  </div>
                  
                  <div className="flex space-x-3">
                    {/* {approval.type === 'event-plan' && (
                      <button
                        onClick={() => handleSendLetters(approval.id)}
                        className="bg-purple-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center hover:bg-purple-800/80 border border-purple-500/30"
                      >
                        <Download size={16} className="mr-2" />
                        Send Letters
                      </button>
                    )} */}
                    <button
                      onClick={() => handleApproval(approval.id, 'approve')}
                      disabled={approval.type === 'event-plan' && !allAuthoritiesApproved}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center border ${
                        approval.type === 'event-plan' && !allAuthoritiesApproved
                          ? 'bg-gray-600/60 text-gray-400 border-gray-500/30 cursor-not-allowed'
                          : 'bg-green-900/80 backdrop-blur-sm text-white hover:bg-green-800/80 border-green-500/30'
                      }`}
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(approval.id, 'reject')}
                      className="bg-red-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center hover:bg-red-800/80 border border-red-500/30"
                    >
                      <X size={16} className="mr-2" />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleViewDetails(approval)}
                      className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium flex items-center hover:bg-white/20 transition-colors border border-white/20"
                    >
                      <Eye size={16} className="mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        
        {/* Show message when no pending requests */}
        {pendingApprovals
          .filter(approval => {
            const isCorrectType = (approvalQueueTab === 'venue-booking' && approval.type === 'booking') ||
                                 (approvalQueueTab === 'event-planning' && approval.type === 'event-plan');
            
            // For bookings, check for 'pending' status
            // For event plans, show all statuses (submitted, pending service provider, etc.)
            const isCorrectStatus = approval.type === 'booking' ? 
              approval.status === 'pending' : 
              true; // Show all event plans regardless of status
            
            return isCorrectType && isCorrectStatus;
          }).length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/60 text-lg font-medium">
              No {approvalQueueTab === 'venue-booking' ? 'pending venue booking' : 'event planning'} requests
            </div>
            <div className="text-white/40 text-sm mt-2">
              {approvalQueueTab === 'venue-booking' ? 'All venue booking requests have been processed' : 'No event planning requests found'}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Notifications</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/70">
            {notifications.filter(n => n.status === 'unread').length} unread
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {isLoadingNotifications ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white/50">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="mx-auto text-white/30" size={48} />
            <p className="text-white/50 mt-2">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-6 transition-all hover:bg-black/60 ${
                notification.status === 'unread' ? 'border-blue-500/50 bg-blue-500/10' : ''
              }`}
              onClick={() => markNotificationAsRead(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${
                      notification.type.includes('approved') ? 'bg-green-500' : 
                      notification.type.includes('rejected') ? 'bg-red-500' : 
                      notification.type === 'booking_action_confirmation' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      notification.type.includes('approved') 
                        ? 'bg-green-500/20 text-green-300' 
                        : notification.type.includes('rejected')
                        ? 'bg-red-500/20 text-red-300'
                        : notification.type === 'booking_action_confirmation'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {notification.type.includes('approved') ? 'Approval' : 
                       notification.type.includes('rejected') ? 'Rejection' : 
                       notification.type === 'booking_action_confirmation' ? 'Action Confirmation' :
                       notification.type.replace('_', ' ').toUpperCase()}
                    </span>
                    {notification.status === 'unread' && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                        New
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {notification.title}
                  </h4>
                  
                  <div className="text-sm text-white/90 mb-3">
                    <p className="mb-1">
                      <span className="font-medium">Message:</span> {notification.message}
                    </p>
                    <p className="mb-1">
                      <span className="font-medium">Type:</span> {notification.type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="mb-1">
                      <span className="font-medium">Time:</span> {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-gray-800/60 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2">
                      Details:
                    </h5>
                    <p className="text-white/90 text-sm leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderLogsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
  <h2 className="text-2xl font-bold text-white">System Logs</h2>
      </div>

      {/* Filters */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Activity Type</label>
            <select
              value={systemLogsFilters.type}
              onChange={(e) => setSystemLogsFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="booking">Booking</option>
              <option value="event_plan">Event Plan</option>
              <option value="venue">Venue</option>
              <option value="user">User</option>
              <option value="system">System</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">User</label>
            <select
              value={systemLogsFilters.user_id || ''}
              onChange={(e) => setSystemLogsFilters(prev => ({ 
                ...prev, 
                user_id: e.target.value ? parseInt(e.target.value) : null 
              }))}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Start Date</label>
            <input
              type="date"
              value={systemLogsFilters.start_date}
              onChange={(e) => setSystemLogsFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">End Date</label>
            <input
              type="date"
              value={systemLogsFilters.end_date}
              onChange={(e) => setSystemLogsFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={() => {
              setSystemLogsFilters({
                type: '',
                user_id: null,
                start_date: '',
                end_date: ''
              });
            }}
            className="bg-gray-600/80 hover:bg-gray-700/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/60 backdrop-blur-sm">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-white">Timestamp</th>
                <th className="text-left py-3 px-6 font-medium text-white">User</th>
                <th className="text-left py-3 px-6 font-medium text-white">Action</th>
                <th className="text-left py-3 px-6 font-medium text-white">Type</th>
                <th className="text-left py-3 px-6 font-medium text-white">Target</th>
                <th className="text-left py-3 px-6 font-medium text-white">Details</th>
                <th className="text-left py-3 px-6 font-medium text-white">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingSystemLogs ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/70">
                    <div className="flex items-center justify-center">
                      <RefreshCw size={24} className="animate-spin mr-2" />
                      Loading system logs...
                    </div>
                  </td>
                </tr>
              ) : systemLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/70">
                    No system logs found
                  </td>
                </tr>
              ) : (
                systemLogs.map((log) => (
                  <tr key={log.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-sm text-white/70">{log.timestamp}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{log.user}</span>
                        <span className="text-xs text-white/50">{log.user_role}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-white/10 backdrop-blur-sm text-white text-xs rounded border border-white/20 hover:bg-white/20 transition-colors">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs rounded border ${
                        log.type === 'system' ? 'bg-purple-900/60 text-purple-200 border-purple-500/30' :
                        log.type === 'user' ? 'bg-blue-900/60 text-blue-200 border-blue-500/30' :
                        log.type === 'booking' ? 'bg-green-900/60 text-green-200 border-green-500/30' :
                        log.type === 'event_plan' ? 'bg-yellow-900/60 text-yellow-200 border-yellow-500/30' :
                        'bg-gray-900/60 text-gray-200 border-gray-500/30'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-white/70">{log.target}</td>
                    <td className="py-4 px-6 text-sm text-white/70 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-4 px-6 text-xs text-white/50 font-mono">{log.ip_address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <Layout showSidebar={true} notificationBell={<AdminToolsNotificationBell />}>
      <div className="min-h-screen w-full flex flex-col items-stretch" style={{ backgroundColor: '#bd7880' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white">Admin Tools</h1>
              <p className="text-lg text-white/90">Manage users, approvals, and system activities</p>
          </div>
            </div>

        {/* Tabs - Full Width */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-6">
              <div className="border-b border-white/10">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'users', name: 'User Management', icon: Users },
                    { id: 'approvals', name: 'Approvals Queue', icon: CheckCircle },
                    { id: 'notifications', name: 'Notifications', icon: Bell },
                    { id: 'logs', name: 'System Logs', icon: Eye }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-white'
                          : 'border-transparent text-white/70 hover:text-blue-300 hover:border-blue-300'
                      }`}
                    >
                      <tab.icon size={20} className="mr-2" />
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'users' && renderUsersTab()}
                {activeTab === 'approvals' && renderApprovalsTab()}
                {activeTab === 'notifications' && renderNotificationsTab()}
                {activeTab === 'logs' && renderLogsTab()}
            </div>
          </div>
              </div>
            </div>

      {/* Modals */}
            {/* User Form Modal */}
            {showUserForm && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-black/90 backdrop-blur-sm rounded-2xl max-w-md w-full text-white border border-white/10 shadow-2xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">
                        {editingUser ? 'Edit User' : 'Add New User'}
                      </h2>
                      <button
                        onClick={() => {
                          setShowUserForm(false);
                          setEditingUser(null);
                          setNewUser({ name: '', email: '', role: 'student', status: 'active' });
                        }}
                        className="text-white/70 hover:text-white transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <form onSubmit={handleUserSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          className="bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-xl py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-xl py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Role
                        </label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value as User['role']})}
                          className="bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-xl py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          {/* Public Roles */}
                          <optgroup label="Public Roles">
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                          </optgroup>
                          
                          {/* Authority Roles */}
                          <optgroup label="Authority Roles">
                            <option value="service-provider">Service Provider</option>
                            <option value="super-admin">Super Admin</option>
                            <option value="vice-chancellor">Vice Chancellor</option>
                            <option value="administration">Administration of UWU</option>
                            <option value="student-union">Student Union</option>
                            <option value="warden">Warden</option>
                          </optgroup>
                        </select>
                        <p className="mt-1 text-xs text-gray-400">
                          Public roles can self-register. Authority roles require admin creation.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Status
                        </label>
                        <select
                          value={newUser.status}
                          onChange={(e) => setNewUser({...newUser, status: e.target.value as User['status']})}
                          className="bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-xl py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div className="flex justify-end space-x-4 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserForm(false);
                            setEditingUser(null);
                            setNewUser({ name: '', email: '', role: 'student', status: 'active' });
                          }}
                          className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                        >
                          {editingUser ? 'Update User' : 'Add User'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* View Details Modal */}
            {showViewDetailsModal && selectedViewApproval && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-black bg-opacity-90 rounded-xl shadow-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                  <button
                    className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold"
                    onClick={() => {
                      setShowViewDetailsModal(false);
                      setSelectedViewApproval(null);
                    }}
                  >
                    ×
                  </button>
                  
                  <h3 className="text-2xl font-bold mb-6 text-white">Event Planning Request Details</h3>
                  
                  {/* Event Details Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Event Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-800/60 rounded-lg p-4">
                        <div className="mb-3">
                          <span className="font-medium text-white">Event Title:</span>
                          <div className="text-white/90 mt-1">{selectedViewApproval.title}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-medium text-white">Requester:</span>
                          <div className="text-white/90 mt-1">{selectedViewApproval.requester}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-medium text-white">Email:</span>
                          <div className="text-white/90 mt-1">{selectedViewApproval.requestedBy}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-medium text-white">Venue:</span>
                          <div className="text-white/90 mt-1">{selectedViewApproval.venue}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-medium text-white">Date:</span>
                          <div className="text-white/90 mt-1">{selectedViewApproval.date}</div>
                        </div>
                        <div>
                          <span className="font-medium text-white">Description:</span>
                          <div className="text-white/90 mt-1">{selectedViewApproval.details}</div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Service Provider Coordination Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Service Provider Coordination</h4>
                    <div className="bg-gray-800/60 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white mb-2">Forward to Service Provider Dashboard</h5>
                          <p className="text-white/70 text-sm">
                            Send event planning request with all service details to Service Provider for approval
                          </p>
                          <div className="mt-2">
                            <span className="text-sm text-white/70">Status: </span>
                            <span className={`text-sm font-semibold ${
                              selectedViewApproval.serviceProviderStatus === 'approved' 
                                ? 'text-green-400' 
                                : selectedViewApproval.serviceProviderStatus === 'rejected'
                                ? 'text-red-400'
                                : selectedViewApproval.serviceProviderStatus === 'pending'
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                            }`}>
                              {selectedViewApproval.serviceProviderStatus === 'approved' ? 'Approved' : 
                               selectedViewApproval.serviceProviderStatus === 'rejected' ? 'Rejected' : 
                               selectedViewApproval.serviceProviderStatus === 'pending' ? 'Pending' :
                               'Not Started'}
                            </span>
                          </div>
                        </div>
                        {/* <button
                          onClick={handleForwardToServiceProvider}
                          disabled={selectedViewApproval.serviceProviderStatus === 'notified'}
                          className={`px-6 py-2 rounded font-semibold transition-colors ${
                            selectedViewApproval.serviceProviderStatus === 'notified'
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {selectedViewApproval.serviceProviderStatus === 'notified' ? 'Already Notified' : 'Notify Service Provider'}
                        </button> */}
                      </div>
                      
                      {/* Testing Section - Remove in production */}
                      {selectedViewApproval.serviceProviderStatus === 'notified' && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <h6 className="text-sm font-medium text-yellow-400 mb-2">🧪 Testing: Simulate Service Provider Response</h6>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => simulateServiceProviderResponse(selectedViewApproval.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Simulate Approve
                            </button>
                            <button
                              onClick={() => simulateServiceProviderResponse(selectedViewApproval.id, 'rejected')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Simulate Reject
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            This simulates what happens when Service Provider responds. Remove in production.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Super Admin Final Decision Section */}
                  {selectedViewApproval.type === 'event-plan' && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Super Admin Final Decision</h4>
                      <div className="bg-gray-800/60 rounded-lg p-4">
                        <div className="mb-4">
                          <h5 className="font-medium text-white mb-2">Review All Approvals</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${selectedViewApproval.authorityApprovals?.vc ? 'bg-green-900/60 text-green-200' : 'bg-gray-700/60 text-gray-300'}`}>
                              <span className={`w-2 h-2 rounded-full ${selectedViewApproval.authorityApprovals?.vc ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                              <span className="text-xs">VC</span>
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${selectedViewApproval.authorityApprovals?.warden ? 'bg-green-900/60 text-green-200' : 'bg-gray-700/60 text-gray-300'}`}>
                              <span className={`w-2 h-2 rounded-full ${selectedViewApproval.authorityApprovals?.warden ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                              <span className="text-xs">Warden</span>
                            </div>
                            <div className={`flex items-center space-x-1 px-3 py-1 rounded-lg ${selectedViewApproval.authorityApprovals?.administration ? 'bg-green-900/60 text-green-200' : 'bg-gray-700/60 text-gray-300'}`}>
                              <span className={`w-2 h-2 rounded-full ${selectedViewApproval.authorityApprovals?.administration ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                              <span className="text-xs">Admin</span>
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${selectedViewApproval.authorityApprovals?.student_union ? 'bg-green-900/60 text-green-200' : 'bg-gray-700/60 text-gray-300'}`}>
                              <span className={`w-2 h-2 rounded-full ${selectedViewApproval.authorityApprovals?.student_union ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                              <span className="text-xs">SU</span>
                            </div>
                          </div>
                          
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                            selectedViewApproval.serviceProviderStatus === 'approved' ? 'bg-green-900/60 text-green-200' :
                            selectedViewApproval.serviceProviderStatus === 'rejected' ? 'bg-red-900/60 text-red-200' :
                            selectedViewApproval.serviceProviderStatus === 'notified' ? 'bg-blue-900/60 text-blue-200' :
                            selectedViewApproval.serviceProviderStatus === 'pending' ? 'bg-yellow-900/60 text-yellow-200' :
                            'bg-gray-700/60 text-gray-300'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              selectedViewApproval.serviceProviderStatus === 'approved' ? 'bg-green-400' :
                              selectedViewApproval.serviceProviderStatus === 'rejected' ? 'bg-red-400' :
                              selectedViewApproval.serviceProviderStatus === 'notified' ? 'bg-blue-400' :
                              selectedViewApproval.serviceProviderStatus === 'pending' ? 'bg-yellow-400' :
                              'bg-gray-400'
                            }`}></span>
                            <span className="text-xs">Service Provider: {selectedViewApproval.serviceProviderStatus === 'approved' ? 'Approved' : 
                             selectedViewApproval.serviceProviderStatus === 'rejected' ? 'Rejected' : 
                             selectedViewApproval.serviceProviderStatus === 'notified' ? 'Notified' :
                             selectedViewApproval.serviceProviderStatus === 'pending' ? 'Pending' :
                             'Not Started'}</span>
                          </div>
                        </div>

                        {/* Authority Signed Letters Section */}
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <h6 className="text-sm font-medium text-blue-300 mb-3">📄 Authority Signed Letters</h6>
                          <p className="text-xs text-gray-400 mb-3">
                            View and download the signed letters uploaded by each authority
                          </p>
                          
                          {isLoadingAuthorityLetters ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                              <p className="text-white/50 text-sm">Loading authority letters...</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {/* VC Signed Letter */}
                              <div className="bg-gray-700/40 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-white">VC Approval</span>
                                  {(authorityLetters.find(letter => letter.role === 'vice-chancellor')?.signature_data || 
                                    authorityLetters.find(letter => letter.role === 'vice-chancellor')?.letter_content) && (
                                    <span className="text-xs text-green-400">✓ Available</span>
                                  )}
                                </div>
                                <div className="text-center">
                                  {(authorityLetters.find(letter => letter.role === 'vice-chancellor')?.signature_data || 
                                    authorityLetters.find(letter => letter.role === 'vice-chancellor')?.letter_content) ? (
                                    <div className="mb-2">
                                      <div className="text-xs text-gray-300 bg-gray-600/60 rounded px-2 py-1 mb-2">
                                        Vice Chancellor Approval
                                      </div>
                                      <button
                                        onClick={() => handleViewAuthorityLetter('vice-chancellor')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors w-full"
                                      >
                                        👁️ View Letter
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400">No letter uploaded</div>
                                  )}
                                </div>
                              </div>

                              {/* Warden Signed Letter */}
                              <div className="bg-gray-700/40 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-white">Warden Approval</span>
                                  {(authorityLetters.find(letter => letter.role === 'warden')?.signature_data || 
                                    authorityLetters.find(letter => letter.role === 'warden')?.letter_content) && (
                                    <span className="text-xs text-green-400">✓ Available</span>
                                  )}
                                </div>
                                <div className="text-center">
                                  {(authorityLetters.find(letter => letter.role === 'warden')?.signature_data || 
                                    authorityLetters.find(letter => letter.role === 'warden')?.letter_content) ? (
                                    <div className="mb-2">
                                      <div className="text-xs text-gray-300 bg-gray-600/60 rounded px-2 py-1 mb-2">
                                        Warden Approval
                                      </div>
                                      <button
                                        onClick={() => handleViewAuthorityLetter('warden')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors w-full"
                                      >
                                        👁️ View Letter
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400">No letter uploaded</div>
                                  )}
                                </div>
                              </div>

                              {/* Administration Signed Letter */}
                              <div className="bg-gray-700/40 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-white">Administration</span>
                                  {(authorityLetters.find(letter => letter.role === 'administration')?.signature_data || 
                                    authorityLetters.find(letter => letter.role === 'administration')?.letter_content) && (
                                    <span className="text-xs text-green-400">✓ Available</span>
                                  )}
                                </div>
                                <div className="text-center">
                                  {(authorityLetters.find(letter => letter.role === 'administration')?.signature_data || 
                                    authorityLetters.find(letter => letter.role === 'administration')?.letter_content) ? (
                                    <div className="mb-2">
                                      <div className="text-xs text-gray-300 bg-gray-600/60 rounded px-2 py-1 mb-2">
                                        Administration Approval
                                      </div>
                                      <button
                                        onClick={() => handleViewAuthorityLetter('administration')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors w-full"
                                      >
                                        👁️ View Letter
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400">No letter uploaded</div>
                                  )}
                                </div>
                              </div>

                              {/* Student Union Signed Letter */}
                              <div className="bg-gray-700/40 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-white">Student Union</span>
                                  {(authorityLetters.find(letter => letter.role === 'student-union')?.signature_data || 
                                    authorityLetters.find(letter => letter.role === 'student-union')?.letter_content) && (
                                    <span className="text-xs text-green-400">✓ Available</span>
                                  )}
                                </div>
                                <div className="text-center">
                                  {(authorityLetters.find(letter => letter.role === 'student-union')?.signature_data || 
                                    authorityLetters.find(letter => letter.role === 'student-union')?.letter_content) ? (
                                    <div className="mb-2">
                                      <div className="text-xs text-gray-300 bg-gray-600/60 rounded px-2 py-1 mb-2">
                                        Student Union Approval
                                      </div>
                                      <button
                                        onClick={() => handleViewAuthorityLetter('student-union')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors w-full"
                                      >
                                        👁️ View Letter
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400">No letter uploaded</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          

                        </div>
                        
                        {/* <div className="flex space-x-3">
                          <button
                            onClick={() => handleApproval(selectedViewApproval.id, 'approve')}
                            disabled={!selectedViewApproval.authorityApprovals?.vc || 
                                     !selectedViewApproval.authorityApprovals?.warden || 
                                     !selectedViewApproval.authorityApprovals?.administration || 
                                     !selectedViewApproval.authorityApprovals?.student_union ||
                                     selectedViewApproval.serviceProviderStatus !== 'approved'}
                            className={`px-6 py-2 rounded font-semibold transition-colors flex items-center ${
                              !selectedViewApproval.authorityApprovals?.vc || 
                              !selectedViewApproval.authorityApprovals?.warden || 
                              !selectedViewApproval.authorityApprovals?.administration || 
                              !selectedViewApproval.authorityApprovals?.student_union ||
                              selectedViewApproval.serviceProviderStatus !== 'approved'
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Final Approve Event
                          </button>
                          
                          <button
                            onClick={() => handleApproval(selectedViewApproval.id, 'reject')}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors flex items-center"
                          >
                            <X size={16} className="mr-2" />
                            Final Reject Event
                          </button>
                        </div> */}
                        
                      </div>
                    </div>
                  )}



                  {/* Send to User Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Final Action</h4>
                    <div className="bg-gray-800/60 rounded-lg p-4">
                      <div className="mb-4">
                        <h5 className="font-medium text-white mb-3">Upload Signed Letters</h5>
                        <p className="text-white/70 text-sm mb-4">
                          Upload all 4 signed letters to send them to {selectedViewApproval.requestedBy}
                        </p>
                        
                        {/* Signed Letters Upload Section */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {/* VC Letter Upload */}
                          <div className="bg-gray-700/40 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">VC Approval</span>
                              {isLetterUploaded('vc') && (
                                <span className="text-xs text-green-400">✓ Uploaded</span>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2">
                              {isLetterUploaded('vc') ? (
                                <div className="text-xs text-gray-300 bg-gray-600/60 rounded px-2 py-1">
                                  {getSignedLetterDisplayText('vc')}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">No file uploaded</div>
                              )}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUploadSignedLetter('vc')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  {isLetterUploaded('vc') ? 'Change File' : 'Upload File'}
                                </button>
                                {isLetterUploaded('vc') && (
                                  <button
                                    onClick={() => handleRemoveSignedLetter('vc')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Warden Letter Upload */}
                          <div className="bg-gray-700/40 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">Warden Approval</span>
                              {isLetterUploaded('warden') && (
                                <span className="text-xs text-green-400">✓ Uploaded</span>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2">
                              {isLetterUploaded('warden') ? (
                                <div className="text-xs text-gray-300 bg-gray-600/60 rounded px-2 py-1">
                                  {getSignedLetterDisplayText('warden')}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">No file uploaded</div>
                              )}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUploadSignedLetter('warden')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  {isLetterUploaded('warden') ? 'Change File' : 'Upload File'}
                                </button>
                                {isLetterUploaded('warden') && (
                                  <button
                                    onClick={() => handleRemoveSignedLetter('warden')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Service Provider Letter Upload */}
                          <div className="bg-gray-700/40 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">Student Union</span>
                              {isLetterUploaded('serviceProvider') && (
                                <span className="text-xs text-green-400">✓ Uploaded</span>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2">
                              {isLetterUploaded('serviceProvider') ? (
                                <div className="text-xs text-gray-300 bg-gray-600/60 rounded px-2 py-1">
                                  {getSignedLetterDisplayText('serviceProvider')}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">No file uploaded</div>
                              )}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUploadSignedLetter('serviceProvider')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  {isLetterUploaded('serviceProvider') ? 'Change File' : 'Upload File'}
                                </button>
                                {isLetterUploaded('serviceProvider') && (
                                  <button
                                    onClick={() => handleRemoveSignedLetter('serviceProvider')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Administration Letter Upload */}
                          <div className="bg-gray-700/40 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">University Administration</span>
                              {isLetterUploaded('administration') && (
                                <span className="text-xs text-green-400">✓ Uploaded</span>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2">
                              {isLetterUploaded('administration') ? (
                                <div className="text-xs text-gray-300 bg-gray-600/60 rounded px-2 py-1">
                                  {getSignedLetterDisplayText('administration')}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">No file uploaded</div>
                              )}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUploadSignedLetter('administration')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  {isLetterUploaded('administration') ? 'Change File' : 'Upload File'}
                                </button>
                                {isLetterUploaded('administration') && (
                                  <button
                                    onClick={() => handleRemoveSignedLetter('administration')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Upload Progress Indicator */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-white/70 mb-2">
                            <span>Upload Progress:</span>
                            <span>{[isLetterUploaded('vc'), isLetterUploaded('warden'), isLetterUploaded('serviceProvider'), isLetterUploaded('administration')].filter(Boolean).length}/4 letters uploaded</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${([isLetterUploaded('vc'), isLetterUploaded('warden'), isLetterUploaded('serviceProvider'), isLetterUploaded('administration')].filter(Boolean).length / 4) * 100}%` 
                              }}
                            ></div>
                          </div>
                          
                          {/* Status Summary */}
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className={`text-xs px-2 py-1 rounded ${
                              isLetterUploaded('vc')
                                ? 'bg-green-900/60 text-green-200' 
                                : 'bg-red-900/60 text-red-200'
                            }`}>
                              VC: {isLetterUploaded('vc') ? '✓ Ready' : '✗ Missing'}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              isLetterUploaded('warden')
                                ? 'bg-green-900/60 text-green-200' 
                                : 'bg-red-900/60 text-red-200'
                            }`}>
                              Warden: {isLetterUploaded('warden') ? '✓ Ready' : '✗ Missing'}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              isLetterUploaded('serviceProvider')
                                ? 'bg-green-900/60 text-green-200' 
                                : 'bg-red-900/60 text-red-200'
                            }`}>
                              Student Union: {isLetterUploaded('serviceProvider') ? '✓ Ready' : '✗ Missing'}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              isLetterUploaded('administration')
                                ? 'bg-green-900/60 text-green-200' 
                                : 'bg-red-900/60 text-red-200'
                            }`}>
                              University Administration: {isLetterUploaded('administration') ? '✓ Ready' : '✗ Missing'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Send Button Section */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                        <div>
                          <h5 className="font-medium text-white mb-2">Send All Signed Letters to User</h5>
                          <p className="text-white/70 text-sm">
                            All 4 signed letters must be uploaded before sending to {selectedViewApproval.requestedBy}
                          </p>
                        </div>
                        <button
                          onClick={handleSendToUser}
                          disabled={[isLetterUploaded('vc'), isLetterUploaded('warden'), isLetterUploaded('serviceProvider'), isLetterUploaded('administration')].filter(Boolean).length < 4}
                          className={`px-6 py-2 rounded font-semibold transition-colors flex items-center ${
                            [isLetterUploaded('vc'), isLetterUploaded('warden'), isLetterUploaded('serviceProvider'), isLetterUploaded('administration')].filter(Boolean).length < 4
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          📧 Send All Signed Letters to User
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Modal */}
            {showApproveModal && selectedApproveApproval && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-black bg-opacity-90 rounded-xl shadow-xl p-8 w-full max-w-lg relative">
                  <button
                    className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold"
                    onClick={() => {
                      setShowApproveModal(false);
                      setSelectedApproveApproval(null);
                      setApprovalComment('');
                      setApprovalEmail('');
                    }}
                  >
                    ×
                  </button>
                  
                  <h3 className="text-lg font-bold mb-4 text-white">
                    {selectedApproveApproval.type === 'event-plan' ? 'Approve Event Planning Request' : 'Approve Request'}
                  </h3>
                  
                  <div className="mb-4">
                    <span className="font-semibold text-white">Request Details:</span>
                    <div className="border border-gray-600 rounded-md mt-2 p-3 bg-gray-800/60 text-white">
                      <div className="mb-2">
                        <span className="font-medium">Title:</span> {selectedApproveApproval.title}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Requester:</span> {selectedApproveApproval.requester}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Venue:</span> {selectedApproveApproval.venue}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Date:</span> {selectedApproveApproval.date}
                      </div>
                      {selectedApproveApproval.type === 'event-plan' && selectedApproveApproval.approvalLetters && (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <span className="font-medium text-green-300">Approval Letters Submitted:</span>
                          <div className="mt-1 space-y-1">
                            {Object.entries(selectedApproveApproval.approvalLetters).map(([letterType, fileName]) => (
                              <div key={letterType} className="text-sm text-gray-300">
                                • {letterType === 'vc' ? 'Vice Chancellor' : 
                                   letterType === 'admin' ? 'University Administration' :
                                   letterType === 'warden' ? 'Warden' : 'Student Union'}: {fileName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block font-semibold mb-1 text-white">Email Notification:</label>
                    <input
                      type="email"
                      value={approvalEmail}
                      onChange={(e) => setApprovalEmail(e.target.value)}
                      className="w-full border border-gray-600 rounded-md p-2 bg-gray-800/60 text-white placeholder-gray-300"
                      placeholder="Email address for notification"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This email will receive the approval notification
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block font-semibold mb-1 text-white">Approval Comment (Optional):</label>
                    <textarea
                      className="w-full border border-gray-600 rounded-md p-3 bg-gray-800/60 text-white placeholder-gray-300"
                      rows={4}
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder={selectedApproveApproval.type === 'event-plan' 
                        ? "Add comments about services requested, approval letters, or any special instructions..." 
                        : "Add any additional comments or instructions..."}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedApproveApproval.type === 'event-plan' 
                        ? "This comment will be included in the email notification about your event planning approval"
                        : "This comment will be included in the email notification"}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowApproveModal(false);
                        setSelectedApproveApproval(null);
                        setApprovalComment('');
                        setApprovalEmail('');
                      }}
                      className="bg-gray-700/80 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApproveWithComment}
                      className="bg-green-700/80 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold transition-colors flex items-center"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Send Approval
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Modal */}
            {showRejectModal && selectedRejectionApproval && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-black bg-opacity-90 rounded-xl shadow-xl p-8 w-full max-w-lg relative">
                  <button
                    className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedRejectionApproval(null);
                      setRejectionComment('');
                      setRejectionEmail('');
                    }}
                  >
                    ×
                  </button>
                  
                  <h3 className="text-lg font-bold mb-4 text-white">Reject Request</h3>
                  
                  <div className="mb-4">
                    <span className="font-semibold text-white">Request Details:</span>
                    <div className="border border-gray-600 rounded-md mt-2 p-3 bg-gray-800/60 text-white">
                      <div className="mb-2">
                        <span className="font-medium">Title:</span> {selectedRejectionApproval.title}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Requester:</span> {selectedRejectionApproval.requester}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Venue:</span> {selectedRejectionApproval.venue}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {selectedRejectionApproval.date}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block font-semibold mb-1 text-white">Email Notification:</label>
                    <input
                      type="email"
                      value={rejectionEmail}
                      onChange={(e) => setRejectionEmail(e.target.value)}
                      className="w-full border border-gray-600 rounded-md p-2 bg-gray-800/60 text-white placeholder-gray-300"
                      placeholder="Email address for notification"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This email will receive the rejection notification
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block font-semibold mb-1 text-white">Rejection Comment <span className="text-red-500">*</span></label>
                    <textarea
                      className="w-full border border-gray-600 rounded-md p-3 bg-gray-800/60 text-white placeholder-gray-300"
                      rows={4}
                      value={rejectionComment}
                      onChange={(e) => setRejectionComment(e.target.value)}
                      placeholder="Please provide a detailed reason for rejection..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This comment will be included in the email notification
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowRejectModal(false);
                        setSelectedRejectionApproval(null);
                        setRejectionComment('');
                        setRejectionEmail('');
                      }}
                      className="bg-gray-700/80 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRejectWithComment}
                      className="bg-red-700/80 hover:bg-red-600 text-white px-6 py-2 rounded font-semibold transition-colors flex items-center"
                    >
                      <X size={16} className="mr-2" />
                      Send Rejection
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Simple PDF Viewer Modal - Same as VC Dashboard */}
            {showFilePreviewModal && selectedFilePreview && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
                <div className="bg-black rounded-lg shadow-xl p-6 w-full max-w-4xl h-full flex flex-col">
                  <button
                    className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold"
                    onClick={() => {
                      setShowFilePreviewModal(false);
                      setSelectedFilePreview(null);
                    }}
                  >
                    ×
                  </button>
                  <div className="flex-1 flex items-center justify-center">
                    {(() => {
                      console.log('🔍 PDF Viewer Modal - Authority Letter Data:', selectedFilePreview.authorityLetter);
                      console.log('📄 Signature Data:', selectedFilePreview.authorityLetter?.signature_data);
                      console.log('📄 Letter Content:', selectedFilePreview.authorityLetter?.letter_content);
                      
                                             if (selectedFilePreview.authorityLetter?.signature_data) {
                         console.log('✅ Using signature_data for PDF');
                         const pdfData = selectedFilePreview.authorityLetter.signature_data;
                         console.log('📄 PDF Data:', pdfData);
                         
                         // Handle signature_data as JSON object (like other dashboards)
                         let source: string | null = null;
                         if (typeof pdfData === 'string') {
                           source = pdfData;
                         } else if (pdfData && typeof pdfData === 'object') {
                           source = pdfData.dataUrl || pdfData.url || pdfData.content || null;
                         }
                         
                         if (source) {
                           // Sanitize the source
                           source = source.trim();
                           if ((source.startsWith('"') && source.endsWith('"')) || (source.startsWith("'") && source.endsWith("'"))) {
                             source = source.substring(1, source.length - 1);
                           }
                           if (source.startsWith('data%3A') || source.includes('%2F')) {
                             source = decodeURIComponent(source);
                           }
                           
                           return (
                             <iframe
                               src={source}
                               className="w-full h-full"
                               title="PDF Viewer"
                               onLoad={() => console.log('✅ PDF loaded successfully from signature_data')}
                               onError={(e) => {
                                 console.error('❌ PDF load error from signature_data:', e);
                                 toast.error('Failed to load PDF from signature data');
                               }}
                             />
                           );
                         } else {
                           console.log('❌ No valid source found in signature_data');
                           return (
                             <div className="text-center text-white">
                               <p className="text-lg mb-2">Invalid PDF format in signature data</p>
                               <p className="text-sm text-gray-400">The signature data does not contain valid PDF content</p>
                             </div>
                           );
                         }
                       } else if (selectedFilePreview.authorityLetter?.letter_content) {
                         console.log('✅ Using letter_content for PDF');
                         const pdfData = selectedFilePreview.authorityLetter.letter_content;
                         console.log('📄 PDF Data length:', pdfData ? pdfData.length : 0);
                         console.log('📄 PDF Data preview:', pdfData ? pdfData.substring(0, 100) + '...' : 'None');
                         
                         return (
                           <iframe
                             src={`data:application/pdf;base64,${pdfData}`}
                             className="w-full h-full"
                             title="PDF Viewer"
                             onLoad={() => console.log('✅ PDF loaded successfully from letter_content')}
                             onError={(e) => {
                               console.error('❌ PDF load error from letter_content:', e);
                               toast.error('Failed to load PDF from letter content');
                             }}
                           />
                         );
                       } else {
                        console.log('❌ No PDF content available');
                        return (
                          <div className="text-center text-white">
                            <p className="text-lg mb-2">No PDF content available</p>
                            <p className="text-sm text-gray-400">The authority letter does not contain PDF data</p>
                            <div className="mt-4 text-xs text-gray-500">
                              <p>Debug Info:</p>
                              <p>Signature Data: {selectedFilePreview.authorityLetter?.signature_data ? 'Present' : 'Missing'}</p>
                              <p>Letter Content: {selectedFilePreview.authorityLetter?.letter_content ? 'Present' : 'Missing'}</p>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}

      <NotificationPopup 
        isOpen={isNotificationPopupOpen} 
        onClose={() => setIsNotificationPopupOpen(false)} 
      />
    </Layout>
  );
};

export default AdminTools;
