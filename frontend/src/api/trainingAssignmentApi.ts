import { apiClient } from './apiClient';
import type {
  CreateAssignmentDTO,
  TrainingAssignment,
  DailyActivity,
  TodaysActivitiesResponse,
} from '../types/trainingAssignment';

export const trainingAssignmentApi = {
  // Create Training Assignment (POST /api/training-assignments)
  createAssignment: async (dto: CreateAssignmentDTO): Promise<TrainingAssignment> => {
    const response = await apiClient.post<{ success: boolean; data: TrainingAssignment }>(
      '/training-assignments',
      dto
    );
    return response.data.data;
  },

  // Approve Assignment (PUT /api/training-assignments/:id/approve)
  approveAssignment: async (id: number): Promise<TrainingAssignment> => {
    const response = await apiClient.put<{ success: boolean; data: TrainingAssignment }>(
      `/training-assignments/${id}/approve`
    );
    return response.data.data;
  },

  // Reject Assignment (PUT /api/training-assignments/:id/reject)
  rejectAssignment: async (id: number): Promise<TrainingAssignment> => {
    const response = await apiClient.put<{ success: boolean; data: TrainingAssignment }>(
      `/training-assignments/${id}/reject`
    );
    return response.data.data;
  },

  // Update Pending Assignment (PUT /api/training-assignments/:id)
  updateAssignment: async (id: number, dto: Partial<CreateAssignmentDTO>): Promise<TrainingAssignment> => {
    const response = await apiClient.put<{ success: boolean; data: TrainingAssignment }>(
      `/training-assignments/${id}`,
      dto
    );
    return response.data.data;
  },

  // Delete Pending Assignment (DELETE /api/training-assignments/:id)
  deleteAssignment: async (id: number): Promise<void> => {
    await apiClient.delete(`/training-assignments/${id}`);
  },

  // List Training Assignments (GET /api/training-assignments)
  getAssignments: async (): Promise<TrainingAssignment[]> => {
    const response = await apiClient.get<{ success: boolean; data: TrainingAssignment[] }>(
      '/training-assignments'
    );
    return response.data.data;
  },

  // Get Single Training Assignment Details (GET /api/training-assignments/:id)
  getAssignmentById: async (id: number): Promise<TrainingAssignment> => {
    const response = await apiClient.get<{ success: boolean; data: TrainingAssignment }>(
      `/training-assignments/${id}`
    );
    return response.data.data;
  },

  // Get Resource's Today's Activities (GET /api/resources/:resourceId/daily-activities?date=today)
  getTodaysActivities: async (resourceId: number): Promise<TodaysActivitiesResponse> => {
    const response = await apiClient.get<{ success: boolean; data: TodaysActivitiesResponse }>(
      `/resources/${resourceId}/daily-activities?date=today`
    );
    return response.data.data;
  },

  // Mark Daily Activity Complete (PUT /api/daily-activities/:id/complete)
  completeDailyActivity: async (
    activityId: number
  ): Promise<{ activity: DailyActivity; assignmentCompleted: boolean }> => {
    const response = await apiClient.put<{
      success: boolean;
      data: { activity: DailyActivity; assignmentCompleted: boolean };
    }>(`/daily-activities/${activityId}/complete`);
    return response.data.data;
  },
};
