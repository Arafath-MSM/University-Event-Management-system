import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import apiService from "../../services/api";
import { toast } from "sonner";
import Layout from "../../components/Layout";
import { Calendar, Clock, Users, FileText } from "lucide-react";

interface EventPlan {
  id: number;
  title: string;
  type: string;
  organizer: string;
  date: string;
  time: string;
  participants: number;
  status: string;
  current_stage: number;
  facilities: any;
  documents: any;
  approval_documents?: {
    vc_approval?: string;
    administration_approval?: string;
    warden_approval?: string;
    student_union_approval?: string;
  };
  remarks: string;
  user_name: string;
  user_email: string;
  created_at: string;
  updated_at: string;
}

interface SignedLetter {
  id: number;
  booking_id: number;
  event_plan_id?: number;
  from_role: string;
  to_role: string;
  letter_type: string;
  letter_content: string;
  signature_data: any;
  status: string;
  sent_at: string;
  received_at: string;
  event_title: string;
  user_name: string;
  created_at: string;
  updated_at: string;
}

const UniversityAdministrationDashboard: React.FC = () => {
  const [requests, setRequests] = useState<EventPlan[]>([]);
  const [signedLetters, setSignedLetters] = useState<SignedLetter[]>([]);
  const [approvedEventPlans, setApprovedEventPlans] = useState<EventPlan[]>([]);
  const [rejectedEventPlans, setRejectedEventPlans] = useState<EventPlan[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EventPlan | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comment, setComment] = useState("");
  const [rejectionComment, setRejectionComment] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingApprovalDocs, setLoadingApprovalDocs] = useState<number[]>([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [uploadedSignedDocs, setUploadedSignedDocs] = useState<{[key: number]: string}>({});
  const { user } = useAuth();

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Load approval documents for a specific event plan
  const loadApprovalDocuments = async (eventPlanId: number) => {
    try {
      setLoadingApprovalDocs(prev => [...prev, eventPlanId]);
      const response = await apiService.getEventPlanApprovalDocuments(eventPlanId);
      
      if (response.success) {
        setRequests(prev => prev.map(plan => 
          plan.id === eventPlanId 
            ? { ...plan, approval_documents: response.data }
            : plan
        ));
      }
    } catch (error) {
      console.error('Error loading approval documents:', error);
    } finally {
      setLoadingApprovalDocs(prev => prev.filter(id => id !== eventPlanId));
    }
  };

  const handleViewPdf = (pdfData: string) => {
    if (!pdfData) {
      toast.error('No PDF data available');
      return;
    }
    try {
      if (pdfData.startsWith('data:application/pdf;base64,')) {
        const base64 = pdfData.split(',')[1];
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setSelectedPdfUrl(url);
        setShowPdfModal(true);
        return;
      }
      if (pdfData.startsWith('data:application/octet-stream;base64,')) {
        const base64 = pdfData.split(',')[1];
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setSelectedPdfUrl(url);
        setShowPdfModal(true);
        return;
      }
      toast.error('Invalid PDF format');
    } catch (error) {
      toast.error('Failed to load PDF document');
    }
  };

  const handleDownloadPdf = (pdfData: string, filename: string) => {
    const link = document.createElement('a');
    link.href = pdfData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadSignedDocument = (requestId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const fileData = ev.target?.result as string;
          setUploadedSignedDocs(prev => ({
            ...prev,
            [requestId]: fileData
          }));
          toast.success(`Signed document uploaded for request ${requestId}`);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all submitted event plans
      const eventPlansResponse = await apiService.getEventPlans({
        status: 'submitted'
      });
      
      // Fetch signed letters by administration to check which event plans have been approved
      const signedLettersResponse = await apiService.getSignedLetters({
        from_role: 'administration'
      });
      
      if (eventPlansResponse.success) {
        let allEventPlans = eventPlansResponse.data || [];
        
        // Get event plan IDs that the Administration has already approved
        let approvedEventPlanIds: number[] = [];
        if (signedLettersResponse.success && signedLettersResponse.data) {
          approvedEventPlanIds = signedLettersResponse.data
            .filter((letter: any) => letter.letter_type === 'approval' && letter.event_plan_id)
            .map((letter: any) => parseInt(letter.event_plan_id));
        }
        
        // Filter out event plans that the Administration has already approved
        const pendingEventPlans = allEventPlans.filter((eventPlan: any) => 
          !approvedEventPlanIds.includes(eventPlan.id)
        );
        
        setRequests(pendingEventPlans);
        pendingEventPlans.forEach((eventPlan: any) => loadApprovalDocuments(eventPlan.id));
      }

      // Fetch approved event plans
      const approvedEventPlansResponse = await apiService.getEventPlans({
        status: 'approved'
      });
      
      if (approvedEventPlansResponse.success) {
        setApprovedEventPlans(approvedEventPlansResponse.data || []);
      }

      // Fetch rejected event plans
      const rejectedEventPlansResponse = await apiService.getEventPlans({
        status: 'rejected'
      });
      
      if (rejectedEventPlansResponse.success) {
        setRejectedEventPlans(rejectedEventPlansResponse.data || []);
      }

      // Set signed letters for the signed letters section
      if (signedLettersResponse.success) {
        setSignedLetters(signedLettersResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Statistics
  const stats = {
    pending: requests.length,
    approved: signedLetters.filter((l) => l.letter_type === "approval" && l.status === "sent").length,
    rejected: rejectedEventPlans.length,
  };

  // Handle Approve
  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsLoading(true);

    try {
      // Get the uploaded signed document for this request (optional)
      const uploadedDocument = uploadedSignedDocs[selectedRequest.id];
      
      const response = await apiService.approveEventPlanAsAdministration(
        selectedRequest.id,
        {
          comment: comment,
          signature_data: uploadedDocument || null
        }
      );

      if (response.success) {
        toast.success("Event plan approved and signed letter sent to Super-Admin.");
        
        // Refresh data
        await fetchData();
        
        // Close modal
        setShowApproveModal(false);
        setSelectedRequest(null);
        setComment("");
        setSignature(null);
        
        // Remove the uploaded document from state since it's been sent
        if (uploadedDocument) {
          setUploadedSignedDocs(prev => {
            const newState = { ...prev };
            delete newState[selectedRequest.id];
            return newState;
          });
        }
      } else {
        toast.error(response.message || "Failed to approve event plan.");
      }
    } catch (error) {
      console.error("Error approving event plan:", error);
      toast.error("Failed to approve event plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!selectedRequest) return;

    setIsLoading(true);

    try {
      const response = await apiService.rejectEventPlanAsAdministration(
        selectedRequest.id,
        {
          comment: rejectionComment
        }
      );

      if (response.success) {
        toast.success("Event plan rejected successfully.");
        
        // Refresh data
        await fetchData();
        
        // Close modal
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectionComment("");
      } else {
        toast.error(response.message || "Failed to reject event plan.");
      }
    } catch (error) {
      console.error("Error rejecting event plan:", error);
      toast.error("Failed to reject event plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signature upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSignature(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <Layout>
      <div className="relative min-h-screen w-full flex flex-col justify-center items-stretch" style={{ backgroundColor: '#bd7880' }}>
          <div className="relative z-10 space-y-8 animate-fade-in px-2 md:px-0 pt-0 pb-8">
            {/* Welcome Section at the very top */}
            <div className="w-full flex justify-center">
              <div className="bg-black bg-opacity-40 text-white rounded-xl py-12 px-8 shadow-none w-full max-w-5xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-extrabold mb-2">
                      Welcome, {user?.name}!
                    </h1>
                    <p className="text-white text-lg font-semibold">
                      Ready to manage university events and approvals?
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-black bg-opacity-60 rounded-lg p-4 flex items-center justify-center">
                      <Calendar size={48} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Container for stats and tables */}
            <div className="w-full max-w-5xl mx-auto px-4 md:px-8 space-y-8 bg-black bg-opacity-30 rounded-2xl shadow-lg">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                <div className="bg-black bg-opacity-40 rounded-xl shadow-none p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Pending Requests</p>
                      <p className="text-2xl font-bold text-white">{stats.pending}</p>
                    </div>
                    <div className="bg-yellow-900 bg-opacity-60 p-3 rounded-full">
                      <Clock size={20} className="text-yellow-200" />
                    </div>
                  </div>
                </div>
                <div className="bg-black bg-opacity-40 rounded-xl shadow-none p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Approved Events</p>
                      <p className="text-2xl font-bold text-white">{stats.approved}</p>
                    </div>
                    <div className="bg-green-900 bg-opacity-60 p-3 rounded-full">
                      <Users size={20} className="text-green-200" />
                    </div>
                  </div>
                </div>
                <div className="bg-black bg-opacity-40 rounded-xl shadow-none p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Rejected Events</p>
                      <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                    </div>
                    <div className="bg-red-900 bg-opacity-60 p-3 rounded-full">
                      <FileText size={20} className="text-red-200" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 gap-8">
                {/* Pending Requests + Approved Events (stacked) */}
                <div className="space-y-8">
                  {/* Pending Requests */}
                  <div className="bg-black bg-opacity-40 rounded-xl shadow-none p-6 w-full max-w-none">
                    <h2 className="text-xl font-bold text-white">Pending Approval Requests</h2>
                    <div>
                      <table className="w-full bg-transparent rounded-xl border border-gray-700 shadow-none">
                        <thead>
                          <tr className="bg-gray-800 text-white">
                            <th className="py-2 px-4">Request ID</th>
                            <th className="py-2 px-4">Event Title</th>
                            <th className="py-2 px-4">Requested By</th>
                            <th className="py-2 px-4">Date & Time</th>
                            <th className="py-2 px-4">Venue</th>
                            <th className="py-2 px-4">Document</th>
                            <th className="py-2 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requests.map((req) => (
                            <tr key={req.id} className="border-b border-gray-700 last:border-none">
                              <td className="py-2 px-4 text-white">{req.id}</td>
                              <td className="py-2 px-4 text-white">{req.title}</td>
                              <td className="py-2 px-4 text-white">{req.organizer}</td>
                              <td className="py-2 px-4 text-white">{req.date} {req.time}</td>
                              <td className="py-2 px-4 text-white">{req.facilities?.venue}</td>
                              <td className="py-2 px-4">
                                <div className="flex flex-col gap-1 items-start">
                                  {/* Show uploaded approval documents */}
                                  {req.approval_documents ? (
                                    <div className="space-y-1">
                                      {req.approval_documents.administration_approval && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-green-400 text-xs">Approval Letter</span>
                                          <button
                                            onClick={() => handleViewPdf(req.approval_documents.administration_approval)}
                                            className="text-blue-300 hover:text-blue-200 text-xs underline"
                                          >
                                            View
                                          </button>
                                        </div>
                                      )}
                                      {!req.approval_documents.administration_approval && (
                                        <span className="text-gray-400 text-xs">No Admin approval letter uploaded</span>
                                      )}
                                    </div>
                                  ) : loadingApprovalDocs.includes(req.id) ? (
                                    <div className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      <span className="text-gray-400 text-xs">Loading...</span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => loadApprovalDocuments(req.id)}
                                      className="text-blue-300 hover:text-blue-200 text-xs underline"
                                    >
                                      Load Documents
                                    </button>
                                  )}
                                  
                                  {/* Upload Admin signed document */}
                                  <div className="space-y-1">
                                    <button
                                      className="text-green-300 underline text-sm hover:text-green-200 text-left bg-transparent border-none p-0 cursor-pointer"
                                      onClick={() => handleUploadSignedDocument(req.id)}
                                    >
                                      Upload Signed Document
                                    </button>
                                    {uploadedSignedDocs[req.id] && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-green-400 text-xs">Signed Document</span>
                                        <button
                                          onClick={() => handleViewPdf(uploadedSignedDocs[req.id])}
                                          className="text-blue-300 hover:text-blue-200 text-xs underline"
                                        >
                                          View
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-4 flex gap-2">
                                <button
                                  className="bg-green-900 bg-opacity-60 hover:bg-green-800 text-white px-3 py-1 rounded transition-colors"
                                  onClick={() => { setSelectedRequest(req); setShowApproveModal(true); }}
                                >Approve</button>
                                <button
                                  className="bg-red-900 bg-opacity-60 hover:bg-red-800 text-white px-3 py-1 rounded transition-colors"
                                  onClick={() => { setSelectedRequest(req); setShowRejectModal(true); }}
                                >Reject</button>
                              </td>
                            </tr>
                          ))}
                          {requests.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-gray-400">
                                No pending requests.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Signed Letters */}
                  <div className="bg-black bg-opacity-40 rounded-xl shadow-none p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Signed Letters</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-transparent rounded-xl border border-gray-700 shadow-none">
                        <thead>
                          <tr className="bg-gray-800/70 text-white">
                            <th className="py-2 px-4">Date</th>
                            <th className="py-2 px-4">Event</th>
                            <th className="py-2 px-4">Document</th>
                            <th className="py-2 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {signedLetters.map((letter) => (
                            <tr key={letter.id}>
                              <td className="py-2 px-4 text-white">{letter.sent_at}</td>
                              <td className="py-2 px-4 text-white">{letter.event_title}</td>
                              <td className="py-2 px-4">
                                <div className="flex flex-col gap-1 items-start">
                                  {(letter.signature_data || letter.letter_content) && (String(letter.signature_data || letter.letter_content).trim() !== '') ? (
                                    <button
                                      onClick={() => handleViewPdf(letter.signature_data || letter.letter_content)}
                                      className="text-blue-300 underline text-sm hover:text-blue-200 bg-transparent border-none p-0 cursor-pointer"
                                    >
                                      View PDF
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 text-sm">No document uploaded</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    letter.status === "sent"
                                      ? "bg-green-900 bg-opacity-60 text-green-200"
                                      : "bg-yellow-900 bg-opacity-60 text-yellow-200"
                                  }`}
                                >
                                  {letter.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {signedLetters.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-6 text-gray-400">
                                No signed letters yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-black bg-opacity-90 rounded-xl shadow-xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold"
              onClick={() => setShowApproveModal(false)}
            >×</button>
            <h3 className="text-lg font-bold mb-4 text-white">Approve Request</h3>
            <div className="mb-4">
              <span className="font-semibold text-white">Event:</span>
              <div className="border border-gray-600 rounded-md mt-2 p-2 bg-gray-800/60 text-white text-center text-lg">
                {selectedRequest.title}
              </div>
              <div className="flex flex-col gap-1 mt-2">
                {selectedRequest.approval_documents && (
                  <div className="space-y-2">
                    <span className="text-white text-sm font-medium">Uploaded Approval Document:</span>
                    {selectedRequest.approval_documents.administration_approval && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-xs">✓ Administration Approval Letter</span>
                        <button
                          onClick={() => handleViewPdf(selectedRequest.approval_documents.administration_approval)}
                          className="text-blue-300 hover:text-blue-200 text-xs underline"
                        >
                          View
                        </button>
                      </div>
                    )}
                    {!selectedRequest.approval_documents.administration_approval && (
                      <span className="text-gray-400 text-xs">No Administration approval letter uploaded</span>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <span className="text-white text-sm font-medium">Signed Document :</span>
                  <button
                    className="text-green-300 underline text-sm hover:text-green-200 bg-transparent border-none p-0 cursor-pointer text-center w-fit mx-auto"
                    onClick={() => {
                      // Handle upload functionality
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.doc,.docx';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const fileData = ev.target?.result as string;
                            setUploadedSignedDocs(prev => ({
                              ...prev,
                              [selectedRequest.id]: fileData
                            }));
                            toast.success(`Signed document uploaded for request ${selectedRequest.id}`);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    Upload Signed Document
                  </button>
                  {uploadedSignedDocs[selectedRequest.id] && (
                    <button
                      onClick={() => handleViewPdf(uploadedSignedDocs[selectedRequest.id])}
                      className="text-blue-300 underline text-sm hover:text-blue-200 bg-transparent border-none p-0 cursor-pointer text-center w-fit mx-auto"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1 text-white">Comment (optional):</label>
              <textarea
                className="w-full border border-gray-600 rounded-md p-2 bg-gray-800/60 text-white placeholder-gray-300"
                rows={2}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment (optional)"
              />
            </div>
            <button
              className="bg-gray-700/80 hover:bg-gray-600 text-white px-6 py-2 rounded font-semibold w-full mt-6 transition-colors"
              onClick={handleApprove}
            >
              Approve & Send to Super-Admin
            </button>
          </div>
        </div>
      )}
      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-black bg-opacity-90 rounded-xl shadow-xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold"
              onClick={() => setShowRejectModal(false)}
            >×</button>
            <h3 className="text-lg font-bold mb-4 text-white">Reject Request</h3>
            <div className="mb-4">
              <label className="block font-semibold mb-1 text-white">Rejection Comment <span className="text-red-500">*</span></label>
              <textarea
                className="w-full border border-gray-600 rounded-md p-2 bg-gray-800/60 text-white placeholder-gray-300"
                rows={3}
                value={rejectionComment}
                onChange={e => { setRejectionComment(e.target.value); }}
                placeholder="Please provide a reason for rejection"
              />
            </div>
            <button
              className="bg-gray-700/80 hover:bg-gray-600 text-white px-6 py-2 rounded font-semibold w-full transition-colors"
              onClick={handleReject}
            >
              Reject
            </button>
          </div>
        </div>
      )}
      {/* PDF Viewer Modal */}
      {showPdfModal && selectedPdfUrl && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="bg-black rounded-lg shadow-xl p-6 w-full max-w-4xl h-full flex flex-col">
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold"
              onClick={() => setShowPdfModal(false)}
            >
              ×
            </button>
            <div className="flex-1 flex items-center justify-center">
              <iframe
                src={selectedPdfUrl}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityAdministrationDashboard;
