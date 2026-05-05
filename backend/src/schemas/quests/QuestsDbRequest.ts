import { QuestStatusEnum, QuestCategoryEnum, MilestoneStatusEnum, TaskStatusEnum, XpSourceTypeEnum } from "./QuestsEnum";

export interface GetQuestsDashboardDbRequest {
  userId: string;
  from: string;
  to: string;
}

export interface GetQuestDetailDbRequest {
  questId: string;
  userId: string;
}

export interface CreateQuestDbRequest {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: QuestCategoryEnum;
  color: string;
  status: QuestStatusEnum;
  deadline: string | null;
}

export interface UpdateQuestDbRequest {
  questId: string;
  userId: string;
  name?: string;
  description?: string | null;
  category?: QuestCategoryEnum;
  color?: string;
  status?: QuestStatusEnum;
  deadline?: string | null;
}

export interface CreateMilestoneDbRequest {
  quest_id: string;
  name: string;
  xp_reward: number;
  order: number;
  due_date: string | null;
}

export interface UpdateMilestoneDbRequest {
  milestoneId: number;
  name?: string;
  xp_reward?: number;
  due_date?: string | null;
  status?: MilestoneStatusEnum;
  order?: number;
}

export interface CreateTaskDbRequest {
  quest_id: string;
  milestone_id: number | null;
  name: string;
  xp_reward: number;
  due_date: string | null;
}

export interface UpdateTaskStatusDbRequest {
  taskId: number;
  status: TaskStatusEnum;
}

export interface InsertXpEventDbRequest {
  user_id: string;
  quest_id: string | null;
  source_type: XpSourceTypeEnum;
  source_id: number | null;
  xp: number;
}

export interface InsertAchievementDbRequest {
  user_id: string;
  achievement_key: string;
}

export interface UpdateStreakDbRequest {
  userId: string;
  today: string;
}
