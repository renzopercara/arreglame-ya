
import { gql } from '@apollo/client';

// --- AUTH ---

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!, $role: String!) {
    login(email: $email, password: $password, role: $role) {
      accessToken
      user {
        id
        name
        role
        status
        mustAcceptTerms
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
    register(
        email: $email, 
        password: $password, 
        name: $name, 
        role: $role,
        termsAccepted: $termsAccepted,
        termsVersion: $termsVersion,
        termsDate: $termsDate,
        userAgent: $userAgent
    ) {
      accessToken
      user {
        id
        name
        role
        mustAcceptTerms
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      role
      status
      mustAcceptTerms
      loyaltyPoints
      rating
      balance
      totalJobs
      workerStatus
      currentPlan
    }
  }
`;

export const ACCEPT_LATEST_TERMS = gql`
  mutation AcceptLatestTerms($userId: String!, $documentId: String!) {
    acceptLatestTerms(userId: $userId, documentId: $documentId)
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

// --- JOBS ---

export const ESTIMATE_SERVICE = gql`
  query EstimateJob(
    $image: String!, 
    $description: String!, 
    $squareMeters: Float!,
    $hasHighWeeds: Boolean,
    $hasSlope: Boolean,
    $complicatedAccess: Boolean
  ) {
    estimateJob(
        image: $image, 
        description: $description,
        squareMeters: $squareMeters,
        hasHighWeeds: $hasHighWeeds,
        hasSlope: $hasSlope,
        complicatedAccess: $complicatedAccess
    ) {
      difficultyMultiplier
      estimatedHours
      obstacles
      reasoning
      price {
          total
          workerNet
          platformFee
          taxes
          calculationSnapshot {
              appliedSurcharges
          }
      }
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
    $scheduledFor: String,
    $squareMeters: Float!,
    $hasHighWeeds: Boolean
  ) {
    createJob(
      clientId: $clientId, 
      lat: $lat, 
      lng: $lng, 
      image: $image, 
      description: $description, 
      difficulty: $difficulty, 
      estimatedHours: $estimatedHours,
      scheduledFor: $scheduledFor,
      squareMeters: $squareMeters,
      hasHighWeeds: $hasHighWeeds
    ) {
      id
      status
      pin
      price {
          total
      }
    }
  }
`;

export const NEARBY_REQUESTS = gql`
  query NearbyJobs($lat: Float!, $lng: Float!, $radius: Float) {
    nearbyJobs(lat: $lat, lng: $lng, radius: $radius) {
      id
      status
      totalPrice
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
    startJob(jobId: $jobId, pin: $pin)
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
  mutation CompleteJob($jobId: String!, $imageAfter: String!) {
    completeJob(jobId: $jobId, imageAfter: $imageAfter) {
      approved
      confidence
      feedback
    }
  }
`;

// --- CHAT ---

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

// --- SUBSCRIPTIONS ---

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
      totalPrice
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
