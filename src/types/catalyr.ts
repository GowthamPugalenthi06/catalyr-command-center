export type AgentRank = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export type AgentStatus = 'active' | 'pending' | 'idle' | 'offline';

export type Department = 
  | 'Executive'
  | 'Marketing'
  | 'Sales'
  | 'Finance'
  | 'Technology'
  | 'Operations'
  | 'Customer Service';

export interface Agent {
  id: string;
  name: string;
  role: string;
  department: Department;
  rank: AgentRank;
  status: AgentStatus;
  avatar: string;
  model?: string;
  tasksCompleted: number;
  currentTask?: string;
  performance: number;
}

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'stuck';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: Agent;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: Date;
  createdAt: Date;
  progress: number;
  tags: string[];
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  source: string;
  score: number;
  status: 'cold' | 'warm' | 'hot' | 'converted';
  createdAt: Date;
}

export interface ScheduleBlock {
  id: string;
  title: string;
  type: 'deep_work' | 'meeting' | 'admin' | 'break';
  startTime: Date;
  endTime: Date;
  agent?: Agent;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent?: Agent;
  status?: 'thinking' | 'complete';
}

export interface MetricCard {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}
