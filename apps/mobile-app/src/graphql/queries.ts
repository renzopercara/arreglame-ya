
import { gql } from '@apollo/client';

// SERVICE CATEGORIES
export const GET_SERVICE_CATEGORIES = gql`
  query GetServiceCategories {
    serviceCategories {
      id
      slug
      name
      iconName
      description
      basePrice
      hourlyRate
      estimatedHours
      active
    }
  }
`;

// Query para detalle de servicio (usada por Codegen)
export const GET_SERVICE = gql`
  query GetService($id: String!) {
    getService(id: $id) {
      id
      status
      description
      squareMeters
      latitude
      longitude
      address
      gardenImageBefore
      gardenImageAfter
      price
      client {
        id
        name
      }
      worker {
        id
        name
      }
      createdAt
      completedAt
    }
  }
`;

// ... (Queries anteriores)

// AUTH & USER
export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      role
      roles
      currentRole
      activeRole
      status
      avatar
      rating
      loyaltyPoints
      balance
      totalJobs
      workerStatus
      kycStatus
      bio
      currentPlan
      mercadopagoCustomerId
      mercadopagoAccessToken
      mustAcceptTerms
      isEmailVerified
      isKycVerified
    }
  }
`;

// KYC
export const SUBMIT_KYC = gql`
  mutation SubmitKYC($input: SubmitKYCInput!) {
    submitKYC(input: $input) {
      id
      kycStatus
    }
  }
`;

export const GET_PUBLIC_WORKER_PROFILE = gql`
  query GetPublicWorkerProfile($workerId: String!) {
    getPublicWorkerProfile(workerId: $workerId) {
      id
      name
      rating
      totalJobs
      currentPlan
      bio
      status
    }
  }
`;

// Existing...
export const GET_JOB_HISTORY = gql`
  query GetJobHistory($jobId: String!) {
    getJobHistory(jobId: $jobId) {
      id
      status
      completedAt
      warrantyExpiresAt
      price
      gardenImageBefore
      gardenImageAfter
      evidenceImages
      description
      myReview {
        id
        rating
        comment
      }
      activeTicket {
        id
        status
        description
      }
    }
  }
`;

export const GET_MY_JOBS = gql`
  query GetMyJobs($role: String!) {
    getMyJobs(role: $role) {
      id
      status
      completedAt
      price
      description
      location {
          address
      }
    }
  }
`;

export const SUBMIT_REVIEW = gql`
  mutation SubmitReview($jobId: String!, $rating: Int!, $comment: String) {
    submitReview(input: { jobId: $jobId, rating: $rating, comment: $comment }) {
      id
      rating
    }
  }
`;

export const CREATE_TICKET = gql`
  mutation CreateSupportTicket($jobId: String!, $category: String!, $subject: String!, $description: String!) {
    createSupportTicket(input: { jobId: $jobId, category: $category, subject: $subject, description: $description }) {
      id
      status
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!, $role: String!) {
    login(input: { email: $email, password: $password, role: $role }) {
      accessToken
      user {
        id
        name
        email
        role
        roles
        currentRole
        activeRole
        status
        avatar
        rating
        loyaltyPoints
        balance
        totalJobs
        workerStatus
        kycStatus
        bio
        currentPlan
        mercadopagoCustomerId
        mercadopagoAccessToken
        mustAcceptTerms
        isEmailVerified
        isKycVerified
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register(
    $email: String!, 
    $password: String!, 
    $name: String!, 
    $role: String!,
    $termsAccepted: Boolean,
    $termsVersion: String,
    $termsDate: String,
    $userAgent: String
  ) {
    register(input: {
        email: $email, 
        password: $password, 
        name: $name, 
        role: $role,
        termsAccepted: $termsAccepted,
        termsVersion: $termsVersion,
        termsDate: $termsDate,
        userAgent: $userAgent
    }) {
      accessToken
      user {
        id
        name
        email
        role
        roles
        currentRole
        activeRole
        status
        avatar
        rating
        loyaltyPoints
        balance
        totalJobs
        workerStatus
        kycStatus
        bio
        currentPlan
        mercadopagoCustomerId
        mercadopagoAccessToken
        mustAcceptTerms
        isEmailVerified
        isKycVerified
      }
    }
  }
`;

export const SWITCH_ACTIVE_ROLE = gql`
  mutation SwitchActiveRole($activeRole: String!) {
    switchActiveRole(activeRole: $activeRole) {
      id
      activeRole
      name
      role
      roles
      currentRole
    }
  }
`;

export const ACCEPT_LATEST_TERMS = gql`
  mutation AcceptLatestTerms($userId: String!, $documentId: String!) {
    acceptLatestTerms(userId: $userId, documentId: $documentId)
  }
`;

export const BECOME_WORKER = gql`
  mutation BecomeWorker($input: BecomeWorkerInput!) {
    becomeWorker(input: $input) {
      id
      name
      email
      role
      roles
      currentRole
      activeRole
      status
      avatar
      rating
      loyaltyPoints
      balance
      totalJobs
      workerStatus
      kycStatus
      bio
      currentPlan
      mercadopagoCustomerId
      mercadopagoAccessToken
      mustAcceptTerms
      isEmailVerified
      isKycVerified
    }
  }
`;

export const CREATE_PAYMENT_PREFERENCE = gql`
  mutation CreatePaymentPreference($serviceRequestId: String!) {
    createPaymentPreference(serviceRequestId: $serviceRequestId) {
      preferenceId
      initPoint
    }
  }
`;

export const GET_LATEST_TERMS = gql`
  query LatestTerms($role: String!) {
    latestTerms(role: $role) {
      id
      version
      content
    }
  }
`;

export const ESTIMATE_SERVICE = gql`
  query EstimateJob(
    $image: String!, 
    $description: String!, 
    $squareMeters: Float!,
    $hasHighWeeds: Boolean,
    $hasSlope: Boolean,
    $complicatedAccess: Boolean
  ) {
    estimateJob(input: {
        image: $image, 
        description: $description,
        squareMeters: $squareMeters,
        hasHighWeeds: $hasHighWeeds,
        hasSlope: $hasSlope,
        complicatedAccess: $complicatedAccess
    }) {
      difficultyMultiplier
      estimatedHours
      obstacles
      reasoning
      price {
          total
          workerNet
          platformFee
          taxes
          currency
          calculationSnapshot
      }
      aiAnalysis
    }
  }
`;

export const CREATE_REQUEST = gql`
  mutation CreateJob(
    $clientId: String!, 
    $lat: Float!, 
    $lng: Float!, 
    $image: String!, 
    $description: String!, 
    $difficulty: Float!, 
    $estimatedHours: Float!,
    $squareMeters: Float!,
    $hasHighWeeds: Boolean
  ) {
    createJob(input: {
      clientId: $clientId, 
      lat: $lat, 
      lng: $lng, 
      image: $image, 
      description: $description, 
      difficulty: $difficulty, 
      estimatedHours: $estimatedHours,
      squareMeters: $squareMeters,
      hasHighWeeds: $hasHighWeeds
    }) {
      id
      status
      pin
      price
    }
  }
`;

export const NEARBY_REQUESTS = gql`
  query NearbyJobs($lat: Float!, $lng: Float!, $radius: Float) {
    nearbyJobs(lat: $lat, lng: $lng, radius: $radius) {
      id
      status
      estimatedHours
      latitude
      longitude
      description
    }
  }
`;

export const ACCEPT_REQUEST = gql`
  mutation AcceptJob($workerId: String!, $jobId: String!) {
    acceptJob(workerId: $workerId, jobId: $jobId) {
      id
      status
    }
  }
`;

export const ARRIVE_AT_LOCATION = gql`
  mutation ArriveAtJob($workerId: String!, $jobId: String!, $lat: Float!, $lng: Float!) {
    arriveAtJob(workerId: $workerId, jobId: $jobId, lat: $lat, lng: $lng)
  }
`;

export const START_JOB = gql`
  mutation StartJob($jobId: String!, $pin: String!) {
    startJob(jobId: $jobId, pin: $pin) {
        id
        status
    }
  }
`;

export const REQUEST_EXTRA_TIME = gql`
  mutation RequestExtraTime($jobId: String!, $minutes: Int!, $reason: String!) {
    requestExtraTime(jobId: $jobId, minutes: $minutes, reason: $reason) {
        id
        extraTimeStatus
    }
  }
`;

export const RESPOND_TO_EXTRA_TIME = gql`
  mutation RespondToExtraTime($jobId: String!, $approved: Boolean!) {
    respondToExtraTime(jobId: $jobId, approved: $approved) {
        id
        extraTimeStatus
        totalPrice
    }
  }
`;

export const COMPLETE_JOB = gql`
  mutation CompleteJob($jobId: String!, $imageAfter: String!, $evidenceImages: [String!]) {
    completeJob(jobId: $jobId, imageAfter: $imageAfter, evidenceImages: $evidenceImages) {
      approved
      confidence
      feedback
    }
  }
`;

export const UPDATE_WORKER_LOCATION = gql`
  mutation UpdateWorkerLocation($lat: Float!, $lng: Float!) {
    updateWorkerLocation(lat: $lat, lng: $lng)
  }
`;

export const SET_WORKER_STATUS = gql`
  mutation SetWorkerStatus($status: String!) {
    setWorkerStatus(status: $status) {
      id
      status
    }
  }
`;

export const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($jobId: String!) {
    chatMessages(jobId: $jobId) {
      id
      senderId
      senderRole
      content
      timestamp
    }
  }
`;

export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($jobId: String!, $senderId: String!, $role: String!, $content: String!) {
    sendMessage(jobId: $jobId, senderId: $senderId, role: $role, content: $content) {
      id
      content
      timestamp
    }
  }
`;

export const JOB_UPDATES_SUBSCRIPTION = gql`
  subscription OnJobUpdated($jobId: String!) {
    jobUpdated(jobId: $jobId) {
      id
      status
      workerId
      pin
      gardenImageAfter
      extraTimeStatus
      extraTimeMinutes
      extraTimeReason
      price
    }
  }
`;

export const WORKER_LOCATION_SUBSCRIPTION = gql`
  subscription OnWorkerLocationMoved($jobId: String!) {
    workerLocationMoved(jobId: $jobId) {
      lat
      lng
    }
  }
`;

export const CHAT_SUBSCRIPTION = gql`
  subscription OnChatMessageAdded($jobId: String!) {
    chatMessageAdded(jobId: $jobId) {
      id
      senderId
      senderRole
      content
      timestamp
    }
  }
`;

// ============================================
// NOTIFICATIONS
// ============================================

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($limit: Int) {
    getNotifications(limit: $limit) {
      id
      title
      message
      type
      read
      data
      createdAt
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadCount {
    getUnreadCount {
      count
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationId: String!) {
    markNotificationAsRead(notificationId: $notificationId) {
      id
      read
    }
  }
`;

export const MARK_ALL_AS_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead {
      success
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($notificationId: String!) {
    deleteNotification(notificationId: $notificationId) {
      success
    }
  }
`;

// ============================================
// WORKER SPECIALTIES
// ============================================

export const ADD_WORKER_SPECIALTY = gql`
  mutation AddWorkerSpecialty($input: CreateWorkerSpecialtyInput!) {
    addWorkerSpecialty(input: $input) {
      id
      workerId
      categoryId
      status
      experienceYears
      metadata
      createdAt
      updatedAt
      category {
        id
        slug
        name
        iconName
        description
      }
    }
  }
`;

export const ADD_MULTIPLE_WORKER_SPECIALTIES = gql`
  mutation AddMultipleWorkerSpecialties($input: AddMultipleSpecialtiesInput!) {
    addMultipleWorkerSpecialties(input: $input) {
      success
      specialty {
        id
        categoryId
        status
        experienceYears
      }
      categoryId
      error
    }
  }
`;

export const UPDATE_WORKER_SPECIALTY = gql`
  mutation UpdateWorkerSpecialty($input: UpdateWorkerSpecialtyInput!) {
    updateWorkerSpecialty(input: $input) {
      id
      workerId
      categoryId
      status
      experienceYears
      metadata
      updatedAt
      category {
        id
        name
      }
    }
  }
`;

export const REMOVE_WORKER_SPECIALTY = gql`
  mutation RemoveWorkerSpecialty($specialtyId: String!) {
    removeWorkerSpecialty(specialtyId: $specialtyId) {
      success
      message
    }
  }
`;

export const SYNC_PROFESSIONAL_SERVICES = gql`
  mutation SyncProfessionalServices($input: SyncProfessionalServicesInput!) {
    syncProfessionalServices(input: $input) {
      id
      name
      slug
      description
      iconName
      isActive
      experienceYears
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_WORKER_SPECIALTIES = gql`
  query GetMyWorkerSpecialties($includeInactive: Boolean) {
    getMyWorkerSpecialties(includeInactive: $includeInactive) {
      id
      workerId
      categoryId
      status
      experienceYears
      metadata
      createdAt
      updatedAt
      category {
        id
        slug
        name
        iconName
        description
        basePrice
        hourlyRate
      }
    }
  }
`;

export const GET_WORKER_SPECIALTY_BY_ID = gql`
  query GetWorkerSpecialtyById($specialtyId: String!) {
    getWorkerSpecialtyById(specialtyId: $specialtyId) {
      id
      workerId
      categoryId
      status
      experienceYears
      metadata
      createdAt
      updatedAt
      category {
        id
        slug
        name
        iconName
        description
        basePrice
        hourlyRate
      }
    }
  }
`;

export const GET_MY_SERVICES = gql`
  query GetMyServices {
    getMyServices {
      id
      name
      slug
      description
      iconName
      isActive
      experienceYears
      createdAt
      updatedAt
    }
  }
`;

// REAL-TIME NOTIFICATIONS (GraphQL Subscriptions)
export const REGISTER_DEVICE_TOKEN = gql`
  mutation RegisterDeviceToken($token: String!, $platform: String) {
    registerDeviceToken(token: $token, platform: $platform)
  }
`;

export const NOTIFICATION_SUBSCRIPTION = gql`
  subscription OnNotificationReceived {
    notificationReceived {
      id
      userId
      title
      message
      type
      data
      createdAt
    }
  }
`;

// PRO DASHBOARD
export const GET_PRO_DASHBOARD = gql`
  query GetProDashboard {
    me {
      id
      name
      email
      rating
      totalJobs
      balance
      workerStatus
      currentPlan
    }
  }
`;

export const UPDATE_WORKER_STATUS = gql`
  mutation UpdateWorkerStatus($status: String!) {
    updateWorkerStatus(status: $status) {
      id
      workerStatus
    }
  }
`;
